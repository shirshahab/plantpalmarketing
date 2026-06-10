"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDailyReport } from "@/lib/actions/daily-report";

export function DailyReportGenerateButton({
  onGenerated,
}: {
  onGenerated?: (reportId: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<{ reportId: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setSuccess(null);
    setError(null);
    startTransition(async () => {
      const res = await generateDailyReport();
      if (res.ok) {
        setSuccess({ reportId: res.reportId, message: res.message });
        onGenerated?.(res.reportId);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={handleGenerate}
        className="border-violet-200 bg-white/90 text-violet-800 hover:bg-violet-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileBarChart className="h-3.5 w-3.5" />
        )}
        Generate Daily Report
      </Button>

      {success && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-emerald-200 bg-white p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="text-xs text-emerald-900">
              <p className="font-medium">Report saved</p>
              <p className="mt-1 text-emerald-800">{success.message}</p>
              <Link
                href="/daily-report"
                className="mt-2 inline-block font-semibold text-emerald-700 underline"
              >
                View /daily-report →
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-rose-200 bg-white p-3 text-xs text-rose-800 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
