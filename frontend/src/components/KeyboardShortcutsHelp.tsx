import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useShortcutsRegistry } from "../hooks/useKeyboardShortcuts";
import { isCommandPaletteOpen } from "./CommandPalette";

interface ShortcutGroup {
	category: string;
	items: {
		keys: string;
		description: string;
	}[];
}

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function getMod(): string {
	const isMac = navigator.platform.toLowerCase().includes("mac");
	return isMac ? "⌘" : "Ctrl";
}

export default function KeyboardShortcutsHelp() {
	const [show, setShow] = useState(false);
	const { register } = useShortcutsRegistry();
	const reduced = useReducedMotion();

	/* Register ? shortcut */
	useEffect(() => {
		const cleanup = register([
			{
				key: "?",
				description: "Show keyboard shortcuts",
				handler: () => {
					if (isCommandPaletteOpen()) return;
					setShow((s) => !s);
				},
			},
		]);
		return cleanup;
	}, [register]);

	/* Close on Esc */
	useEffect(() => {
		if (!show) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				setShow(false);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [show]);

	/* Trap focus on show */
	useEffect(() => {
		if (show) {
			const active = document.activeElement;
			setTimeout(() => {
				const closeBtn = document.getElementById("shortcuts-close-btn");
				closeBtn?.focus();
			}, 0);
			return () => {
				if (active instanceof HTMLElement) setTimeout(() => active.focus(), 0);
			};
		}
	}, [show]);

	const mod = getMod();

	const groups: ShortcutGroup[] = [
		{
			category: "Navigation",
			items: [
				{ keys: `${mod} Shift D`, description: "Go to Projects (dashboard)" },
				{ keys: `${mod} Shift N`, description: "New project" },
				{ keys: `${mod} Shift S`, description: "Go to Settings" },
				{ keys: `${mod} Shift P`, description: "Go to current project" },
			],
		},
		{
			category: "App",
			items: [
				{ keys: `${mod} K`, description: "Open command palette" },
				{ keys: `Esc`, description: "Close palettes / overlays" },
				{ keys: `?`, description: "Toggle this help panel" },
			],
		},
		{
			category: "Lists & Forms",
			items: [
				{ keys: `↑ / ↓`, description: "Navigate items" },
				{ keys: `Enter / Space`, description: "Select or toggle" },
				{ keys: `Tab`, description: "Move focus to next element" },
			],
		},
	];

	if (!show) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center bg-studio/70 px-4 pt-16 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) setShow(false);
			}}
			role="dialog"
			aria-modal="true"
			aria-label="Keyboard shortcuts"
		>
			<motion.div
				initial={{ opacity: 0, y: -8, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -8, scale: 0.98 }}
				transition={
					reduced ? { duration: 0 } : { duration: 0.15, ease: EASE_EXPO }
				}
				className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-panel/92 shadow-studio backdrop-blur-xl"
			>
				<div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
					<h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
					<button
						id="shortcuts-close-btn"
						onClick={() => setShow(false)}
						className="grid size-11 place-items-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-soft transition"
						aria-label="Close shortcuts"
					>
						<X size={16} aria-hidden="true" />
					</button>
				</div>

				<div className="max-h-[70vh] overflow-auto px-5 py-4">
					<div className="grid gap-6 sm:grid-cols-2">
						{groups.map((group) => (
							<div key={group.category}>
								<h3 className="type-label mb-2 text-lime">{group.category}</h3>
								<ul className="space-y-2">
									{group.items.map((item, i) => (
										<li
											key={`${group.category}-${i}`}
											className="flex items-center justify-between gap-4"
										>
											<span className="text-sm text-soft">
												{item.description}
											</span>
											<kbd className="shrink-0 whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-mono text-muted">
												{item.keys}
											</kbd>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>

					<div className="mt-6 border-t border-white/[0.08] pt-4 text-xs text-muted/60">
						<p>
							Shortcuts are disabled when typing in text fields, except for Esc
							and the command palette modifier. On Mac, use ⌘ (Command) as the
							modifier. On Windows/Linux, use Ctrl.
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
