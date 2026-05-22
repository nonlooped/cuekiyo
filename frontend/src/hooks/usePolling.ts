import { useEffect, useRef } from "react";

export function usePolling(
	callback: () => void,
	intervalMs: number,
	deps: React.DependencyList = [],
) {
	const savedCallback = useRef(callback);

	useEffect(() => {
		savedCallback.current = callback;
	});

	useEffect(() => {
		let intervalId: ReturnType<typeof setInterval> | null = null;

		const tick = () => {
			savedCallback.current();
		};

		const start = () => {
			if (intervalId !== null) return;
			intervalId = setInterval(tick, intervalMs);
		};

		const stop = () => {
			if (intervalId !== null) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				stop();
			} else {
				start();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		if (document.visibilityState === "visible") {
			start();
		}

		return () => {
			stop();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [intervalMs, ...deps]);
}
