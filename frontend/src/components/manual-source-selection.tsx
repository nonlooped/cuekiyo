import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	LinkSquare01Icon,
	Tick02Icon,
	YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { api } from "@/api";
import { errorToMessage } from "@/lib/errors";
import { nextUnselectedSongId } from "@/lib/candidate-selection";
import { allManualSourcesSet } from "@/lib/manual-source-selection";
import { isValidYoutubeUrl } from "@/lib/youtube-url";
import { candidateThumbnail } from "@/lib/youtube";
import type { Candidate, Song } from "@/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDuration(seconds: number | null): string {
	if (seconds == null) return "Unknown length";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ManualSourceSelection({
	projectId,
	onDone,
}: {
	projectId: string;
	onDone: () => void;
}) {
	const [songs, setSongs] = useState<Song[]>([]);
	const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
	const [activeSongId, setActiveSongId] = useState<string | null>(null);
	const [urls, setUrls] = useState<Record<string, string>>({});
	const [urlErrors, setUrlErrors] = useState<Record<string, string | null>>({});
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		api
			.listSongs(projectId)
			.then(async (s) => {
				const map: Record<string, Candidate[]> = {};
				await Promise.all(
					s.map(async (song) => {
						map[song.id] = await api.listCandidates(projectId, song.id);
					}),
				);
				if (cancelled) return;
				setSongs(s);
				setCandidates(map);
				setActiveSongId(
					(current) =>
						current ??
						s.find((song) => !song.selected_candidate_id)?.id ??
						s[0]?.id ??
						null,
				);
			})
			.catch((e) => {
				if (cancelled) return;
				const msg = errorToMessage(e);
				setError(msg);
				toast.error(msg);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [projectId]);

	const submit = (songId: string) => {
		if (submitting) return;
		const url = (urls[songId] ?? "").trim();
		if (!url) {
			setUrlErrors((prev) => ({ ...prev, [songId]: "Paste a YouTube link." }));
			return;
		}
		if (!isValidYoutubeUrl(url)) {
			setUrlErrors((prev) => ({
				...prev,
				[songId]: "That does not look like a YouTube link.",
			}));
			return;
		}
		setUrlErrors((prev) => ({ ...prev, [songId]: null }));
		setSubmitting(true);
		api
			.submitManualSource(projectId, songId, url)
			.then(({ candidate }) => {
				setSongs((prev) =>
					prev.map((s) =>
						s.id === songId
							? { ...s, selected_candidate_id: candidate.id }
							: s,
					),
				);
				setCandidates((prev) => ({
					...prev,
					[songId]: [candidate],
				}));
				setUrls((prev) => ({ ...prev, [songId]: "" }));
				toast.success("Clip locked in");
				onDone();
				const nextSongId = nextUnselectedSongId(songs, songId);
				if (nextSongId) setActiveSongId(nextSongId);
			})
			.catch((e) => toast.error(errorToMessage(e)))
			.finally(() => setSubmitting(false));
	};

	const allSet = allManualSourcesSet(songs);

	if (loading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-9 w-full" />
				<Skeleton className="aspect-video w-full max-w-2xl rounded-xl" />
			</div>
		);
	}

	return (
		<section className="fcr-animate-up flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h2 className="font-heading text-xl font-semibold">Paste your links</h2>
				<p className="text-sm text-muted-foreground">
					One YouTube clip per song. We will fetch a preview before download
					starts.
				</p>
			</div>

			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}

			{allSet && (
				<div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
					All songs have a clip. Processing continues automatically.
				</div>
			)}

			<Tabs
				value={activeSongId ?? undefined}
				onValueChange={setActiveSongId}
				className="flex flex-col gap-4"
			>
				<TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
					{songs.map((song) => (
						<TabsTrigger
							key={song.id}
							value={song.id}
							className="gap-2 rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-muted"
						>
							<span className="max-w-[8rem] truncate">{song.song_title}</span>
							{song.selected_candidate_id && (
								<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
									OK
								</Badge>
							)}
						</TabsTrigger>
					))}
				</TabsList>

				{songs.map((song) => {
					const selected = candidates[song.id]?.find(
						(c) => c.id === song.selected_candidate_id,
					);
					const thumb = selected ? candidateThumbnail(selected) : null;

					return (
						<TabsContent
							key={song.id}
							value={song.id}
							className="mt-0 flex flex-col gap-4"
						>
							<div>
								<p className="font-medium">{song.song_title}</p>
								<p className="text-sm text-muted-foreground">{song.anime_name}</p>
							</div>

							{selected ? (
								<div className="flex max-w-2xl flex-col overflow-hidden rounded-xl border border-primary/40 shadow-[0_0_16px_oklch(from_var(--primary)_l_c_h_/0.08)]">
									<div className="relative aspect-video w-full shrink-0 bg-muted">
										{thumb ? (
											<img
												src={thumb}
												alt=""
												className="size-full object-cover"
												loading="lazy"
											/>
										) : (
											<div className="flex size-full items-center justify-center text-xs text-muted-foreground">
												No preview
											</div>
										)}
										<span
											aria-label="Selected"
											className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/0.25)]"
										>
											<HugeiconsIcon
												icon={Tick02Icon}
												strokeWidth={2.5}
												className="size-3.5 text-primary"
											/>
										</span>
									</div>
									<div className="flex flex-col gap-2 p-4">
										<div className="flex flex-wrap items-start gap-2">
											<span className="line-clamp-2 flex-1 text-sm font-medium leading-5">
												{selected.title}
											</span>
											{selected.is_manual && (
												<Badge variant="secondary" className="shrink-0">
													Your link
												</Badge>
											)}
										</div>
										<p className="text-xs text-muted-foreground tabular-nums">
											{formatDuration(selected.duration)}
										</p>
										<a
											href={selected.url}
											target="_blank"
											rel="noreferrer"
											className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
										>
											<HugeiconsIcon
												icon={LinkSquare01Icon}
												strokeWidth={2}
											/>
											YouTube
										</a>
									</div>
								</div>
							) : (
								<div className="flex max-w-xl flex-col gap-2">
									<InputGroup className="h-11">
										<InputGroupAddon align="inline-start">
											<HugeiconsIcon icon={YoutubeIcon} strokeWidth={2} />
										</InputGroupAddon>
										<InputGroupInput
											value={urls[song.id] ?? ""}
											onChange={(e) => {
												const value = e.target.value;
												setUrls((prev) => ({ ...prev, [song.id]: value }));
												if (urlErrors[song.id]) {
													setUrlErrors((prev) => ({
														...prev,
														[song.id]: null,
													}));
												}
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													void submit(song.id);
												}
											}}
											placeholder="Paste your link"
											aria-invalid={!!urlErrors[song.id]}
											aria-describedby={
												urlErrors[song.id]
													? `url-error-${song.id}`
													: undefined
											}
										/>
										<InputGroupAddon align="inline-end">
											<InputGroupButton
												onClick={() => submit(song.id)}
												disabled={submitting}
											>
												{submitting ? "Saving…" : "Use this clip"}
											</InputGroupButton>
										</InputGroupAddon>
									</InputGroup>
									{urlErrors[song.id] && (
										<p
											id={`url-error-${song.id}`}
											className="text-sm text-destructive"
											role="alert"
										>
											{urlErrors[song.id]}
										</p>
									)}
									{submitting && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<LoadingSpinner />
											Fetching preview&hellip;
										</div>
									)}
								</div>
							)}
						</TabsContent>
					);
				})}
			</Tabs>
		</section>
	);
}
