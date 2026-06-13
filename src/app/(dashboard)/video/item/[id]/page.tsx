import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { VideoQueueItemDetail } from "@/components/video/video-queue-item-detail";
import { getVideoQueueItemById } from "@/lib/pipeline/video-queue";

export const dynamic = "force-dynamic";

export default async function VideoQueueItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getVideoQueueItemById(id);
  if (!item) notFound();

  return (
    <div>
      <PageHeader title="Video Concept" description="Review transformed video concept before script generation." />
      <Link href="/video" className="mb-4 inline-block text-sm text-brand-accent underline">
        Back to Video Studio
      </Link>
      <VideoQueueItemDetail item={item} />
    </div>
  );
}
