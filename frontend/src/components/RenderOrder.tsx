import { useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, GripVertical, ListOrdered } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../api";
import type { Song } from "../types";

function SortableItem({ song, views }: { song: Song; views: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: song.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex cursor-grab items-center gap-3 rounded-xl border border-white/10 bg-studio/50 px-3 py-3"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} className="text-muted" aria-hidden="true" />
      <span className="flex-1">
        <span className="block text-sm font-medium">{song.song_title}</span>
        <span className="block text-xs text-muted">{song.anime_name}</span>
      </span>
      <span className="text-xs text-muted">{views.toLocaleString()} views</span>
    </li>
  );
}

export default function RenderOrder({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [viewMap, setViewMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [justSorted, setJustSorted] = useState(false);
  const prevOrder = useRef<Song[]>([]);

  useEffect(() => {
    api.listSongs(projectId).then(async (s) => {
      setSongs([...s].sort((a, b) => a.render_order - b.render_order));
      const vm: Record<string, number> = {};
      for (const song of s) {
        const cands = await api.listCandidates(projectId, song.id);
        const sel = cands.find((c) => c.is_selected);
        vm[song.id] = sel?.view_count ?? 0;
      }
      setViewMap(vm);
      setLoading(false);
    });
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = songs.findIndex((s) => s.id === active.id);
    const newIndex = songs.findIndex((s) => s.id === over.id);
    setSongs(arrayMove(songs, oldIndex, newIndex));
  };

  const autoSort = () => {
    prevOrder.current = songs;
    setSongs([...songs].sort((a, b) => (viewMap[b.id] ?? 0) - (viewMap[a.id] ?? 0)));
    setJustSorted(true);
  };

  useEffect(() => {
    if (!justSorted) return;
    const timer = setTimeout(() => setJustSorted(false), 8000);
    return () => clearTimeout(timer);
  }, [justSorted]);

  const undoSort = () => {
    setSongs(prevOrder.current);
    setJustSorted(false);
  };

  const confirm = async () => {
    await api.updateRenderOrder(
      projectId,
      songs.map((s) => s.id),
    );
    await api.confirmRenderOrder(projectId);
    onDone();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-panel/70">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <ListOrdered size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-medium">Arrange render order</h2>
            <p className="mt-1 text-sm text-muted">Drag clips into the final sequence.</p>
          </div>
        </div>
        <button
          onClick={autoSort}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.06]"
        >
          <ArrowDownWideNarrow size={15} aria-hidden="true" />
          Sort by views
        </button>
      </div>

      {justSorted && (
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-2.5">
          <span className="text-xs text-muted">Sorted by views</span>
          <button
            onClick={undoSort}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs hover:bg-white/[0.06]"
          >
            Undo
          </button>
        </div>
      )}

      {loading ? (
        <p className="p-5 text-sm text-muted">Loading sequence...</p>
      ) : (
        <div className="p-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {songs.map((song) => (
                  <SortableItem key={song.id} song={song} views={viewMap[song.id] ?? 0} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <div className="sticky bottom-24 flex justify-end border-t border-white/10 bg-panel/95 p-4 backdrop-blur-xl md:bottom-4">
        <button onClick={confirm} className="rounded-xl bg-lime px-4 py-3 text-sm font-medium text-studio">
          Confirm order and render
        </button>
      </div>
    </div>
  );
}
