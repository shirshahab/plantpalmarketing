import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

interface AgentEntry {
  href: string;
  name: string;
  role: string;
  emoji: string;
}

const AGENTS: AgentEntry[] = [
  { href: "/ivy", name: "Ivy", role: "Chief of Staff", emoji: "🌿" },
  { href: "/creators", name: "Scout", role: "Creator CRM", emoji: "🧭" },
  { href: "/community", name: "Roots", role: "Community Listening", emoji: "🌱" },
  { href: "/bloom", name: "Bloom", role: "Content Production", emoji: "🌸" },
  { href: "/sage", name: "Sage", role: "Creative Director", emoji: "🪴" },
  { href: "/fern", name: "Fern", role: "Visual Designer", emoji: "🎨" },
  { href: "/atlas", name: "Atlas", role: "Head of Growth", emoji: "🗺️" },
  { href: "/oak", name: "Oak", role: "Partnerships", emoji: "🌳" },
  { href: "/echo", name: "Echo", role: "Voice of Customer", emoji: "📣" },
  { href: "/competitors", name: "Sentinel", role: "Competitor Intel", emoji: "📡" },
  { href: "/approvals", name: "Gate", role: "Approvals", emoji: "🛡️" },
  { href: "/sprout", name: "Sprout", role: "Publishing", emoji: "🚀" },
];

export default function AgentsDirectoryPage() {
  return (
    <div>
      <PageHeader
        title="Agents"
        description="Every PlantPal agent and their dedicated workspace."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent) => (
          <Link
            key={agent.href + agent.name}
            href={agent.href}
            className="group flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm transition hover:border-brand-accent/50 hover:shadow"
          >
            <span className="text-2xl leading-none">{agent.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-primary">{agent.name}</p>
              <p className="truncate text-xs text-brand-muted">{agent.role}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted transition group-hover:translate-x-0.5 group-hover:text-brand-accent" />
          </Link>
        ))}
      </div>
    </div>
  );
}
