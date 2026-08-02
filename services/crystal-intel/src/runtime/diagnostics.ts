export type DiagnosticLevel = "INFO" | "WARN" | "ERROR";

export interface DiagnosticEvent {
  level: DiagnosticLevel;
  event: string;
  timestamp?: string;
  [key: string]: unknown;
}

export function recordDiagnostic(input: DiagnosticEvent): void {
  const event = JSON.stringify({
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  });

  if (input.level === "ERROR") {
    console.error(event);
  } else if (input.level === "WARN") {
    console.warn(event);
  } else {
    console.log(event);
  }
}

export const errorMessage = (error: unknown): string =>
  String(error).slice(0, 500);
