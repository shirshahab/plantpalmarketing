"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { buildSchemaMarkup, countDraftWords, generateBlogDraft, renderBlogHtml } from "@/lib/seo/blog-engine";
import { checkBrandVoice } from "@/lib/seo/voice-checker";
import { upsertCalendarItem } from "@/lib/content-calendar/sync";
import { recordHandoff } from "@/lib/collaboration/handoff";
import { createCompanyOutput, recordCompanyDecision } from "@/lib/company-os/company-os";
import type { Json } from "@/lib/supabase/database.types";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const MIGRATION_HINT =
  "System setup is still finishing. This section will populate once the backend is ready.";

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

    // Phase 31A — register the draft as a company output
    await createCompanyOutput({
      agentId: "bloom",
      outputType: "seo_blog_post",
      title: draft.headline,
      summary: `${wordCount} words, voice score ${voice.score}/100, keyword "${kw.keyword}"`,
      sourceTable: "seo_blog_posts",
      sourceId: post.id,
      status: voice.passed ? "pending_approval" : "needs_rework",
      riskLevel: "low",
      approvalRequired: true,
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

    await recordCompanyDecision({
      decisionType: "blog_approval",
      decisionMaker: "founder",
      decision: "approved",
      reason: `Approved "${post.headline}" for publishing`,
      impactScore: 70,
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

    await recordCompanyDecision({
      decisionType: "blog_approval",
      decisionMaker: "founder",
      decision: "rejected",
      reason: reason || "Rejected by founder",
      impactScore: 40,
    });

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

/**
 * Phase 31 Step 6 — SEO Factory batch. Drafts up to `count` posts from the
 * keyword queue (target: 5-10/day). Each draft goes through the voice check
 * and lands in the pipeline for Gate approval. Nothing publishes itself.
 */
export async function runSeoFactoryBatch(count: number): Promise<Result> {
  const batchSize = Math.min(10, Math.max(1, count));
  try {
    const supabase = createServerClient();
    const { data: keywords, error } = await supabase
      .from("seo_blog_keywords")
      .select("id, keyword")
      .in("status", ["new", "queued"])
      .order("priority_score", { ascending: false })
      .limit(batchSize);
    if (error) {
      if (isMissingTableError(error)) return { ok: false, error: MIGRATION_HINT };
      return { ok: false, error: error.message };
    }
    if (!keywords || keywords.length === 0) {
      return { ok: false, error: "No queued keywords left. Add more on /seo or promote topics." };
    }

    let drafted = 0;
    let failed = 0;
    const notes: string[] = [];
    for (const kw of keywords) {
      const result = await writeBlogDraft(kw.id);
      if (result.ok) drafted += 1;
      else {
        failed += 1;
        notes.push(`${kw.keyword}: ${result.error}`);
      }
    }

    revalidatePath("/seo");
    revalidatePath("/blog-pipeline");
    return {
      ok: true,
      message: `Factory run complete — ${drafted} drafted${failed > 0 ? `, ${failed} failed (${notes[0]})` : ""}. Review them on /blog-pipeline.`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Factory run failed" };
  }
}

/** Promote a topic from the idea bank into the keyword queue. */
export async function promoteSeoTopic(topicId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: topic, error } = await supabase
      .from("seo_topics")
      .select("*")
      .eq("id", topicId)
      .maybeSingle();
    if (error || !topic) {
      return { ok: false, error: error && isMissingTableError(error) ? MIGRATION_HINT : (error?.message ?? "Topic not found") };
    }

    const { data: keyword, error: kwError } = await supabase
      .from("seo_blog_keywords")
      .insert({
        keyword: topic.topic,
        topic_cluster: topic.cluster_name,
        source: topic.source,
        search_volume_estimate: topic.search_volume_estimate,
        priority_score: 70,
        search_demand_notes: topic.question || topic.competition_note,
        status: "queued",
      })
      .select("id")
      .single();
    if (kwError) {
      if (kwError.message.includes("duplicate")) return { ok: false, error: "Keyword already in the queue" };
      return { ok: false, error: kwError.message };
    }

    await supabase.from("seo_topics").update({ status: "queued", keyword_id: keyword.id }).eq("id", topicId);
    revalidatePath("/seo");
    return { ok: true, message: "Topic promoted to the keyword queue" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Promote failed" };
  }
}

/** Add a topic idea to the bank (Roots/Sentinel/manual). */
export async function addSeoTopic(topic: string, clusterName: string, question: string): Promise<Result> {
  const cleaned = topic.trim().toLowerCase();
  if (cleaned.length < 3) return { ok: false, error: "Topic too short" };
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("seo_topics").insert({
      topic: cleaned,
      question: question.trim(),
      cluster_name: clusterName.trim() || "plant care",
      source: "manual",
      status: "idea",
    });
    if (error) {
      if (isMissingTableError(error)) return { ok: false, error: MIGRATION_HINT };
      if (error.message.includes("duplicate")) return { ok: false, error: "Topic already exists" };
      return { ok: false, error: error.message };
    }
    revalidatePath("/seo");
    return { ok: true, message: "Topic added to the bank" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add topic" };
  }
}

/** Manual workflow: founder pasted the post into the site and saves the URL. */
export async function markBlogPublished(postId: string, publishedUrl: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    let { data: post, error } = await supabase
      .from("seo_blog_posts")
      .update({ status: "published", published_url: publishedUrl.trim(), published_at: now, export_status: "published" })
      .eq("id", postId)
      .select("keyword_id, headline, internal_links")
      .single();
    if (error) {
      // Older schema without export_status (migration 053 not run yet)
      const fallback = await supabase
        .from("seo_blog_posts")
        .update({ status: "published", published_url: publishedUrl.trim(), published_at: now })
        .eq("id", postId)
        .select("keyword_id, headline, internal_links")
        .single();
      post = fallback.data;
      error = fallback.error;
    }
    if (error || !post) return { ok: false, error: error?.message ?? "Post not found" };

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
    revalidatePath("/seo/export");
    revalidatePath("/blog-pipeline");
    revalidatePath("/calendar");
    return { ok: true, message: "Marked as published" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark published" };
  }
}

/** Phase 32 — founder copied/downloaded the TS object for the public site. */
export async function markBlogExported(postId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("seo_blog_posts")
      .update({ export_status: "exported", exported_at: new Date().toISOString() })
      .eq("id", postId);
    if (error) {
      if (isMissingTableError(error) || error.message.includes("export_status")) {
        return { ok: false, error: "System setup is still finishing. Export tracking will work once the backend is ready." };
      }
      return { ok: false, error: error.message };
    }

    await logPublish({ post_id: postId, action: "website_export", status: "success" });
    await createCompanyOutput({
      agentId: "sprout",
      outputType: "website_blog_export",
      title: "Blog post exported for the public site",
      summary: "TypeScript object generated for src/lib/blog/posts.ts",
      sourceTable: "seo_blog_posts",
      sourceId: postId,
      status: "exported",
      approvalRequired: false,
    });

    revalidatePath("/seo/export");
    revalidatePath("/seo");
    return { ok: true, message: "Marked as exported" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark exported" };
  }
}

/** Phase 32 — save the website-facing metadata used by the TS export. */
export async function saveBlogExportMeta(
  postId: string,
  meta: { author: string; category: string; tags: string[]; featuredImage: string }
): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("seo_blog_posts")
      .update({
        author: meta.author.trim() || "PlantPal Team",
        category: meta.category.trim() || "Plant Care",
        tags: meta.tags.map((t) => t.trim()).filter(Boolean) as unknown as Json,
        featured_image: meta.featuredImage.trim(),
      })
      .eq("id", postId);
    if (error) {
      if (isMissingTableError(error) || error.message.includes("author")) {
        return { ok: false, error: "System setup is still finishing. Export tracking will work once the backend is ready." };
      }
      return { ok: false, error: error.message };
    }
    revalidatePath("/seo/export");
    return { ok: true, message: "Details saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save details" };
  }
}
