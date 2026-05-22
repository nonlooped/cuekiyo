import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
	id: string;
	message: string;
	variant: ToastVariant;
	duration?: number;
}

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const VARIANT_STYLES: Record<
	ToastVariant,
	{ border: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
	success: {
		border: "border-lime/30",
		bg: "bg-lime/10",
		text: "text-lime",
		icon: CheckCircle2,
	},
	error: {
		border: "border-danger/30",
		bg: "bg-danger/10",
		text: "text-danger",
		icon: XCircle,
	},
	info: {
		border: "border-white/15",
		bg: "bg-panel/80",
		text: "text-soft",
		icon: Info,
	},
};

function ToastCard({
	toast,
	onRemove,
}: {
	toast: ToastItem;
	onRemove: (id: string) => void;
}) {
	const reduced = useReducedMotion();
	const [progress, setProgress] = useState(1);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const startRef = useRef<number>(Date.now());
	const duration = toast.duration ?? (toast.variant === "error" ? 8000 : 5000);
	const rafRef = useRef<number>(0);

	const startDismiss = () => {
		startRef.current = Date.now();
		const tick = () => {
			const elapsed = Date.now() - startRef.current;
			const remaining = Math.max(0, 1 - elapsed / duration);
			setProgress(remaining);
			if (remaining > 0) {
				rafRef.current = requestAnimationFrame(tick);
			} else {
				onRemove(toast.id);
			}
		};
		rafRef.current = requestAnimationFrame(tick);
	};

	useEffect(() => {
		if (reduced) {
			timerRef.current = setTimeout(() => onRemove(toast.id), duration);
			return () => {
				if (timerRef.current) clearTimeout(timerRef.current);
			};
		}
		startDismiss();
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reduced]);

	const styles = VARIANT_STYLES[toast.variant];
	const Icon = styles.icon;
	const transition = reduced
		? { duration: 0 }
		: { duration: 0.3, ease: EASE_EXPO };

	const pause = () => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
	};

	const resume = () => {
		if (reduced) return;
		const elapsed = (1 - progress) * duration;
		startRef.current = Date.now() - elapsed;
		const tick = () => {
			const e = Date.now() - startRef.current;
			const remaining = Math.max(0, 1 - e / duration);
			setProgress(remaining);
			if (remaining > 0) {
				rafRef.current = requestAnimationFrame(tick);
			} else {
				onRemove(toast.id);
			}
		};
		rafRef.current = requestAnimationFrame(tick);
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 16, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, x: 24, scale: 0.95 }}
			transition={transition}
			role={toast.variant === "error" ? "alert" : "status"}
			onMouseEnter={pause}
			onMouseLeave={resume}
			className={[
				"pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-studio backdrop-blur-xl",
				styles.border,
				styles.bg,
			].join(" ")}
		>
			<Icon
				size={18}
				className={["mt-0.5 shrink-0", styles.text].join(" ")}
				aria-hidden="true"
			/>
			<div className="flex-1 min-w-0">
				<p className={["text-sm leading-snug", styles.text].join(" ")}>
					{toast.message}
				</p>
				{!reduced && (
					<div className="mt-2 h-px w-full overflow-hidden rounded-full bg-white/10">
						<motion.div
							className="h-full rounded-full"
							style={{
								backgroundColor:
									toast.variant === "success"
										? "var(--color-lime)"
										: toast.variant === "error"
											? "rgb(252 165 165)"
											: "var(--color-muted)",
								originX: "left",
							}}
							initial={{ scaleX: 1 }}
							animate={{ scaleX: progress }}
							transition={{ duration: 0 }}
						/>
					</div>
				)}
			</div>
			<button
				onClick={() => onRemove(toast.id)}
				aria-label="Dismiss notification"
				className="shrink-0 grid size-11 place-items-center rounded-lg text-muted hover:text-soft transition-colors"
			>
				<X size={14} aria-hidden="true" />
			</button>
		</motion.div>
	);
}

export default function ToastContainer({
	toasts,
	onRemove,
}: {
	toasts: ToastItem[];
	onRemove: (id: string) => void;
}) {
	return (
		<div
			aria-live="polite"
			aria-atomic="true"
			className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6"
		>
			<AnimatePresence mode="popLayout">
				{toasts.slice(0, 4).map((toast) => (
					<ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
				))}
			</AnimatePresence>
		</div>
	);
}
