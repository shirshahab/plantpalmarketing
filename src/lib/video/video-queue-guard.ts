/** @deprecated Use @/lib/content/creative-routing-guard */
export {
  RAW_CREATIVE_BLOCKED_SOURCES as RAW_VIDEO_BLOCKED_SOURCES,
  VIDEO_CREATIVE_SOURCES as VIDEO_ALLOWED_SOURCES,
  isPollutedCreativeTitle as isPollutedVideoTitle,
  stripRawRedditPrefix,
  isCreativeReadyMetadata as isVideoReadyMetadata,
  canEnqueueToCreativeQueue as canEnqueueToVideoQueue,
  isVisibleCreativeQueueItem as isVisibleVideoQueueItem,
  creativeSourceLabel as videoSourceLabel,
  type CreativeQueueMetadata as VideoQueueMetadata,
} from "@/lib/content/creative-routing-guard";
