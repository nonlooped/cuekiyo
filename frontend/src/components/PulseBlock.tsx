import { motion, useReducedMotion } from "motion/react";

export default function PulseBlock({ className = "" }: { className?: string }) {
	const reduced = useReducedMotion();
	if (reduced) {
		return <div className={`rounded bg-white/[0.05] ${className}`} />;
	}
	return (
		<motion.div
			className={`rounded bg-white/[0.05] ${className}`}
			animate={{ opacity: [0.35, 0.65, 0.35] }}
			transition={{
				duration: 1.4,
				repeat: Infinity,
				ease: [0.4, 0, 0.6, 1],
			}}
		/>
	);
}
