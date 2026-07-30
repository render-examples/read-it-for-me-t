/** Explicit UI phase for the digest product flow. */

export type DigestPhase = "empty" | "running" | "partial" | "complete" | "error";

export type PhaseInput = {
  running: boolean;
  hasCards: boolean;
  hasResult: boolean;
  hasError: boolean;
  configLoaded: boolean;
};

/** Derive the dominant UI phase from run state. */
export function deriveDigestPhase(input: PhaseInput): DigestPhase {
  if (!input.configLoaded && input.hasError) return "error";
  if (input.running) return "running";
  if (input.hasError && input.hasCards) return "partial";
  if (input.hasError) return "error";
  if (input.hasResult) return "complete";
  if (input.hasCards) return "partial";
  return "empty";
}
