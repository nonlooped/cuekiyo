export function errorToMessage(err: unknown): string {
  if (err instanceof Response || (err && typeof err === "object" && "status" in err)) {
    const status = (err as { status: number }).status;
    if (status === 0 || status === undefined) return "Lost connection to the local backend. Is it running?";
    if (status >= 500) return "The backend returned an error. Check the project logs.";
    if (status === 404) return "That resource was not found. Try refreshing.";
    if (status === 403) return "Access denied.";
    return `Unexpected response (${status}). Try refreshing.`;
  }
  if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
    return "Lost connection to the local backend. Is it running?";
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.length < 120 && !msg.includes("TypeError") && !msg.includes("SyntaxError") && !msg.includes("at ")) {
      return msg;
    }
  }
  return "Something went wrong. Check the project logs for details.";
}
