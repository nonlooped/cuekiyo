import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api";
import { errorToMessage } from "@/lib/errors";
import {
	DEFAULT_PROJECT_DEFAULTS,
	loadProjectDefaults,
	saveProjectDefaults,
} from "@/lib/projectDefaults";
import type { PipelineSettings } from "@/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { NAV } from "@/lib/nav";

export default function SettingsPage() {
	const [defaults, setDefaults] = useState(loadProjectDefaults);
	const [pipeline, setPipeline] = useState<PipelineSettings | null>(null);
	const [binaries, setBinaries] = useState<
		Record<string, { available: boolean; detail: string }>
	>({});
	const [error, setError] = useState<string | null>(null);
	const [pipelineError, setPipelineError] = useState<string | null>(null);
	const [savingPipeline, setSavingPipeline] = useState(false);

	useEffect(() => {
		api
			.binaries()
			.then(setBinaries)
			.catch((e) => setError(errorToMessage(e)));
		api
			.getSettings()
			.then(setPipeline)
			.catch((e) => setPipelineError(errorToMessage(e)));
	}, []);

	const saveDefaults = () => {
		if (defaults.songTypes.length === 0) {
			toast.error("Select at least one song type");
			return;
		}
		saveProjectDefaults(defaults);
		toast.success("Defaults saved");
	};

	const resetDefaults = () => {
		setDefaults(DEFAULT_PROJECT_DEFAULTS);
		saveProjectDefaults(DEFAULT_PROJECT_DEFAULTS);
		toast.info("Defaults reset");
	};

	const savePipeline = async () => {
		if (!pipeline) return;
		setSavingPipeline(true);
		setPipelineError(null);
		try {
			const saved = await api.updateSettings(pipeline);
			setPipeline(saved);
			toast.success("Pipeline settings saved");
		} catch (e) {
			setPipelineError(errorToMessage(e));
			toast.error(errorToMessage(e));
		} finally {
			setSavingPipeline(false);
		}
	};

	return (
		<div className="flex flex-1 flex-col gap-8">
			<PageHeader
				title={NAV.settings}
				description="Pipeline tuning, defaults for new compilations, and local media tool health."
			/>

			<Tabs defaultValue="pipeline" className="w-full">
				<TabsList>
					<TabsTrigger value="pipeline">Pipeline</TabsTrigger>
					<TabsTrigger value="defaults">New compilation defaults</TabsTrigger>
					<TabsTrigger value="tools">Local tools</TabsTrigger>
				</TabsList>

				<TabsContent value="pipeline" className="mt-6 max-w-xl">
					{pipelineError && (
						<Alert variant="destructive" className="mb-4">
							<AlertDescription>{pipelineError}</AlertDescription>
						</Alert>
					)}
					{pipeline ? (
						<FieldGroup className="gap-6">
							<Field>
								<FieldLabel htmlFor="data-dir">Data directory</FieldLabel>
								<Input
									id="data-dir"
									value={pipeline.data_dir}
									onChange={(e) =>
										setPipeline((c) =>
											c ? { ...c, data_dir: e.target.value } : c,
										)
									}
								/>
							</Field>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="jikan-rate">
										Jikan rate limit (s)
									</FieldLabel>
									<Input
										id="jikan-rate"
										type="number"
										min={0.1}
										max={10}
										step={0.05}
										value={pipeline.jikan_rate_limit_seconds}
										onChange={(e) =>
											setPipeline((c) =>
												c
													? {
															...c,
															jikan_rate_limit_seconds: Number(
																e.target.value,
															),
														}
													: c,
											)
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="candidate-count">
										Candidates per song
									</FieldLabel>
									<Input
										id="candidate-count"
										type="number"
										min={1}
										max={20}
										value={pipeline.candidate_count}
										onChange={(e) =>
											setPipeline((c) =>
												c
													? { ...c, candidate_count: Number(e.target.value) }
													: c,
											)
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="youtube-workers">
										YouTube workers
									</FieldLabel>
									<Input
										id="youtube-workers"
										type="number"
										min={1}
										max={16}
										value={pipeline.youtube_workers}
										onChange={(e) =>
											setPipeline((c) =>
												c
													? { ...c, youtube_workers: Number(e.target.value) }
													: c,
											)
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="ffmpeg-workers">
										FFmpeg workers (0 = auto)
									</FieldLabel>
									<Input
										id="ffmpeg-workers"
										type="number"
										min={0}
										max={16}
										value={pipeline.ffmpeg_workers}
										onChange={(e) =>
											setPipeline((c) =>
												c
													? { ...c, ffmpeg_workers: Number(e.target.value) }
													: c,
											)
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="ffmpeg-crf">FFmpeg CRF</FieldLabel>
									<Input
										id="ffmpeg-crf"
										type="number"
										min={0}
										max={51}
										value={pipeline.ffmpeg_crf}
										onChange={(e) =>
											setPipeline((c) =>
												c ? { ...c, ffmpeg_crf: Number(e.target.value) } : c,
											)
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="ffmpeg-cq">FFmpeg CQ (NVENC)</FieldLabel>
									<Input
										id="ffmpeg-cq"
										type="number"
										min={0}
										max={51}
										value={pipeline.ffmpeg_cq}
										onChange={(e) =>
											setPipeline((c) =>
												c ? { ...c, ffmpeg_cq: Number(e.target.value) } : c,
											)
										}
									/>
								</Field>
								<Field className="sm:col-span-2">
									<FieldLabel htmlFor="stale-lock">
										Stale lock timeout (s)
									</FieldLabel>
									<Input
										id="stale-lock"
										type="number"
										min={30}
										max={3600}
										value={pipeline.stale_lock_seconds}
										onChange={(e) =>
											setPipeline((c) =>
												c
													? {
															...c,
															stale_lock_seconds: Number(e.target.value),
														}
													: c,
											)
										}
									/>
								</Field>
							</div>
							<div className="flex gap-2">
								<Button onClick={savePipeline} disabled={savingPipeline}>
									{savingPipeline ? "Saving…" : "Save"}
								</Button>
							</div>
						</FieldGroup>
					) : (
						<p className="text-sm text-muted-foreground">
							Loading pipeline settings…
						</p>
					)}
				</TabsContent>

				<TabsContent value="defaults" className="mt-6 max-w-xl">
					<FieldGroup className="gap-6">
						<div className="grid gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="default-songs">Songs</FieldLabel>
								<Input
									id="default-songs"
									type="number"
									min={1}
									max={50}
									value={defaults.songsCount}
									onChange={(e) =>
										setDefaults((c) => ({
											...c,
											songsCount: Number(e.target.value),
										}))
									}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="default-clip">Clip seconds</FieldLabel>
								<Input
									id="default-clip"
									type="number"
									min={3}
									value={defaults.clipTime}
									onChange={(e) =>
										setDefaults((c) => ({
											...c,
											clipTime: Number(e.target.value),
										}))
									}
								/>
							</Field>
						</div>
						<Field>
							<FieldLabel>Song types</FieldLabel>
							<ToggleGroup
								type="multiple"
								value={defaults.songTypes}
								onValueChange={(types) =>
									setDefaults((c) => ({ ...c, songTypes: types }))
								}
								variant="outline"
							>
								<ToggleGroupItem value="opening">Opening</ToggleGroupItem>
								<ToggleGroupItem value="ending">Ending</ToggleGroupItem>
							</ToggleGroup>
						</Field>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="default-encoder">Encoder</FieldLabel>
								<Select
									value={defaults.encoder}
									onValueChange={(encoder) =>
										setDefaults((c) => ({ ...c, encoder }))
									}
								>
									<SelectTrigger id="default-encoder">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="auto">Auto</SelectItem>
										<SelectItem value="libx264">H.264</SelectItem>
										<SelectItem value="h264_nvenc">NVENC H.264</SelectItem>
										<SelectItem value="hevc_nvenc">NVENC HEVC</SelectItem>
									</SelectContent>
								</Select>
							</Field>
							<Field orientation="horizontal">
								<Switch
									id="default-audio"
									checked={defaults.audioNormalize}
									onCheckedChange={(audioNormalize) =>
										setDefaults((c) => ({ ...c, audioNormalize }))
									}
								/>
								<FieldLabel htmlFor="default-audio">Normalize audio</FieldLabel>
							</Field>
						</div>
						<div className="flex gap-2">
							<Button onClick={saveDefaults}>Save</Button>
							<Button variant="outline" onClick={resetDefaults}>
								Reset
							</Button>
						</div>
					</FieldGroup>
				</TabsContent>

				<TabsContent value="tools" className="mt-6 flex flex-col gap-6">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<div className="overflow-hidden rounded-xl border border-border/80">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Binary</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Notes</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Object.entries(binaries).map(([name, check]) => (
									<TableRow key={name}>
										<TableCell className="font-medium">{name}</TableCell>
										<TableCell>
											<Badge variant={check.available ? "default" : "destructive"}>
												{check.available ? "OK" : "Missing"}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{check.detail}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<Separator />
					<div className="grid gap-4 md:grid-cols-3">
						{[
							{ name: "yt-dlp", cmd: "pip install yt-dlp" },
							{ name: "ffmpeg", cmd: "brew install ffmpeg" },
							{ name: "fonts", cmd: "apt install fonts-liberation" },
						].map(({ name, cmd }) => (
							<div key={name} className="flex flex-col gap-1">
								<span className="text-sm font-medium">{name}</span>
								<code className="rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
									{cmd}
								</code>
							</div>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
