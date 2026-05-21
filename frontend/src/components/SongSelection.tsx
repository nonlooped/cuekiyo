import { useEffect, useState } from "react";
import { Music2 } from "lucide-react";
import { api } from "../api";
import type { Project, ThemeSong } from "../types";
import { errorToMessage } from "../lib/errors";

export default function SongSelection({ project, onDone }: { project: Project; onDone: () => void }) {
  const [themes, setThemes] = useState<ThemeSong[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmFewer, setConfirmFewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .listThemes(project.id)
      .then(setThemes)
      .catch((e) => setError(errorToMessage(e)))
      .finally(() => setLoading(false));
  }, [project.id]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < project.songs_count) next.add(id);
    setSelected(next);
  };

  const submit = async () => {
    const picks = themes.filter((t) => selected.has(t.id));
    const animeMap = Object.fromEntries(project.animes.map((a) => [a.anime_mal_id, a.anime_name]));
    await api.selectSongs(project.id, {
      confirm_fewer: confirmFewer,
      songs: picks.map((t) => ({
        anime_mal_id: t.anime_mal_id,
        anime_name: animeMap[t.anime_mal_id] ?? "Unknown",
        song_type: t.song_type,
        song_number: t.song_number,
        song_title: t.song_title,
        artist: t.artist,
        raw_theme_text: t.raw_text,
      })),
    });
    onDone();
  };

  const grouped = themes.reduce<Record<string, ThemeSong[]>>((acc, t) => {
    const key = `${t.anime_mal_id}-${t.song_type}`;
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  const canSubmit =
    selected.size === project.songs_count || (confirmFewer && selected.size > 0 && selected.size < project.songs_count);

  return (
    <div className="rounded-2xl border border-white/10 bg-panel/70">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <Music2 size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-medium">Review songs</h2>
            <p className="mt-1 text-sm text-muted">
              Select {project.songs_count} songs. {selected.size} selected.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-2 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.07]" />
          ))}
        </div>
      )}
      {error && <p className="m-5 rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-200">{error}</p>}
      {!loading && themes.length === 0 && (
        <div className="p-5">
          <h3 className="font-medium">No matching themes found</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Try a different anime selection or song type in a new project.
          </p>
        </div>
      )}

      <div className="divide-y divide-white/10">
        {Object.entries(grouped).map(([key, items]) => (
          <section key={key} className="p-5">
            <h3 className="mb-3 text-sm font-medium capitalize">{items[0].song_type}s</h3>
            <ul className="grid gap-2">
              {items.map((theme) => (
                <li key={theme.id}>
                  <label
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                      selected.has(theme.id)
                        ? "border-lime/50 bg-lime/10"
                        : "border-white/10 bg-studio/45 hover:border-white/20",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.has(theme.id)}
                      onChange={() => toggle(theme.id)}
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {theme.song_type === "opening" ? "OP" : "ED"}
                        {theme.song_number}: {theme.song_title}
                      </span>
                      {theme.artist && <span className="mt-1 block text-xs text-muted">{theme.artist}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-24 flex flex-col gap-3 border-t border-white/10 bg-panel/95 p-4 backdrop-blur-xl md:bottom-4 md:flex-row md:items-center md:justify-between">
        {selected.size < project.songs_count ? (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={confirmFewer} onChange={(e) => setConfirmFewer(e.target.checked)} />
            Continue with fewer than {project.songs_count}
          </label>
        ) : (
          <p className="text-sm text-muted">Selection target reached.</p>
        )}
        <button
          disabled={!canSubmit}
          onClick={submit}
          className="rounded-xl bg-lime px-4 py-3 text-sm font-medium text-studio disabled:opacity-45"
        >
          Continue to sourcing
        </button>
      </div>
    </div>
  );
}
