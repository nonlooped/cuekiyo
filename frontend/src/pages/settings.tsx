import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api";
import { errorToMessage } from "@/lib/errors";
import {
	DEFAULT_PROJECT_DEFAULTS,
	loadProjectDefaults,
	saveProjectDefaults,
} from "@/lib/projectDefaults";
import { getInstallHints } from "@/lib/install-hints";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { NAV } from "@/lib/nav";

export default function SettingsPage() {
	const [defaults, setDefaults] = useState(loadProjectDefaults);
	const [binaries, setBinaries] = useState<
		Record<string, { available: boolean; detail: string }>
	>({});
	const [error, setError] = useState<string | null>(null);
	const [loadingTools, setLoadingTools] = useState(true);
	const installHints = getInstallHints();

	useEffect(() => {
		let cancelled = false;
		api
			.binaries()
			.then((data) => {
				if (!cancelled) setBinaries(data);
			})
			.catch((e) => {
				if (!cancelled) setError(errorToMessage(e));
			})
			.finally(() => {
				if (!cancelled) setLoadingTools(false);
			});
		return () => {
			cancelled = true;
		};
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

	return (
		<div className="flex flex-1 flex-col gap-8">
			<PageHeader
				title={NAV.settings}
				description="Defaults for new compilations and health of local media tools on this machine."
			/>

			<Tabs defaultValue="defaults" className="w-full">
				<TabsList>
					<TabsTrigger value="defaults">New compilation defaults</TabsTrigger>
					<TabsTrigger value="tools">Local tools</TabsTrigger>
				</TabsList>

				<TabsContent value="defaults" className="mt-6 max-w-xl">
					<FieldGroup className="gap-6">
						<div className="grid gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="default-songs">Songs per compilation</FieldLabel>
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
								<FieldDescription>
									How many songs the app tries to include in each new edit.
								</FieldDescription>
							</Field>
							<Field>
								<FieldLabel htmlFor="default-clip">Clip length (seconds)</FieldLabel>
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
								<FieldDescription>
									Length of each clip in the final compilation.
								</FieldDescription>
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
							<FieldDescription>
								Which theme types to search when you start a new compilation.
							</FieldDescription>
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
								<FieldDescription>
									Video encoder for the final export. Auto picks the best option on
									your machine.
								</FieldDescription>
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
						<FieldDescription>
							Match clip loudness before the final render. Helpful when sources vary
							in volume.
						</FieldDescription>
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
					{loadingTools ? (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-10 w-full rounded-lg" />
							<Skeleton className="h-10 w-full rounded-lg" />
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
					) : (
						<div className="overflow-hidden rounded-xl border border-border/80">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Tool</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Notes</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{Object.entries(binaries).map(([name, check]) => (
										<TableRow key={name}>
											<TableCell className="font-medium">{name}</TableCell>
											<TableCell>
												<Badge
													variant={check.available ? "default" : "destructive"}
												>
													{check.available ? "Available" : "Missing"}
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
					)}
					<Separator />
					<div>
						<p className="mb-3 text-sm text-muted-foreground">
							Install commands for your platform. Restart the backend after installing
							new tools.
						</p>
						<div className="grid gap-4 md:grid-cols-3">
							{installHints.map(({ name, cmd, note }) => (
								<div key={name} className="flex flex-col gap-1.5">
									<span className="text-sm font-medium">{name}</span>
									{note && (
										<span className="text-xs text-muted-foreground">{note}</span>
									)}
									<pre className="overflow-x-auto rounded-md border bg-muted/30 px-2 py-1.5 font-mono text-xs whitespace-pre-wrap">
										{cmd}
									</pre>
								</div>
							))}
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						Advanced pipeline tuning (workers, quality, data directory) lives in{" "}
						<code className="rounded border bg-muted/30 px-1 py-0.5">.env</code>. See{" "}
						<code className="rounded border bg-muted/30 px-1 py-0.5">.env.example</code>{" "}
						in the repo root.
					</p>
				</TabsContent>
			</Tabs>
		</div>
	);
}
