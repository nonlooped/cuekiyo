import { CheckCircle2, Circle, CircleAlert, Loader2, Minus, XCircle } from "lucide-react";
import type { ProjectStatus } from "../types";
import { getStatusCopy } from "../pipeline";

const TONE_CLASSES: Record<string, string> = {
  idle: "border-white/12 bg-white/[0.06] text-soft",
  running: "border-lime/40 bg-lime/10 text-lime",
  attention: "border-amber-300/35 bg-amber-300/10 text-amber-200",
  success: "border-emerald-300/35 bg-emerald-300/10 text-emerald-200",
  danger: "border-red-300/35 bg-red-300/10 text-red-200",
  muted: "border-white/10 bg-white/[0.04] text-muted",
};

const TONE_ICONS: Record<string, React.ReactNode> = {
  running: <Loader2 size={12} className="animate-spin" aria-hidden="true" />,
  attention: <CircleAlert size={12} aria-hidden="true" />,
  success: <CheckCircle2 size={12} aria-hidden="true" />,
  danger: <XCircle size={12} aria-hidden="true" />,
  idle: <Circle size={12} aria-hidden="true" />,
  muted: <Minus size={12} aria-hidden="true" />,
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const copy = getStatusCopy(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[copy.tone]}`}
    >
      {TONE_ICONS[copy.tone]}
      {copy.label}
    </span>
  );
}
