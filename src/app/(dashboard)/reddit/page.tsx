import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { RedditPanel } from "@/components/reddit/reddit-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getRedditPageData } from "@/lib/db/reddit-queries";

export const dynamic = "force-dynamic";

const SETUP_STEPS = [
  "Create a Reddit account for PlantPal (suggested: PlantPalHQ, GetPlantPal, or PlantPalGardener).",
  "Warm up the account manually first: join r/houseplants, r/plantclinic, r/gardening and comment helpfully for a few days. No links, no promotion.",
  "Create a Reddit app at https://old.reddit.com/prefs/apps — type: script, name: PlantPal Marketing OS, redirect uri: http://localhost:3000/reddit/callback.",
  "Copy the client_id (under the app name) and client_secret.",
  "Add env vars: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT=plantpal-marketing-os/0.1 by u/YOUR_USERNAME.",
  "Add the same vars in Vercel → Settings → Environment Variables, then redeploy.",
  "Test read-only first: Check connection, then Scan subreddits.",
  "Test draft generation on a found question.",
  "Test approved reply posting (one reply, founder click).",
  "Keep founder approval required until at least 30 successful manual approvals.",
];

export default async function RedditPage() {
  const { data, error, configured } = await fetchPageData(getRedditPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Reddit" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reddit — Help-First Automation"
        description="Roots finds questions → drafts helpful replies → founder approves → reply posts. Hard safety limits, every action logged."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No spam, no mass commenting, no hidden automation. Respect subreddit rules and Reddit Developer Terms.
        Auto-posting stays off until the safety record is proven — every reply needs your click.
      </div>
      {error && <ErrorBanner message={error} />}
      {data && <RedditPanel data={data} />}

      <Card className="mt-6">
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Setup guide</h3>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-brand-muted">
            {SETUP_STEPS.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-brand-muted">
            Note: Reddit&apos;s API access and policies change. Always follow the current Reddit Developer Terms and
            Data API Terms, use OAuth, and respect rate limits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
