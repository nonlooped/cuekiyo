export interface ProjectDefaults {
	songsCount: number;
	songTypes: string[];
	clipTime: number;
	encoder: string;
	audioNormalize: boolean;
}

const STORAGE_KEY = "amv-project-defaults";

export const DEFAULT_PROJECT_DEFAULTS: ProjectDefaults = {
	songsCount: 5,
	songTypes: ["opening"],
	clipTime: 10,
	encoder: "auto",
	audioNormalize: true,
};

export function loadProjectDefaults(): ProjectDefaults {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_PROJECT_DEFAULTS;
		const parsed = JSON.parse(raw) as Partial<ProjectDefaults>;
		return {
			songsCount: parsed.songsCount ?? DEFAULT_PROJECT_DEFAULTS.songsCount,
			songTypes: parsed.songTypes?.length
				? parsed.songTypes
				: DEFAULT_PROJECT_DEFAULTS.songTypes,
			clipTime: parsed.clipTime ?? DEFAULT_PROJECT_DEFAULTS.clipTime,
			encoder: parsed.encoder ?? DEFAULT_PROJECT_DEFAULTS.encoder,
			audioNormalize:
				parsed.audioNormalize ?? DEFAULT_PROJECT_DEFAULTS.audioNormalize,
		};
	} catch {
		return DEFAULT_PROJECT_DEFAULTS;
	}
}

export function saveProjectDefaults(defaults: ProjectDefaults): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}
