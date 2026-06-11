import { PageHeader } from "@/components/ui/page-header";
import { VoiceTester } from "@/components/brand/voice-tester";
import {
  BANNED_PHRASES,
  BANNED_WORDS,
  BRAND_PERSONALITY,
  CONTENT_FORMULA,
  GOOD_EXAMPLES,
  PLATFORM_STYLES,
  VOICE_TEST_QUESTIONS,
  WE_ARE,
  WE_ARE_NOT,
} from "@/lib/brand/brand-brain";

export const metadata = { title: "Brand Brain — PlantPal OS" };

/**
 * Phase 36 — the PlantPal Brand Brain.
 * One brand. One personality. One voice. Every agent writes from this page.
 */
export default function BrandBrainPage() {
  return (
    <div>
      <PageHeader
        title="Brand Brain"
        description="The single source of truth for PlantPal's voice. Every agent — Bloom, Roots, Fern, Sage — writes from here. Nothing below 8/10 reaches founder approval."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Section title="Personality">
            <p className="text-sm text-brand-primary">{BRAND_PERSONALITY}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-brand-primary">
              {WE_ARE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title="We are not">
            <div className="flex flex-wrap gap-1.5">
              {WE_ARE_NOT.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </Section>

          <Section title="The bar — write like this">
            <ul className="space-y-2">
              {GOOD_EXAMPLES.map((example) => (
                <li
                  key={example}
                  className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm font-medium text-brand-primary"
                >
                  {example}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Content formula">
            <p className="whitespace-pre-line text-sm text-brand-primary">{CONTENT_FORMULA}</p>
          </Section>
        </div>

        <div className="space-y-4">
          <VoiceTester />

          <Section title="Banned words">
            <div className="flex flex-wrap gap-1.5">
              {BANNED_WORDS.map((word) => (
                <span
                  key={word}
                  className="rounded-full border border-brand-border bg-brand-bg px-2 py-0.5 text-[11px] font-semibold text-brand-muted line-through"
                >
                  {word}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Banned formats">
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-brand-primary">
              {BANNED_PHRASES.slice(0, 7).map((phrase) => (
                <li key={phrase}>&ldquo;{phrase}&rdquo;</li>
              ))}
            </ul>
          </Section>

          <Section title="Platform voices">
            <dl className="space-y-2 text-xs">
              {Object.entries(PLATFORM_STYLES).map(([platform, style]) => (
                <div key={platform}>
                  <dt className="font-bold uppercase tracking-wide text-brand-sage">{platform}</dt>
                  <dd className="text-brand-primary">{style}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="The voice test">
            <ul className="space-y-1 text-sm text-brand-primary">
              {VOICE_TEST_QUESTIONS.map((q) => (
                <li key={q}>• {q}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-semibold text-brand-muted">
              If any answer is no: reject. 10 = unmistakably PlantPal · 8 = acceptable · 7 = needs
              revision · 6 or lower = automatic rejection.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-bold text-brand-primary">{title}</h2>
      {children}
    </section>
  );
}
