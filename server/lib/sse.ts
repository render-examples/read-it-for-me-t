/** Server-Sent Events helpers for streaming digest progress to the browser. */
import type { Response } from "express";

/** Write one named SSE event and flush when the runtime supports it. */
export function writeSse(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const flush = (res as Response & { flush?: () => void }).flush;
  flush?.();
}

/** Open an SSE response with headers that disable proxy buffering. */
export function beginSse(res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  // Keep-alive comment so proxies do not buffer the first events.
  res.write(":ok\n\n");
}

/** Drain an async generator into the response; map thrown errors to `error` events. */
export async function streamSse(
  res: Response,
  generator: AsyncGenerator<{ event: string; data: unknown }>
): Promise<void> {
  beginSse(res);
  try {
    for await (const chunk of generator) {
      writeSse(res, chunk.event, chunk.data);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    writeSse(res, "error", { message });
  }
  res.end();
}
