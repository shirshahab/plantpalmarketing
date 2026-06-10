import { checkRateLimit } from "@/lib/integrations/rate-limit";
import { withRetry } from "@/lib/integrations/retry";
import { logIntegrationCall, updateProviderStatus } from "@/lib/integrations/log";
import type { IntegrationProvider } from "@/lib/integrations/types";

export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly provider: IntegrationProvider,
    public readonly rateLimited = false
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

export async function invokeIntegration<T>(opts: {
  provider: IntegrationProvider;
  action: string;
  agentId?: string;
  fn: () => Promise<T>;
  requestSummary?: string;
  summarize?: (result: T) => string;
}): Promise<T> {
  const rate = checkRateLimit(opts.provider);
  if (!rate.allowed) {
    await logIntegrationCall({
      provider: opts.provider,
      action: opts.action,
      status: "rate_limited",
      requestSummary: opts.requestSummary,
      errorMessage: `Rate limit exceeded. Retry in ${rate.retryAfterMs}ms`,
      agentId: opts.agentId,
    });
    throw new IntegrationError("Rate limit exceeded", opts.provider, true);
  }

  const start = Date.now();
  try {
    const result = await withRetry(opts.fn, { label: `${opts.provider}:${opts.action}` });
    const durationMs = Date.now() - start;
    await logIntegrationCall({
      provider: opts.provider,
      action: opts.action,
      status: "success",
      requestSummary: opts.requestSummary,
      responseSummary: opts.summarize ? opts.summarize(result) : "ok",
      durationMs,
      agentId: opts.agentId,
    });
    await updateProviderStatus(opts.provider, "connected", { success: true });
    return result;
  } catch (e) {
    const durationMs = Date.now() - start;
    const message = e instanceof Error ? e.message : "Unknown error";
    await logIntegrationCall({
      provider: opts.provider,
      action: opts.action,
      status: "error",
      requestSummary: opts.requestSummary,
      errorMessage: message,
      durationMs,
      agentId: opts.agentId,
    });
    await updateProviderStatus(opts.provider, "error", { errorMessage: message });
    throw e instanceof IntegrationError ? e : new IntegrationError(message, opts.provider);
  }
}
