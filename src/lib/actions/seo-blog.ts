"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { buildSchemaMarkup, countDraftWords, generateBlogDraft, renderBlogHtml } from "@/lib/seo/blog-engine";
import { checkBrandVoice } from "@/lib/seo/voice-checker";
import { upsertCalendarItem } from "@/lib/content-calendar/sync";
import { recordHandoff } from "@/lib/collaboration/handoff";
import type { Json } from "@/lib/supabase/database.types";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const MIGRATION_HINT =
  "SEO blog tables not found — run supabase/migrations/050_phase30_seo_blog.sql";

async function logPublish(row: {
  post_id: string;
  action: string;
  status: string;
  published_url?: string;
  error_message?: string;
}) {
  try {
    const supabase = createServerClient();
    await supabase.from("seo_blog_publish_logs").insert(row);
  } catch {
    // non-blocking
  }
}

export async function addSeoKeyword(keyword: string, topicCluster: string): Promise<Result> {
  const cleaned = keyword.trim().toLowerCase();
  if (cleaned.length < 3) return { ok: false, error: "Keyword too short" };
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("seo_blog_keywords").insert({
      keyword: cleaned,
      topic_cluster: topicCluster.trim() || "plant care",
      source: "manual",
      priority_score: 60,
    });
    if (error) {
      if (isMissingTableError(error)) return { ok: false, error: MIGRATION_HINT };
      if (error.message.includes("duplicate")) return { ok: false, error: "Keyword already exists" };
      return { ok: false, error: error.message };
    }
    revalidatePath("/seo");
    return { ok: true, message: "Keyword added" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add keyword" };
  }
}

/**
 * Bloom writes the draft, Sage runs the brand voice check.
 * Pass → gate_review (founder approves on /blog-pipeline).
 * Fail → voice_check_failed with the violation list.
 */
export async function writeBlogDraft(keywordId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: kw, error: kwError } = await supabase
      .from("seo_blog_keywords")
      .select("*")
      .eq("id", keywordId)
      .maybeSingle();
    if (kwError || !kw) {
      return { ok: false, error: kwError && isMissingTableError(kwError) ? MIGRATION_HINT : (kwError?.message ?? "Keyword not found") };
    }

    const { draft, aiUsed } = await generateBlogDraft(kw.keyword, kw.search_demand_notes);
    const wordCount = countDraftWords(draft);
    const voice = checkBrandVoice({
      headline: draft.headline,
      intro: draft.intro,
      sections: draft.sections,
      faq: draft.faq.map((f) => ({ question: f.question, answer: f.answer })),
      cta: draft.cta,
    });
    const html = renderBlogHtml(draft);
    const schema = buildSchemaMarkup(draft);
    const status = voice.passed ? "gate_review" : "voice_check_failed";

    const { data: post, error } = await supabase
      .from("seo_blog_posts")
      .insert({
        keyword_id: kw.id,
        keyword: kw.keyword,
        headline: draft.headline,
        seo_title: draft.seoTitle,
        meta_description: draft.metaDescription,
        slug: draft.slug,
        intro: draft.intro,
        sections: draft.sections as unknown as Json,
        faq: draft.faq as unknown as Json,
        cta: draft.cta,
        internal_links: draft.internalLinks as unknown as Json,
        html,
        schema_markup: schema as Json,
        word_count: wordCount,
        status,
        risk_level: "low",
        voice_check: voice as unknown as Json,
        voice_check_passed: voice.passed,
        source_agent: "bloom",
        metadata: { aiUsed } as Json,
      })
      .select("id")
      .single();
    if (error) {
      if (isMissingTableError(error)) return { ok: false, error: MIGRATION_HINT };
      if (error.message.includes("idx_seo_blog_posts_slug") || error.message.includes("duplicate")) {
        return { ok: false, error: "A draft with this slug already exists. Check /blog-pipeline." };
      }
      return { ok: false, error: error.message };
    }

    await supabase.from("seo_blog_keywords").update({ status: "drafted" }).eq("id", kw.id);

    await recordHandoff({
      fromAgent: "bloom",
      toAgent: voice.passed ? "gate" : "sage",
      workflowName: voice.passed ? "Bloom → Gate" : "Bloom → Sage",
      triggerType: "seo_blog_draft",
      triggerId: post.id,
      taskType: voice.passed ? "blog_approval" : "blog_voice_fix",
      taskDescription: voice.passed
        ? `Approve SEO blog draft: "${draft.headline}" (${wordCount} words, voice check passed)`
        : `Fix voice violations on "${draft.headline}": ${voice.violations.map((v) => v.rule).join(", ")}`,
      priority: "medium",
      messageTitle: voice.passed ? `Blog draft ready — ${kw.keyword}` : `Voice check failed — ${kw.keyword}`,
      messageBody: `Headline: ${draft.headline}\nWords: ${wordCount}\nVoice score: ${voice.score}/100${voice.violations.length ? `\nViolations:\n${voice.violations.map((v) => `- ${v.rule}: ${v.detail}`).join("\n")}` : ""}`,
      activityDetail: voice.passed
        ? `Bloom drafted SEO blog "${draft.headline}" — passed voice check, sent to Gate`
        : `Bloom drafted "${draft.headline}" — voice check failed (${voice.violations.map((v) => v.rule).join(", ")})`,
    });

    revalidatePath("/seo");
    revalidatePath("/blog-pipeline");
    return {
      ok: true,
      message: voice.passed
        ? `Draft written (${wordCount} words, voice score ${voice.score}) — awaiting approval${aiUsed ? "" : ". Template draft (no OpenAI key)."}`
        : `Draft written but FAILED voice check: ${voice.violations.map((v) => v.rule).join(", ")}. Rewrite it.`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Draft failed" };
  }
}

/** Regenerate a failed/rejected draft from its keyword. */
export async function rewriteBlogDraft(postId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: post, error: postError } = await supabase
      .from("seo_blog_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    if (postError || !post) return { ok: false, error: postError?.message ?? "Post not found" };

    const { draft, aiUsed } = await generateBlogDraft(
      post.keyword,
      post.review_feedback ? `Founder feedback on the last draft: ${post.review_feedback}` : ""
    );
    const wordCount = countDraftWords(draft);
    const voice = checkBrandVoice({
      headline: draft.headline,
      intro: draft.intro,
      sections: draft.sections,
      faq: draft.faq,
      cta: draft.cta,
    });

    const { error } = await supabase
      .from("seo_blog_posts")
      .update({
        headline: draft.headline,
        seo_title: draft.seoTitle,
        meta_description: draft.metaDescription,
        intro: draft.intro,
        sections: draft.sections as unknown as Json,
        faq: draft.faq as unknown as Json,
        cta: draft.cta,
        internal_links: draft.internalLinks as unknown as Json,
        html: renderBlogHtml(draft),
        schema_markup: buildSchemaMarkup(draft) as Json,
        word_count: wordCount,
        status: voice.passed ? "gate_review" : "voice_check_failed",
        voice_check: voice as unknown as Json,
        voice_check_passed: voice.passed,
        metadata: { aiUsed, rewritten: true } as Json,
      })
      .eq("id", postId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/blog-pipeline");
    return {
      ok: true,
      message: voice.passed
        ? `Rewritten (${wordCount} words, voice score ${voice.score}) — back in review`
        : `Rewritten but still failing: ${voice.violations.map((v) => v.rule).join(", ")}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Rewrite failed" };
  }
}

async function isAutoPublishEnabled(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("automation_rules")
      .select("enabled")
      .eq("rule_key", "seo_blog_auto_publish")
      .maybeSingle();
    return data?.enabled === true;
  } catch {
    return false;
  }
}

/**
 * Gate approval. Low-risk posts auto-publish ONLY when the
 * seo_blog_auto_publish automation rule is enabled AND a CMS is connected.
 * Everything else becomes ready_to_publish for manual copy/paste.
 */
export async function approveBlogPost(postId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: post, error: postError } = await supabase
      .from("seo_blog_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    if (postError || !post) return { ok: false, error: postError?.message ?? "Post not found" };

    const { error } = await supabase
      .from("seo_blog_posts")
      .update({ status: "ready_to_publish" })
      .eq("id", postId);
    if (error) return { ok: false, error: error.message };

    // Calendar stays the source of truth for approved content
    await upsertCalendarItem({
      title: post.headline || post.keyword,
      platform: "blog",
      contentType: "seo_blog",
      caption: post.meta_description,
      hook: post.headline,
      cta: post.cta,
      status: "ready_to_publish",
      approvalStatus: "approved",
      sourceAgent: "bloom",
      sourceTable: "seo_blog_posts",
      sourceId: post.id,
      copyText: post.html,
      metadata: {
        slug: post.slug,
        seoTitle: post.seo_title,
        metaDescription: post.meta_description,
        wordCount: post.word_count,
        autoPosting: false,
      },
    });

    await recordHandoff({
      fromAgent: "gate",
      toAgent: "sprout",
      workflowName: "Gate → Sprout",
      triggerType: "seo_blog_approved",
      triggerId: post.id,
      taskType: "blog_publish",
      taskDescription: `Publish approved blog "${post.headline}" (${post.slug})`,
      priority: "medium",
      messageTitle: `Blog approved — ${post.keyword}`,
      messageBody: `"${post.headline}" is approved and on the calendar. Publish it or copy the HTML package.`,
      activityDetail: `Gate approved SEO blog "${post.headline}" — handed to Sprout for publishing`,
    });

    // Optional auto-publish path (off by default)
    if (post.risk_level === "low" && (await isAutoPublishEnabled())) {
      const publishResult = await publishBlogToCms(postId);
      if (publishResult.ok) {
        revalidatePath("/blog-pipeline");
        return { ok: true, message: "Approved + auto-published (low risk, rule enabled)" };
      }
    }

    revalidatePath("/seo");
    revalidatePath("/blog-pipeline");
    revalidatePath("/calendar");
    return { ok: true, message: "Approved — ready to publish" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Approval failed" };
  }
}

export async function rejectBlogPost(postId: string, reason: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("seo_blog_posts")
      .update({ status: "rejected", review_feedback: reason || "Rejected by founder" })
      .eq("id", postId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/blog-pipeline");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reject failed" };
  }
}

export async function requestBlogRevision(postId: string, note: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: post, error } = await supabase
      .from("seo_blog_posts")
      .update({ status: "needs_revision", review_feedback: note || "Needs revision" })
      .eq("id", postId)
      .select("headline")
      .single();
    if (error) return { ok: false, error: error.message };

    await recordHandoff({
      fromAgent: "gate",
      toAgent: "bloom",
      workflowName: "Gate → Bloom",
      triggerType: "seo_blog_revision",
      triggerId: postId,
      taskType: "blog_revision",
      taskDescription: `Rewrite blog "${post.headline}". Founder notes: ${note || "see feedback"}`,
      priority: "high",
      messageTitle: "Blog revision requested",
      messageBody: `Founder feedback on "${post.headline}":\n\n${note || "Tighten it up."}`,
      activityDetail: `Founder sent blog "${post.headline}" back to Bloom`,
    });

    revalidatePath("/blog-pipeline");
    return { ok: true, message: "Sent back to Bloom" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Revision request failed" };
  }
}

/** Publish via CMS webhook when BLOG_CMS_WEBHOOK_URL is configured. */
export async function publishBlogToCms(postId: string): Promise<Result> {
  const webhook = process.env.BLOG_CMS_WEBHOOK_URL?.trim();
  if (!webhook) {
    return { ok: false, error: "No CMS connected. Copy the HTML package and paste it into your site." };
  }
  try {
    const supabase = createServerClient();
    const { data: post, error: postError } = await supabase
      .from("seo_blog_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    if (postError || !post) return { ok: false, error: postError?.message ?? "Post not found" };

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: post.slug,
        title: post.headline,
        seoTitle: post.seo_title,
        metaDescription: post.meta_description,
        html: post.html,
        schemaMarkup: post.schema_markup,
        keyword: post.keyword,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      await logPublish({ post_id: postId, action: "cms_publish", status: "failed", error_message: `CMS ${res.status}: ${body}` });
      return { ok: false, error: `CMS publish failed (${res.status}): ${body}` };
    }
    const json = (await res.json().catch(() => ({}))) as { url?: string };
    const url = json.url ?? `/blog/${post.slug}`;
    await markBlogPublished(postId, url);
    await logPublish({ post_id: postId, action: "cms_publish", status: "success", published_url: url });
    return { ok: true, message: `Published — ${url}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Publish failed";
    await logPublish({ post_id: postId, action: "cms_publish", status: "failed", error_message: msg });
    return { ok: false, error: msg };
  }
}

/** Manual workflow: founder pasted the post into the site and saves the URL. */
export async function markBlogPublished(postId: string, publishedUrl: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    const { data: post, error } = await supabase
      .from("seo_blog_posts")
      .update({ status: "published", published_url: publishedUrl.trim(), published_at: now })
      .eq("id", postId)
      .select("keyword_id, headline, internal_links")
      .single();
    if (error) return { ok: false, error: error.message };

    if (post.keyword_id) {
      await supabase.from("seo_blog_keywords").update({ status: "published" }).eq("id", post.keyword_id);
    }

    // Backlink tracker: this post's internal links become backlinks to the targets
    try {
      const links = Array.isArray(post.internal_links) ? post.internal_links : [];
      for (const link of links) {
        const l = (link && typeof link === "object" ? link : {}) as Record<string, unknown>;
        const targetSlug = String(l.url ?? "").replace(/^\/blog\//, "");
        if (!targetSlug) continue;
        const { data: target } = await supabase
          .from("seo_blog_posts")
          .select("id, backlinks")
          .eq("slug", targetSlug)
          .maybeSingle();
        if (!target) continue;
        const existing = Array.isArray(target.backlinks) ? target.backlinks : [];
        await supabase
          .from("seo_blog_posts")
          .update({
            backlinks: [
              ...existing,
              { url: publishedUrl.trim(), anchor: String(l.anchor ?? post.headline) },
            ] as unknown as Json,
          })
          .eq("id", target.id);
      }
    } catch {
      // backlink tracking is best-effort
    }

    // Calendar item → published
    try {
      await supabase
        .from("content_calendar")
        .update({ status: "published", published_at: now, platform_url: publishedUrl.trim() })
        .eq("source_table", "seo_blog_posts")
        .eq("source_id", postId);
    } catch {
      // calendar optional
    }

    await logPublish({ post_id: postId, action: "mark_published", status: "success", published_url: publishedUrl.trim() });
    revalidatePath("/seo");
    revalidatePath("/blog-pipeline");
    revalidatePath("/calendar");
    return { ok: true, message: "Marked as published" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark published" };
  }
}
