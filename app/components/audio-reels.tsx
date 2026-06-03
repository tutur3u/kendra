"use client";

import {
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type PointerEvent,
} from "react";
import type { KendraDemo } from "@/lib/kendra-content";
import { cn, shell } from "./ui";

type AudioReel = KendraDemo;

function isAudioReel(demo: KendraDemo): demo is AudioReel {
	return "audioSrc" in demo && Boolean(demo.audioSrc);
}

const waveformBars = [
	34, 52, 72, 46, 88, 58, 38, 76, 64, 44, 92, 56, 70, 48, 82, 62, 40, 74,
	54, 86, 50, 68, 36, 78, 60, 42, 90, 56,
] as const;

function formatAudioTime(seconds: number) {
	if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

	const roundedSeconds = Math.round(seconds);
	const minutes = Math.floor(roundedSeconds / 60);
	const remainingSeconds = roundedSeconds % 60;

	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function PlayIcon({ isPlaying }: { isPlaying: boolean }) {
	if (isPlaying) {
		return (
			<svg
				aria-hidden="true"
				className="h-4 w-4"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path d="M7 5h4v14H7z" />
				<path d="M13 5h4v14h-4z" />
			</svg>
		);
	}

	return (
		<svg
			aria-hidden="true"
			className="h-4 w-4 translate-x-px"
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			<path d="m8 5 11 7-11 7z" />
		</svg>
	);
}

function AudioReelRow({ reel }: { reel: AudioReel }) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [previewPercent, setPreviewPercent] = useState<number | null>(null);
	const [previewTime, setPreviewTime] = useState(0);
	const durationLabel = duration > 0 ? formatAudioTime(duration) : reel.duration;
	const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
	const previewLeft =
		previewPercent === null ? 0 : clamp(previewPercent * 100, 6, 94);

	useEffect(() => {
		const audio = audioRef.current;

		if (!audio) return;

		const syncDuration = () => {
			const metadataDuration = audio.duration;

			if (Number.isFinite(metadataDuration) && metadataDuration > 0) {
				setDuration(metadataDuration);
			}
		};

		syncDuration();
		audio.addEventListener("durationchange", syncDuration);
		audio.addEventListener("loadedmetadata", syncDuration);

		return () => {
			audio.removeEventListener("durationchange", syncDuration);
			audio.removeEventListener("loadedmetadata", syncDuration);
		};
	}, []);

	const togglePlayback = async () => {
		const audio = audioRef.current;

		if (!audio) return;

		if (isPlaying) {
			audio.pause();
			setIsPlaying(false);
			return;
		}

		try {
			await audio.play();
			setIsPlaying(true);
		} catch {
			setIsPlaying(false);
		}
	};

	const seekTo = (nextTime: number) => {
		const audio = audioRef.current;

		if (!audio || duration <= 0) return;

		const nextCurrentTime = clamp(nextTime, 0, duration);
		audio.currentTime = nextCurrentTime;
		setCurrentTime(nextCurrentTime);
	};

	const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
		seekTo(Number(event.currentTarget.value));
	};

	const handleWaveformPointerMove = (
		event: PointerEvent<HTMLDivElement>,
	) => {
		if (duration <= 0) return;

		const rect = event.currentTarget.getBoundingClientRect();
		const nextPreviewPercent = clamp(
			(event.clientX - rect.left) / rect.width,
			0,
			1,
		);

		setPreviewPercent(nextPreviewPercent);
		setPreviewTime(nextPreviewPercent * duration);
	};

	return (
		<li className="border-b border-green/70 last:border-b-0">
			<div className="grid min-h-[96px] grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-6 py-4 max-[620px]:grid-cols-[52px_minmax(0,1fr)] max-[620px]:gap-4">
				<button
					aria-label={`${isPlaying ? "Pause" : "Play"} ${reel.title}`}
					className="grid h-12 w-12 place-items-center rounded-full border border-green/30 text-green-deep transition duration-300 hover:border-green hover:bg-green hover:text-white focus-visible:outline-[1px] focus-visible:outline-offset-4 focus-visible:outline-green"
					onClick={togglePlayback}
					type="button"
				>
					<PlayIcon isPlaying={isPlaying} />
				</button>
				<div className="grid min-w-0 gap-3">
					<div className="flex min-w-0 items-baseline justify-between gap-4">
						<strong className="block min-w-0 truncate text-[clamp(1rem,1.45vw,1.12rem)] font-light tracking-tight text-ink">
							{reel.title}
						</strong>
						<span className="shrink-0 font-mono text-[0.72rem] text-green-deep/70">
							{formatAudioTime(currentTime)}
							{durationLabel ? ` / ${durationLabel}` : null}
						</span>
					</div>
					<div
						className="relative rounded-sm focus-within:outline-[1px] focus-within:outline-offset-4 focus-within:outline-green"
						onPointerLeave={() => setPreviewPercent(null)}
						onPointerMove={handleWaveformPointerMove}
					>
						<div
							aria-hidden="true"
							className="grid h-8 grid-cols-[repeat(28,minmax(2px,1fr))] items-center gap-1"
						>
							{waveformBars.map((height, index) => {
								const barProgress = (index + 1) / waveformBars.length;
								const isFilled = progress >= barProgress;
								const isPreviewed =
									previewPercent !== null && previewPercent >= barProgress;

								return (
									<span
										className={cn(
											"block w-full origin-center rounded-full transition-colors duration-200",
											isFilled
												? "bg-green"
												: isPreviewed
													? "bg-green-deep/35"
													: "bg-green-deep/20",
										)}
										key={`${height}-${index}`}
										style={{
											animationDelay: `${index * 42}ms`,
											animationDirection: "alternate",
											animationDuration: `${620 + (index % 6) * 60}ms`,
											animationIterationCount: isPlaying ? "infinite" : "1",
											animationName: isPlaying ? "pulse-bar" : "none",
											animationTimingFunction: "ease-in-out",
											height: `${height}%`,
										}}
									/>
								);
							})}
						</div>
						<span
							aria-hidden="true"
							className="pointer-events-none absolute inset-y-0 w-px bg-green-deep/45"
							style={{ left: `${progress * 100}%` }}
						/>
						{previewPercent !== null ? (
							<span
								aria-hidden="true"
								className="-top-7 pointer-events-none absolute -translate-x-1/2 bg-ink px-2 py-1 font-mono text-[0.66rem] text-white"
								style={{ left: `${previewLeft}%` }}
							>
								{formatAudioTime(previewTime)}
							</span>
						) : null}
						<input
							aria-label={`Seek ${reel.title}`}
							aria-valuetext={`${formatAudioTime(currentTime)}${
								durationLabel ? ` of ${durationLabel}` : ""
							}`}
							className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
							disabled={duration <= 0}
							max={duration || 0}
							min="0"
							onChange={handleSeek}
							step="0.01"
							type="range"
							value={currentTime}
						/>
					</div>
				</div>
				<a
					className="inline-flex min-h-10 items-center justify-center bg-ink px-9 text-[0.82rem] font-serif font-bold text-white transition duration-300 hover:bg-green focus-visible:outline-[1px] focus-visible:outline-offset-4 focus-visible:outline-green max-[620px]:col-span-2 max-[620px]:w-full"
					download
					href={reel.audioSrc}
				>
					Download
				</a>
				<audio
					onEnded={(event) => {
						event.currentTarget.currentTime = 0;
						setIsPlaying(false);
						setCurrentTime(0);
					}}
					onLoadedMetadata={(event) => {
						const metadataDuration = event.currentTarget.duration;

						if (Number.isFinite(metadataDuration)) {
							setDuration(metadataDuration);
						}
					}}
					onPause={() => setIsPlaying(false)}
					onPlay={() => setIsPlaying(true)}
					onTimeUpdate={(event) =>
						setCurrentTime(event.currentTarget.currentTime)
					}
					preload="metadata"
					ref={audioRef}
					src={reel.audioSrc}
				>
					<track kind="captions" />
				</audio>
			</div>
		</li>
	);
}

export function AudioReels({ items }: { items: KendraDemo[] }) {
	const audioReels = items.filter(isAudioReel);

	if (audioReels.length === 0) return null;

	return (
		<section
			aria-labelledby="audio-reels-title"
			className={cn(shell, "pb-[clamp(56px,8vw,96px)]")}
			id="demos"
		>
			<h2 id="audio-reels-title" className="sr-only">
				Reels
			</h2>
			<ul className="border-t border-green/70">
				{audioReels.map((reel) => (
					<AudioReelRow key={reel.title} reel={reel} />
				))}
			</ul>
		</section>
	);
}
