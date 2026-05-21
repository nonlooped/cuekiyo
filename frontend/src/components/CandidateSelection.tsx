import { useEffect, useState } from "react";
import { Check, ExternalLink, Film } from "lucide-react";
import { api } from "../api";
import type { Candidate, Song } from "../types";
import { errorToMessage } from "../lib/errors";

export default function CandidateSelection({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSongs = async () => {
    setLoading(true);
    setError(null);
    const s = await api.listSongs(projectId);
    const map: Record<string, Candidate[]> = {};
    await Promise.all(
      s.map(async (song) => {
        map[song.id] = await api.listCandidates(projectId, song.id);
      }),
    );
    setSongs(s);
    setCandidates(map);
    setActiveSongId((current) => current ?? s.find((song) => !song.selected_candidate_id)?.id ?? s[0]?.id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refreshSongs().catch((e) => {
      setError(errorToMessage(e));
      setLoading(false);
    });
  }, [projectId]);

  const select = async (songId: string, candidateId: string) => {
    await api.selectCandidate(projectId, songId, candidateId);
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, selected_candidate_id: candidateId } : s)),
    );
    setCandidates((prev) => ({
      ...prev,
      [songId]: (prev[songId] ?? []).map((c) => ({
        ...c,
        is_selected: c.id === candidateId,
      })),
    }));
    onDone();
  };

  const allSelected = songs.length > 0 && songs.every((s) => s.selected_candidate_id);
  const activeSong = songs.find((song) => song.id === activeSongId) ?? songs[0];
  const selectedCount = songs.filter((song) => song.selected_candidate_id).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-white/10 bg-panel/70 p-3">
        <div className="px-2 py-2">
          <h2 className="text-sm font-semibold">Candidate review</h2>
          <p className="mt-1 text-xs text-muted">
            {selectedCount} of {songs.length} selected
          </p>
        </div>
        <div className="mt-2 grid gap-1">
          {songs.map((song) => (
            <button
              key={song.id}
              onClick={() => setActiveSongId(song.id)}
              className={[
                "flex items-start gap-2 rounded-xl px-3 py-2 text-left text-sm",
                activeSong?.id === song.id ? "bg-lime/10 text-soft" : "text-muted hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-white/10">
                {song.selected_candidate_id ? <Check size={12} className="text-lime" aria-hidden="true" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{song.song_title}</span>
                <span className="block truncate text-xs text-muted">{song.anime_name}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-white/10 bg-panel/70">
        {loading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.07]" />
            ))}
          </div>
        )}
        {error && <p className="m-5 rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-200">{error}</p>}
        {!loading && activeSong && (
          <>
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-lime/10 text-lime">
                  <Film size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-medium">{activeSong.song_title}</h2>
                  <p className="mt-1 text-sm text-muted">{activeSong.anime_name}</p>
                </div>
              </div>
            </div>

            {(candidates[activeSong.id] ?? []).length === 0 ? (
              <div className="p-5">
                <h3 className="font-medium">No candidates found</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  This song needs a source before the pipeline can continue.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {(candidates[activeSong.id] ?? []).map((candidate) => {
                  const selected =
                    candidate.is_selected || activeSong.selected_candidate_id === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      onClick={() => select(activeSong.id, candidate.id)}
                      className={[
                        "overflow-hidden rounded-2xl border text-left transition",
                        selected
                          ? "border-lime/60 bg-lime/10"
                          : "border-white/10 bg-studio/45 hover:border-white/20",
                      ].join(" ")}
                    >
                      {candidate.thumbnail_url ? (
                        <img
                          src={candidate.thumbnail_url}
                          alt=""
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="grid aspect-video w-full place-items-center bg-white/[0.04] text-muted">
                          No thumbnail
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-medium">{candidate.title}</p>
                          {selected && <Check size={17} className="shrink-0 text-lime" aria-hidden="true" />}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted">
                          {candidate.uploader_name ?? "Unknown uploader"} ·{" "}
                          {candidate.view_count?.toLocaleString() ?? "?"} views ·{" "}
                          {candidate.duration ? `${Math.round(candidate.duration)}s` : "?"}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted">
                          <span>Confidence {candidate.score.toFixed(1)}</span>
                          <a
                            href={candidate.url}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-1 hover:text-lime"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Source <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
        {allSelected && (
          <p className="border-t border-white/10 p-4 text-sm text-lime">
            All candidates selected. Download will start automatically.
          </p>
        )}
      </section>
    </div>
  );
}
