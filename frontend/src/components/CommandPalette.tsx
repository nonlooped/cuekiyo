import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
	ArrowRight,
	Film,
	FolderKanban,
	Plus,
	RotateCcw,
	Search,
	Settings,
	Square,
	X,
} from "lucide-react";
import { useShortcutsRegistry } from "../hooks/useKeyboardShortcuts";
import { api } from "../api";
import { useToast } from "../hooks/useToast";
import type { Project, ProjectStatus } from "../types";
import { RUNNING_STATUSES } from "../pipeline";

/* ─── Types ─── */
type CommandCategory = "navigation" | "actions" | "projects";

interface Command {
	id: string;
	label: string;
	description?: string;
	category: CommandCategory;
	icon?: React.ReactNode;
	keywords: string[];
	shortcut?: string;
	action: () => void;
}

/* ─── Context ─── */
let _setOpen: ((v: boolean) => void) | null = null;
let _open = false;

export function openCommandPalette() {
	if (_setOpen) _setOpen(true);
	else _open = true;
}

export function closeCommandPalette() {
	if (_setOpen) _setOpen(false);
	else _open = false;
}

export function isCommandPaletteOpen() {
	return _open;
}

/* ─── Utils ─── */
function getOSModifier(): { ctrl?: boolean; meta?: boolean } {
	const isMac = navigator.platform.toLowerCase().includes("mac");
	return isMac ? { meta: true } : { ctrl: true };
}

function formatShortcutLabel(): string {
	const mod = getOSModifier();
	const isMac = navigator.platform.toLowerCase().includes("mac");
	if (mod.meta) return isMac ? "⌘K" : "Ctrl+K";
	return "Ctrl+K";
}

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CATEGORY_LABELS: Record<CommandCategory, string> = {
	navigation: "Navigate",
	actions: "Actions",
	projects: "Projects",
};

/* ─── Component ─── */
export default function CommandPalette() {
	const { addToast } = useToast();
	const navigate = useNavigate();
	const location = useLocation();
	const reduced = useReducedMotion();
	const { register } = useShortcutsRegistry();

	const [open, setOpenState] = useState(_open);
	const [query, setQuery] = useState("");
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedIdx, setSelectedIdx] = useState(0);
	const listRef = useRef<HTMLUListElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const shouldRefocus = useRef<HTMLElement | null>(null);

	const projectId = useMemo(() => {
		const m = location.pathname.match(/\/projects\/([^/]+)/);
		return m ? m[1] : undefined;
	}, [location.pathname]);

	/* Sync global open state */
	useEffect(() => {
		_setOpen = (v) => setOpenState(v);
		_open = open;
	}, [open]);

	/* Fetch projects for palette */
	useEffect(() => {
		if (!open) return;
		api
			.listProjects()
			.then(setProjects)
			.catch(() => {});
	}, [open]);

	/* Register global shortcut */
	useEffect(() => {
		const mod = getOSModifier();
		const cleanup = register([
			{
				...mod,
				key: "k",
				description: "Open command palette",
				handler: () => {
					setOpenState((prev) => !prev);
				},
			},
			{
				key: "esc",
				description: "Close command palette",
				allowInInputs: true,
				handler: () => setOpenState(false),
			},
		]);
		return cleanup;
	}, [register]);

	/* Trap focus on open, restore on close */
	useEffect(() => {
		if (open) {
			shouldRefocus.current = document.activeElement as HTMLElement | null;
			setTimeout(() => inputRef.current?.focus(), 0);
		} else {
			if (shouldRefocus.current instanceof HTMLElement) {
				setTimeout(() => shouldRefocus.current?.focus(), 0);
			}
			setQuery("");
			setSelectedIdx(0);
		}
	}, [open]);

	/* Build command list */
	const commands: Command[] = useMemo(() => {
		const cmd: Command[] = [];

		/* Navigation */
		cmd.push({
			id: "nav-dashboard",
			label: "Go to Projects",
			description: "Dashboard",
			category: "navigation",
			icon: <FolderKanban size={16} />,
			keywords: ["dashboard", "home", "projects", "list"],
			action: () => {
				navigate("/");
				setOpenState(false);
			},
		});
		cmd.push({
			id: "nav-new",
			label: "New project",
			description: "Create a new compilation",
			category: "navigation",
			icon: <Plus size={16} />,
			keywords: ["create", "new", "project", "start"],
			action: () => {
				navigate("/projects/new");
				setOpenState(false);
			},
		});
		cmd.push({
			id: "nav-settings",
			label: "Go to Settings",
			description: "Defaults and diagnostics",
			category: "navigation",
			icon: <Settings size={16} />,
			keywords: ["settings", "diagnostics", "tools", "binaries", "defaults"],
			action: () => {
				navigate("/settings");
				setOpenState(false);
			},
		});

		/* Actions */
		cmd.push({
			id: "act-reload",
			label: "Reload page",
			description: "Refresh the application",
			category: "actions",
			keywords: ["reload", "refresh", "page"],
			action: () => {
				window.location.reload();
			},
		});

		/* Contextual project actions */
		const activeProject =
			projects.find((p) => p.id === projectId) || projects[0];
		if (activeProject) {
			const running = RUNNING_STATUSES.has(activeProject.status);
			if (activeProject.status === "DRAFT") {
				cmd.push({
					id: "act-load-themes",
					label: `Load themes for "${activeProject.title}"`,
					category: "actions",
					icon: <Film size={16} />,
					keywords: ["load", "themes", activeProject.title],
					action: () => {
						api
							.loadThemes(activeProject.id)
							.then(() => {
								addToast("Themes loading", "success");
								if (location.pathname !== `/projects/${activeProject.id}`) {
									navigate(`/projects/${activeProject.id}`);
								}
							})
							.catch(() => addToast("Failed to load themes", "error"));
						setOpenState(false);
					},
				});
			}
			if (activeProject.status === "FAILED") {
				cmd.push({
					id: "act-retry",
					label: `Retry failed stage for "${activeProject.title}"`,
					category: "actions",
					icon: <RotateCcw size={16} />,
					keywords: ["retry", "failed", activeProject.title],
					action: () => {
						api
							.retry(activeProject.id)
							.then(() => {
								addToast("Retrying failed stage", "success");
								if (location.pathname !== `/projects/${activeProject.id}`) {
									navigate(`/projects/${activeProject.id}`);
								}
							})
							.catch(() => addToast("Retry failed", "error"));
						setOpenState(false);
					},
				});
			}
			if (running) {
				cmd.push({
					id: "act-cancel",
					label: `Cancel project "${activeProject.title}"`,
					category: "actions",
					icon: <Square size={16} />,
					keywords: ["cancel", "stop", activeProject.title],
					action: () => {
						api
							.cancel(activeProject.id)
							.then(() => {
								addToast("Project cancelled", "info");
							})
							.catch(() => addToast("Failed to cancel", "error"));
						setOpenState(false);
					},
				});
			}
		}

		/* Projects */
		for (const p of projects.filter((p) => p.id !== projectId).slice(0, 10)) {
			cmd.push({
				id: `proj-${p.id}`,
				label: p.title,
				description: getStatusLabel(p.status),
				category: "projects",
				icon: <FolderKanban size={16} />,
				keywords: [p.title, "project"],
				action: () => {
					navigate(`/projects/${p.id}`);
					setOpenState(false);
				},
			});
		}

		return cmd;
	}, [projects, projectId, navigate, location.pathname, addToast]);

	/* Filter commands */
	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return commands;
		return commands.filter(
			(c) =>
				c.label.toLowerCase().includes(q) ||
				(c.description?.toLowerCase().includes(q) ?? false) ||
				c.keywords.some((k) => k.toLowerCase().includes(q)),
		);
	}, [commands, query]);

	/* Group filtered */
	const grouped = useMemo(() => {
		const map = new Map<CommandCategory, Command[]>();
		for (const c of filtered) {
			const arr = map.get(c.category) ?? [];
			arr.push(c);
			map.set(c.category, arr);
		}
		const order: CommandCategory[] = ["navigation", "actions", "projects"];
		return order
			.filter((k) => map.has(k))
			.map((k) => ({ category: k, items: map.get(k)! }));
	}, [filtered]);

	/* Flat index for keyboard nav */
	const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

	/* Keep selected index in bounds */
	useEffect(() => {
		setSelectedIdx((i) => Math.min(i, Math.max(0, flatItems.length - 1)));
	}, [flatItems.length]);

	/* Scroll selected into view */
	useEffect(() => {
		const el = listRef.current?.querySelector(
			`[data-cmd-index="${selectedIdx}"]`,
		);
		if (el) el.scrollIntoView({ block: "nearest" });
	}, [selectedIdx]);

	/* Keyboard handlers inside palette */
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedIdx((i) => Math.min(i + 1, flatItems.length - 1));
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedIdx((i) => Math.max(i - 1, 0));
			} else if (event.key === "Enter" && flatItems[selectedIdx]) {
				event.preventDefault();
				flatItems[selectedIdx].action();
			}
		},
		[flatItems, selectedIdx],
	);

	if (!open) return null;

	let flatIdx = -1;

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center bg-studio/70 px-4 pt-24 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) setOpenState(false);
			}}
			role="dialog"
			aria-modal="true"
			aria-label="Command palette"
		>
			<motion.div
				initial={{ opacity: 0, y: -8, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -8, scale: 0.98 }}
				transition={
					reduced ? { duration: 0 } : { duration: 0.15, ease: EASE_EXPO }
				}
				className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-panel/92 shadow-studio backdrop-blur-xl"
			>
				{/* Header */}
				<div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
					<Search
						size={16}
						className="text-muted shrink-0"
						aria-hidden="true"
					/>
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Type a command or search..."
						className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
						aria-autocomplete="list"
						aria-controls="cmd-list"
						aria-activedescendant={
							flatItems[selectedIdx] ? `cmd-item-${selectedIdx}` : undefined
						}
					/>
					<div className="hidden items-center gap-1.5 sm:flex">
						<kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-muted">
							Esc
						</kbd>
						<span className="text-[10px] text-muted/60">to close</span>
					</div>
					<button
						onClick={() => setOpenState(false)}
						className="grid size-11 place-items-center text-muted hover:text-soft"
					>
						<X size={16} aria-hidden="true" />
					</button>
				</div>

				{/* Results */}
				<ul
					id="cmd-list"
					ref={listRef}
					role="listbox"
					className="max-h-[60vh] overflow-auto py-2"
				>
					{grouped.length === 0 && (
						<li className="px-4 py-6 text-center text-sm text-muted">
							No commands found for “{query}”.
						</li>
					)}
					{grouped.map((group) => (
						<li key={group.category}>
							<p className="type-label px-4 py-1.5 text-muted/60">
								{CATEGORY_LABELS[group.category]}
							</p>
							<ul role="group" aria-label={CATEGORY_LABELS[group.category]}>
								{group.items.map((cmd) => {
									flatIdx++;
									const idx = flatIdx;
									const isActive = idx === selectedIdx;
									return (
										<li
											key={cmd.id}
											id={`cmd-item-${idx}`}
											data-cmd-index={idx}
											role="option"
											aria-selected={isActive}
											onClick={() => {
												cmd.action();
											}}
											onMouseEnter={() => setSelectedIdx(idx)}
											className={[
												"mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
												isActive
													? "bg-white/[0.08] text-soft"
													: "text-muted hover:text-soft",
											].join(" ")}
										>
											<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted">
												{cmd.icon || <ArrowRight size={14} />}
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium">
													{cmd.label}
												</span>
												{cmd.description && (
													<span className="block truncate type-label text-muted/60">
														{cmd.description}
													</span>
												)}
											</span>
											{cmd.shortcut && (
												<kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted/50 sm:inline-block">
													{cmd.shortcut}
												</kbd>
											)}
										</li>
									);
								})}
							</ul>
						</li>
					))}
				</ul>

				{/* Footer hint */}
				<div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 text-[10px] text-muted/50">
					<span className="flex items-center gap-1.5">
						<span className="hidden sm:inline">Use</span>
						<kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5">
							↑
						</kbd>
						<kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5">
							↓
						</kbd>
						<span className="hidden sm:inline">to navigate · press</span>
						<kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5">
							Enter
						</kbd>
						<span className="hidden sm:inline">to run</span>
					</span>
					<span className="hidden gap-1.5 sm:flex items-center">
						Shortcuts:
						<kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5">
							{formatShortcutLabel()}
						</kbd>
						&middot;
						<kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5">
							?
						</kbd>
					</span>
				</div>
			</motion.div>
		</div>
	);
}

function getStatusLabel(status: ProjectStatus): string {
	if (RUNNING_STATUSES.has(status)) return "Running";
	if (status === "COMPLETED") return "Done";
	if (status === "FAILED") return "Failed";
	if (status === "CANCELLED") return "Stopped";
	return status.replace(/_/g, " ").toLowerCase();
}
