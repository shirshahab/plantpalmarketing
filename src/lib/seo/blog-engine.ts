import { callOpenAIJson } from "@/lib/openai/client";
import { isOpenAIConfigured } from "@/lib/openai/config";

export interface BlogDraft {
  headline: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  intro: string;
  sections: { subhead: string; body: string }[];
  faq: { question: string; answer: string }[];
  cta: string;
  internalLinks: { anchor: string; url: string }[];
}

const VOICE_SYSTEM_PROMPT = `You write SEO blog posts for PlantPal, a plant care app that diagnoses sick plants from a photo.

Brand voice rules (non-negotiable):
- Short. Direct. No fluff.
- Funny and a little edgy. Liquid Death energy, but for plants.
- Helpful first. Every section gives a practical answer.
- Never use generic AI language ("delve", "furthermore", "in conclusion", "in today's fast-paced world").
- NEVER use em dashes. Use periods or commas instead.
- No corporate gardening nonsense ("leverage", "comprehensive guide", "elevate your space").
- Short sentences. Punchy subheads. Jokes that land, not puns that hurt.
- 500 to 900 words total.

Structure:
- Clear headline that answers the search
- Fast intro (2-3 sentences max, get to the point)
- 3-5 sections with funny subheads and practical answers
- FAQ section (3-4 real questions people search)
- CTA to download PlantPal and scan their plant

Return strict JSON:
{
  "headline": string,
  "seoTitle": string (under 60 chars, includes the keyword),
  "metaDescription": string (under 155 chars, makes people click),
  "slug": string (kebab-case),
  "intro": string,
  "sections": [{ "subhead": string, "body": string }],
  "faq": [{ "question": string, "answer": string }],
  "cta": string,
  "internalLinks": [{ "anchor": string, "url": string }]
}

For internalLinks, suggest 2-3 links to other PlantPal blog topics using urls like /blog/<slug-of-related-topic>.`;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/** Strip any em dashes the model sneaks in. */
function scrub(text: string): string {
  return text.replace(/\s*—\s*/g, ". ").replace(/\s*–\s*/g, ", ");
}

function scrubDraft(draft: BlogDraft): BlogDraft {
  return {
    ...draft,
    headline: scrub(draft.headline),
    seoTitle: scrub(draft.seoTitle),
    metaDescription: scrub(draft.metaDescription),
    intro: scrub(draft.intro),
    sections: draft.sections.map((s) => ({ subhead: scrub(s.subhead), body: scrub(s.body) })),
    faq: draft.faq.map((f) => ({ question: scrub(f.question), answer: scrub(f.answer) })),
    cta: scrub(draft.cta),
  };
}

/**
 * Bloom writes the draft. Uses OpenAI when configured; otherwise a punchy
 * template draft so the pipeline still works end to end.
 */
export async function generateBlogDraft(keyword: string, demandNotes: string): Promise<{
  draft: BlogDraft;
  aiUsed: boolean;
}> {
  if (isOpenAIConfigured()) {
    const draft = await callOpenAIJson<BlogDraft>(
      VOICE_SYSTEM_PROMPT,
      `Write the blog post for the search keyword: "${keyword}".\nSearch demand notes: ${demandNotes || "none"}.\nRemember: 500-900 words, funny, direct, zero em dashes.`,
      0.9
    );
    return {
      draft: scrubDraft({
        ...draft,
        slug: draft.slug ? slugify(draft.slug) : slugify(keyword),
        sections: Array.isArray(draft.sections) ? draft.sections : [],
        faq: Array.isArray(draft.faq) ? draft.faq : [],
        internalLinks: Array.isArray(draft.internalLinks) ? draft.internalLinks : [],
      }),
      aiUsed: true,
    };
  }

  // Template fallback — keeps the pipeline testable without a key
  const title = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  return {
    aiUsed: false,
    draft: {
      headline: `${title}? Here's the actual answer`,
      seoTitle: `${title} | PlantPal`.slice(0, 60),
      metaDescription: `${title}? Skip the 3000-word lectures. Here's what's wrong and how to fix it today.`.slice(0, 155),
      slug: slugify(keyword),
      intro: `Your plant is being dramatic. Good news: the fix is usually simple. Here's what's actually going on and what to do about it today.`,
      sections: [
        {
          subhead: "The short version",
          body: `Most cases of "${keyword}" come down to three things: water, light, or roots. Check the soil two inches down. Soggy means stop watering. Bone dry means start. Crispy leaf edges usually mean light or humidity. Mushy stems mean root trouble, and that one needs action today, not next weekend.`,
        },
        {
          subhead: "Stop guessing, start checking",
          body: `Lift the pot. Heavy means wet. Light means dry. Look under the leaves for pests, they love hiding there like tiny freeloaders. Check the drainage hole. If roots are circling out of it, your plant outgrew its apartment months ago.`,
        },
        {
          subhead: "What to do this week",
          body: `Fix one thing at a time. Change the watering OR the light, not both at once. Plants hate surprise makeovers. Give it a week, then reassess. New growth means you won. Continued drama means scan it with PlantPal and get a real diagnosis instead of guessing.`,
        },
      ],
      faq: [
        { question: `Is ${keyword} always serious?`, answer: "No. One weird leaf is normal. A pattern across the plant is a problem worth fixing." },
        { question: "How fast will my plant recover?", answer: "Two to four weeks for visible improvement. Plants move slow. Patience beats panic repotting." },
        { question: "Can PlantPal actually diagnose this?", answer: "Yes. Snap a photo of the leaf, get a diagnosis and a fix in seconds. Free to try." },
      ],
      cta: "Stop googling symptoms at 1am. Download PlantPal, scan your plant, and get the actual answer in seconds.",
      internalLinks: [
        { anchor: "overwatering vs underwatering", url: "/blog/overwatering-vs-underwatering" },
        { anchor: "how to save a dying plant", url: "/blog/how-to-save-a-dying-plant" },
      ],
    },
  };
}

export function countDraftWords(draft: BlogDraft): number {
  const text = [
    draft.headline,
    draft.intro,
    ...draft.sections.flatMap((s) => [s.subhead, s.body]),
    ...draft.faq.flatMap((f) => [f.question, f.answer]),
    draft.cta,
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Full HTML package, ready to paste into any CMS. */
export function renderBlogHtml(draft: BlogDraft): string {
  const sections = draft.sections
    .map((s) => `  <h2>${escapeHtml(s.subhead)}</h2>\n  <p>${escapeHtml(s.body)}</p>`)
    .join("\n");
  const faq = draft.faq
    .map((f) => `    <h3>${escapeHtml(f.question)}</h3>\n    <p>${escapeHtml(f.answer)}</p>`)
    .join("\n");
  const links = draft.internalLinks
    .map((l) => `    <li><a href="${escapeHtml(l.url)}">${escapeHtml(l.anchor)}</a></li>`)
    .join("\n");

  return `<article>
  <h1>${escapeHtml(draft.headline)}</h1>
  <p>${escapeHtml(draft.intro)}</p>
${sections}
  <section class="faq">
  <h2>FAQ</h2>
${faq}
  </section>
${links ? `  <section class="related">\n  <h2>Keep reading</h2>\n  <ul>\n${links}\n  </ul>\n  </section>\n` : ""}  <p class="cta"><strong>${escapeHtml(draft.cta)}</strong></p>
</article>`;
}

/** FAQPage JSON-LD schema markup. */
export function buildSchemaMarkup(draft: BlogDraft): Record<string, unknown> {
  if (draft.faq.length === 0) return {};
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: draft.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
