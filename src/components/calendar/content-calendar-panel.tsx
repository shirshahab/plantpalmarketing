"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  ExternalLink,
  ImageOff,
  Rocket,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  CalendarDayStats,
  CalendarPlatform,
  CalendarStatus,
  ContentAsset,
  ContentCalendarItem,
  ContentPublishLog,
} from "@/lib/types";
import { CalendarItemDrawer } from "./calendar-item-drawer";
import {
  ALL_PLATFORMS,
  ALL_STATUSES,
  PLATFORM_META,
  STATUS_META,
  getPlatformMeta,
  getStatusMeta,
  addDays,
  formatDay,
  formatTime,
  isSameDay,
  itemDate,
  itemNeedsAsset,
  itemsOnDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "./calendar-utils";

type CalendarView = "month" | "week" | "day" | "list";

function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      title="Copy caption"
      disabled={!text}
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-brand-bg hover:text-brand-primary disabled:opacity-40"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand-accent" /> : <Clipboard className="h-3.5 w-3.5" />}
    </button>
  );
}

function StatChip({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <CardContent className="flex items-center gap-3 px-4 py-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tone === "warning" ? "bg-amber-50 text-amber-600" : tone === "success" ? "bg-brand-accent/15 text-brand-primary" : "bg-brand-primary/10 text-brand-primary"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="font-heading text-xl font-semibold text-brand-primary">{value}</p>
          <p className="text-xs text-brand-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemChip({ item, onClick }: { item: ContentCalendarItem; onClick: () => void }) {
  const platform = getPlatformMeta(item.platform);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-brand-bg"
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: platform.color }} />
      <span className="shrink-0 text-[10px] text-brand-muted">{formatTime(item.scheduledFor)}</span>
      <span className="truncate text-brand-primary">{item.title || item.hook || item.caption}</span>
      {itemNeedsAsset(item) && <ImageOff className="h-3 w-3 shrink-0 text-amber-500" />}
    </button>
  );
}

function ItemCard({
  item,
  onOpen,
}: {
  item: ContentCalendarItem;
  onOpen: () => void;
}) {
  const platform = getPlatformMeta(item.platform);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="cursor-pointer rounded-xl border border-brand-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {item.assetUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.assetUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          ) : (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
              style={{ color: platform.color, backgroundColor: platform.bg }}
            >
              {platform.label.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-brand-primary">
              {item.title || item.hook || item.caption || "Untitled"}
            </p>
            <p className="text-[11px] text-brand-muted">
              {formatTime(item.scheduledFor)} · {platform.label} · {item.sourceAgent}
              {item.assetType !== "none" && item.assetType ? ` · ${item.assetType}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InlineCopyButton text={item.caption} />
          {(item.platformUrl || platform.url) && (
            <a
              href={item.platformUrl || platform.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-brand-bg hover:text-brand-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      {item.hook && <p className="mb-1.5 line-clamp-1 text-xs text-brand-muted">{item.hook}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={getStatusMeta(item.status).badge}>{getStatusMeta(item.status).label}</Badge>
        <Badge
          variant={
            item.approvalStatus === "approved" ? "success" : item.approvalStatus === "rejected" ? "danger" : "muted"
          }
        >
          {(item.approvalStatus ?? "pending").replace("_", " ")}
        </Badge>
        {item.cta && <span className="truncate text-[11px] text-brand-muted">CTA: {item.cta}</span>}
      </div>
    </div>
  );
}

const CALENDAR_VIEWS: CalendarView[] = ["month", "week", "day", "list"];

export function ContentCalendarPanel({
  items,
  assets,
  publishLogs,
  stats,
  xPublishConfigured,
  initialPlatform,
  initialStatus,
  initialView,
}: {
  items: ContentCalendarItem[];
  assets: ContentAsset[];
  publishLogs: ContentPublishLog[];
  stats: CalendarDayStats;
  xPublishConfigured: boolean;
  initialPlatform?: string;
  initialStatus?: string;
  initialView?: string;
}) {
  const [view, setView] = useState<CalendarView>(() =>
    CALENDAR_VIEWS.includes(initialView as CalendarView) ? (initialView as CalendarView) : "month"
  );
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [platformFilter, setPlatformFilter] = useState<CalendarPlatform | "all">(
    () => (initialPlatform as CalendarPlatform) || "all"
  );
  const [statusFilter, setStatusFilter] = useState<CalendarStatus | "all">(
    () => (initialStatus as CalendarStatus) || "all"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (platformFilter === "all" || i.platform === platformFilter) &&
          (statusFilter === "all" || i.status === statusFilter)
      ),
    [items, platformFilter, statusFilter]
  );

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const today = startOfDay(new Date());

  const navigate = (dir: -1 | 1) => {
    if (view === "month") {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
    } else if (view === "week") {
      setAnchor(addDays(anchor, dir * 7));
    } else {
      setAnchor(addDays(anchor, dir));
    }
  };

  const rangeLabel =
    view === "month"
      ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : view === "week"
        ? `Week of ${formatDay(startOfWeek(anchor))}`
        : view === "day"
          ? anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
          : "All content";

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatChip label="Scheduled today" value={stats.scheduledToday} icon={<Send className="h-4 w-4" />} />
        <StatChip label="Ready to publish" value={stats.readyToPublish} icon={<Rocket className="h-4 w-4" />} tone="success" />
        <StatChip label="Missing assets" value={stats.missingAssets} icon={<ImageOff className="h-4 w-4" />} tone="warning" />
        <StatChip label="Posted today" value={stats.postedToday} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <StatChip label="Approved" value={stats.approved} icon={<Check className="h-4 w-4" />} />
        <StatChip label="Overdue" value={stats.overdue} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-1 rounded-lg bg-brand-bg p-1">
            {(["month", "week", "day", "list"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  view === v ? "bg-white text-brand-primary shadow-sm" : "text-brand-muted hover:text-brand-primary"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {view !== "list" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAnchor(startOfDay(new Date()))}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-1 text-sm font-medium text-brand-primary">{rangeLabel}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as CalendarPlatform | "all")}
              className="rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-sm text-brand-primary focus:outline-none"
            >
              <option value="all">All platforms</option>
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_META[p].label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CalendarStatus | "all")}
              className="rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-sm text-brand-primary focus:outline-none"
            >
              <option value="all">All statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Month view */}
      {view === "month" && (
        <Card>
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-7 gap-px">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  {d}
                </div>
              ))}
              {(() => {
                const first = startOfWeek(startOfMonth(anchor));
                return Array.from({ length: 42 }, (_, i) => {
                  const day = addDays(first, i);
                  const dayItems = itemsOnDay(filtered, day);
                  const inMonth = day.getMonth() === anchor.getMonth();
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={i}
                      className={`min-h-[96px] rounded-lg border p-1.5 ${
                        isToday
                          ? "border-brand-accent bg-brand-accent/5"
                          : inMonth
                            ? "border-brand-border bg-white"
                            : "border-transparent bg-brand-bg/50"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setAnchor(day);
                          setView("day");
                        }}
                        className={`mb-1 rounded px-1 text-xs font-medium ${
                          isToday ? "bg-brand-accent text-white" : inMonth ? "text-brand-primary" : "text-brand-muted/60"
                        } hover:underline`}
                      >
                        {day.getDate()}
                      </button>
                      <div className="space-y-0.5">
                        {dayItems.slice(0, 3).map((item) => (
                          <ItemChip key={item.id} item={item} onClick={() => setSelectedId(item.id)} />
                        ))}
                        {dayItems.length > 3 && (
                          <button
                            onClick={() => {
                              setAnchor(day);
                              setView("day");
                            }}
                            className="px-1.5 text-[10px] text-brand-muted hover:text-brand-primary"
                          >
                            +{dayItems.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week view */}
      {view === "week" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => {
            const day = addDays(startOfWeek(anchor), i);
            const dayItems = itemsOnDay(filtered, day);
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className={`rounded-2xl border p-2 ${isToday ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-white"}`}>
                <button
                  onClick={() => {
                    setAnchor(day);
                    setView("day");
                  }}
                  className="mb-2 w-full text-left text-xs font-semibold text-brand-primary hover:underline"
                >
                  {formatDay(day)}
                </button>
                <div className="space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="px-1 text-[11px] text-brand-muted">No posts</p>
                  ) : (
                    dayItems.map((item) => <ItemCard key={item.id} item={item} onOpen={() => setSelectedId(item.id)} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day view — the "Monday view": every channel posting that day */}
      {view === "day" &&
        (() => {
          const dayItems = itemsOnDay(filtered, anchor);
          const approvedCount = dayItems.filter((i) => i.approvalStatus === "approved").length;
          const readyCount = dayItems.filter((i) => i.status === "ready_to_publish").length;
          const assetsNeeded = dayItems.filter(itemNeedsAsset);
          const platformsToday = ALL_PLATFORMS.filter((p) => dayItems.some((i) => i.platform === p));
          return (
            <div className="space-y-4">
              <Card>
                <CardContent className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
                  <span className="font-medium text-brand-primary">
                    {dayItems.length} post{dayItems.length === 1 ? "" : "s"} across {platformsToday.length} channel{platformsToday.length === 1 ? "" : "s"}
                  </span>
                  <Badge variant="success">{approvedCount} approved</Badge>
                  <Badge variant="info">{readyCount} ready to publish</Badge>
                  <Badge variant={assetsNeeded.length > 0 ? "warning" : "muted"}>
                    {assetsNeeded.length} asset{assetsNeeded.length === 1 ? "" : "s"} needed
                  </Badge>
                </CardContent>
              </Card>

              {assetsNeeded.length > 0 && (
                <Card className="border-amber-200">
                  <CardContent className="px-4 py-3">
                    <p className="mb-2 text-sm font-semibold text-amber-700">Assets needed today</p>
                    <ul className="space-y-1">
                      {assetsNeeded.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm text-brand-primary">
                          <ImageOff className="h-3.5 w-3.5 text-amber-500" />
                          <button onClick={() => setSelectedId(item.id)} className="truncate hover:underline">
                            {getPlatformMeta(item.platform).label}: {item.title || item.hook} ({item.assetType})
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {dayItems.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-brand-muted">
                    Nothing scheduled for this day.
                  </CardContent>
                </Card>
              ) : (
                platformsToday.map((p) => {
                  const platform = getPlatformMeta(p);
                  const platformItems = dayItems.filter((i) => i.platform === p);
                  return (
                    <Card key={p}>
                      <CardContent className="px-4 py-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ color: platform.color, backgroundColor: platform.bg }}
                          >
                            {platform.label}
                          </span>
                          <span className="text-xs text-brand-muted">
                            {platformItems.length} post{platformItems.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {platformItems.map((item) => (
                            <ItemCard key={item.id} item={item} onOpen={() => setSelectedId(item.id)} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          );
        })()}

      {/* List view */}
      {view === "list" && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-brand-muted">
                No content matches these filters yet. Approve content in Gate to fill the calendar.
              </CardContent>
            </Card>
          ) : (
            [...filtered]
              .sort((a, b) => {
                const da = itemDate(a)?.getTime() ?? 0;
                const db = itemDate(b)?.getTime() ?? 0;
                return da - db;
              })
              .map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-right text-xs text-brand-muted">
                    {item.scheduledFor
                      ? new Date(item.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
                        " " +
                        formatTime(item.scheduledFor)
                      : "Unscheduled"}
                  </span>
                  <div className="flex-1">
                    <ItemCard item={item} onOpen={() => setSelectedId(item.id)} />
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {selected && (
        <CalendarItemDrawer
          item={selected}
          assets={assets}
          publishLogs={publishLogs}
          xPublishConfigured={xPublishConfigured}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
