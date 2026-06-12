"use client";

import Link from "next/link";
import {
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type PointerEvent,
} from "react";
import type { KendraDemo } from "@/lib/kendra-content";
import { cn, shell } from "./ui";

export type AudioReel = KendraDemo;

export function isAudioReel(demo: KendraDemo): demo is AudioReel {
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

export function getVisibleAudioReels(items: KendraDemo[], limit?: number) {
	const audioReels = items.filter(isAudioReel);
	const normalizedLimit =
		typeof limit === "number" && Number.isFinite(limit) && limit > 0
			? Math.floor(limit)
			: audioReels.length;
	const visibleReels = audioReels.slice(0, normalizedLimit);

	return {
		hiddenCount: Math.max(0, audioReels.length - visibleReels.length),
		totalCount: audioReels.length,
		visibleReels,
	};
}

export function AudioReelPlayer({
	featured = false,
	reel,
	showDownload = true,
}: {
	featured?: boolean;
	reel: AudioReel;
	showDownload?: boolean;
}) {
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
		<div className="grid min-h-[96px] grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-6 py-4 max-[620px]:grid-cols-[52px_minmax(0,1fr)] max-[620px]:gap-4">
			<button
				aria-label={`${isPlaying ? "Pause" : "Play"} ${reel.title}`}
				className={cn(
					"grid h-12 w-12 place-items-center rounded-full border transition duration-300 focus-visible:outline-[1px] focus-visible:outline-offset-4",
					featured
						? "border-white/35 text-white hover:border-white hover:bg-white hover:text-ink focus-visible:outline-white"
						: "border-green/30 text-green-deep hover:border-green hover:bg-green hover:text-white focus-visible:outline-green",
				)}
				onClick={togglePlayback}
				type="button"
			>
				<PlayIcon isPlaying={isPlaying} />
			</button>
			<div className="grid min-w-0 gap-3">
				<div className="flex min-w-0 items-baseline justify-between gap-4">
					<strong
						className={cn(
							"block min-w-0 truncate text-[clamp(1rem,1.45vw,1.12rem)] font-light tracking-tight",
							featured ? "text-white" : "text-ink",
						)}
					>
						{reel.title}
					</strong>
					<span
						className={cn(
							"shrink-0 font-mono text-[0.72rem]",
							featured ? "text-white/62" : "text-green-deep/70",
						)}
					>
						{formatAudioTime(currentTime)}
						{durationLabel ? ` / ${durationLabel}` : null}
					</span>
				</div>
				<div
					className={cn(
						"relative rounded-sm focus-within:outline-[1px] focus-within:outline-offset-4",
						featured ? "focus-within:outline-white" : "focus-within:outline-green",
					)}
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
										featured
											? isFilled
												? "bg-white"
												: isPreviewed
													? "bg-white/50"
													: "bg-white/20"
											: isFilled
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
						className={cn(
							"pointer-events-none absolute inset-y-0 w-px",
							featured ? "bg-white/55" : "bg-green-deep/45",
						)}
						style={{ left: `${progress * 100}%` }}
					/>
					{previewPercent !== null ? (
						<span
							aria-hidden="true"
							className="pointer-events-none absolute -top-7 -translate-x-1/2 bg-ink px-2 py-1 font-mono text-[0.66rem] text-white"
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
			{showDownload ? (
				<a
					className={cn(
						"inline-flex min-h-10 items-center justify-center px-9 text-[0.82rem] font-serif font-bold transition duration-300 focus-visible:outline-[1px] focus-visible:outline-offset-4 max-[620px]:col-span-2 max-[620px]:w-full",
						featured
							? "border border-white/35 text-white hover:bg-white hover:text-ink focus-visible:outline-white"
							: "bg-ink text-white hover:bg-green focus-visible:outline-green",
					)}
					download
					href={reel.audioSrc}
				>
					{reel.downloadLabel ?? "Download"}
				</a>
			) : null}
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
	);
}

export function AudioReelRow({ reel }: { reel: AudioReel }) {
	return (
		<li className="border-b border-green/70 last:border-b-0">
			<AudioReelPlayer reel={reel} />
		</li>
	);
}

export function AudioReels({
	items,
	limit,
	viewMoreHref,
	viewMoreLabel = "View more in voice over",
}: {
	items: KendraDemo[];
	limit?: number;
	viewMoreHref?: string;
	viewMoreLabel?: string;
}) {
	const { hiddenCount, totalCount, visibleReels } = getVisibleAudioReels(
		items,
		limit,
	);

	if (visibleReels.length === 0) return null;

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
				{visibleReels.map((reel) => (
					<AudioReelRow key={reel.title} reel={reel} />
				))}
			</ul>
			{hiddenCount > 0 && viewMoreHref ? (
				<div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
					<span className="font-mono text-[0.72rem] text-ink-soft">
						Showing {visibleReels.length} of {totalCount} reels
					</span>
					<Link
						className="text-[0.82rem] font-bold uppercase tracking-[0.14em] text-accent underline decoration-accent/30 underline-offset-8 transition hover:text-ink"
						href={viewMoreHref}
					>
						{viewMoreLabel}
					</Link>
				</div>
			) : null}
		</section>
	);
}
