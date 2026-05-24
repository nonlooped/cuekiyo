import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowDown01Icon,
	Image01Icon,
	Loading03Icon,
	ViewIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { api } from "@/api";
import { errorToMessage } from "@/lib/errors";
import { mergeOverlayConfig } from "@/lib/overlay-config";
import type { OverlayConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type OverlaySettingsProps = {
	config: OverlayConfig;
	onChange: (config: OverlayConfig) => void;
};

const STYLE_OPTIONS = [
	{ value: "default" as const, label: "Default", desc: "Full lower-third card" },
	{ value: "minimal" as const, label: "Minimal", desc: "Compact text only" },
] as const;

const POSITION_OPTIONS = [
	{ value: "bottom" as const, label: "Bottom", desc: "Standard placement" },
	{ value: "top" as const, label: "Top", desc: "Upper edge" },
] as const;

const SHOW_OPTIONS = [
	{
		key: "show_anime_name" as const,
		label: "Anime name",
		desc: "Show title on the overlay",
	},
	{
		key: "show_song_line" as const,
		label: "Song line",
		desc: "OP/ED number and song title",
	},
	{
		key: "show_meta_line" as const,
		label: "Meta line",
		desc: "Views and uploader",
	},
] as const;

export function OverlaySettings({ config, onChange }: OverlaySettingsProps) {
	const [open, setOpen] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewing, setPreviewing] = useState(false);

	const update = (partial: Partial<OverlayConfig>) => {
		onChange(mergeOverlayConfig({ ...config, ...partial }));
		setPreviewUrl(null);
	};

	const preview = async () => {
		setPreviewing(true);
		try {
			const { png_base64 } = await api.previewOverlay({
				width: 1280,
				height: 720,
				config,
			});
			setPreviewUrl(`data:image/png;base64,${png_base64}`);
		} catch (e) {
			toast.error(errorToMessage(e));
		} finally {
			setPreviewing(false);
		}
	};

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="max-w-xl">
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
						"fcr-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						open
							? "border-primary/30 bg-primary/[0.04]"
							: "border-border/70 bg-card/40 hover:border-border hover:bg-card/60",
					)}
				>
					<div
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
							config.enabled
								? "bg-primary/20 text-primary"
								: "bg-muted/60 text-muted-foreground",
						)}
					>
						<HugeiconsIcon icon={ViewIcon} strokeWidth={1.5} className="size-4" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold">Lower-third overlay</p>
						<p className="text-xs text-muted-foreground">
							{config.enabled
								? `${config.style === "minimal" ? "Minimal" : "Default"} · ${config.position}`
								: "Off — no text on clips"}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
								config.enabled
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground",
							)}
						>
							{config.enabled ? "On" : "Off"}
						</span>
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							strokeWidth={2}
							className={cn(
								"size-4 text-muted-foreground transition-transform duration-200",
								open && "rotate-180",
							)}
						/>
					</div>
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent className="mt-3 flex flex-col gap-6 rounded-xl border border-border/60 bg-card/30 p-4 fcr-animate-up">
				<button
					type="button"
					role="switch"
					aria-checked={config.enabled}
					aria-label="Toggle lower-third overlay"
					onClick={() => update({ enabled: !config.enabled })}
					className={cn(
						"flex items-center gap-4 rounded-lg border p-3 text-left transition-all duration-200",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						config.enabled
							? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20"
							: "border-border/60 bg-card/20 hover:border-border hover:bg-card/40",
					)}
				>
					<div
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
							config.enabled
								? "bg-primary/20 text-primary"
								: "bg-muted/60 text-muted-foreground",
						)}
					>
						<HugeiconsIcon icon={Image01Icon} strokeWidth={1.5} className="size-4" />
					</div>
					<div className="flex flex-col gap-0.5">
						<p className="text-sm font-semibold">Show overlay on clips</p>
						<p className="text-xs text-muted-foreground">
							Anime name, song info, and source details on each segment.
						</p>
					</div>
				</button>

				<fieldset
					disabled={!config.enabled}
					className="flex flex-col gap-6 disabled:opacity-50"
				>
					<div className="flex flex-col gap-3">
						<span className="text-sm font-medium">Style</span>
						<div className="grid grid-cols-2 gap-2">
							{STYLE_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									aria-label={`Select ${opt.label} overlay style`}
									onClick={() => update({ style: opt.value })}
									className={cn(
										"flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
										config.style === opt.value
											? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20"
											: "border-border/60 bg-card/30 hover:border-border hover:bg-card/50",
									)}
								>
									<span className="text-xs font-semibold">{opt.label}</span>
									<span className="text-[10px] text-muted-foreground">
										{opt.desc}
									</span>
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<span className="text-sm font-medium">Position</span>
						<div className="grid grid-cols-2 gap-2">
							{POSITION_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									aria-label={`Place overlay at ${opt.label.toLowerCase()}`}
									onClick={() => update({ position: opt.value })}
									className={cn(
										"flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
										config.position === opt.value
											? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20"
											: "border-border/60 bg-card/30 hover:border-border hover:bg-card/50",
									)}
								>
									<span className="text-xs font-semibold">{opt.label}</span>
									<span className="text-[10px] text-muted-foreground">
										{opt.desc}
									</span>
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<span className="text-sm font-medium">Show</span>
						<div className="flex flex-col gap-2">
							{SHOW_OPTIONS.map((opt) => (
								<label
									key={opt.key}
									className={cn(
										"flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
										config[opt.key]
											? "border-primary/30 bg-primary/[0.04]"
											: "border-border/60 bg-card/20 hover:bg-card/40",
									)}
								>
									<Checkbox
										checked={config[opt.key]}
										onCheckedChange={(checked) =>
											update({ [opt.key]: checked === true })
										}
										aria-label={opt.label}
										className="mt-0.5"
									/>
									<div className="flex flex-col gap-0.5">
										<span className="text-xs font-semibold">{opt.label}</span>
										<span className="text-[10px] text-muted-foreground">
											{opt.desc}
										</span>
									</div>
								</label>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void preview()}
								disabled={previewing || !config.enabled}
							>
								{previewing ? (
									<HugeiconsIcon
										icon={Loading03Icon}
										strokeWidth={2}
										className="size-4 animate-spin"
										data-icon="inline-start"
									/>
								) : (
									<HugeiconsIcon
										icon={Image01Icon}
										strokeWidth={2}
										data-icon="inline-start"
									/>
								)}
								{previewing ? "Generating…" : "Preview overlay"}
							</Button>
							<FieldDescription>
								Sample text at 720p — final render uses your project resolution.
							</FieldDescription>
						</div>
						{previewUrl ? (
							<div className="overflow-hidden rounded-lg border border-border/60 bg-black/80">
								<img
									src={previewUrl}
									alt="Overlay preview on a dark frame"
									className="aspect-video w-full object-contain"
								/>
							</div>
						) : null}
					</div>
				</fieldset>
			</CollapsibleContent>
		</Collapsible>
	);
}
