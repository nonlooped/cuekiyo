type InstallHint = { name: string; cmd: string; note?: string };

function platformKey(): "linux" | "mac" | "windows" | "other" {
	if (typeof navigator === "undefined") return "other";
	const ua = navigator.userAgent.toLowerCase();
	if (ua.includes("win")) return "windows";
	if (ua.includes("mac")) return "mac";
	if (ua.includes("linux")) return "linux";
	return "other";
}

export function getInstallHints(): InstallHint[] {
	const platform = platformKey();
	const ffmpeg =
		platform === "windows"
			? "winget install Gyan.FFmpeg"
			: platform === "mac"
				? "brew install ffmpeg"
				: "sudo pacman -S ffmpeg   # Arch/CachyOS\nsudo apt install ffmpeg   # Debian/Ubuntu";
	const fonts =
		platform === "windows"
			? "Arial is usually preinstalled"
			: platform === "mac"
				? "System fonts are usually sufficient"
				: "sudo pacman -S ttf-dejavu   # Arch/CachyOS\nsudo apt install fonts-liberation   # Debian/Ubuntu";

	return [
		{ name: "yt-dlp", cmd: "pip install yt-dlp" },
		{ name: "ffmpeg", cmd: ffmpeg },
		{ name: "fonts", cmd: fonts, note: "Used for song title overlays" },
	];
}
