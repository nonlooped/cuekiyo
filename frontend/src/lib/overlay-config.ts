import type { OverlayConfig } from "@/types";

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
	enabled: true,
	style: "default",
	position: "bottom",
	show_anime_name: true,
	show_song_line: true,
	show_meta_line: true,
};

export function mergeOverlayConfig(
	partial: Partial<OverlayConfig>,
): OverlayConfig {
	return { ...DEFAULT_OVERLAY_CONFIG, ...partial };
}
