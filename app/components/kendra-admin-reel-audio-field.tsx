"use client";

import { FieldError } from "./kendra-admin-reel-form-fields";

export function KendraAdminReelAudioField({
	audioFileLabel,
	audioUrl,
	currentAudioLabel,
	error,
	hasCurrentAudio,
	onAudioChange,
	onRemoveAudioChange,
	removeAudio,
}: {
	audioFileLabel: string;
	audioUrl?: string | null;
	currentAudioLabel?: string | null;
	error?: string;
	hasCurrentAudio: boolean;
	onAudioChange: (file: File | null) => void;
	onRemoveAudioChange: (checked: boolean) => void;
	removeAudio: boolean;
}) {
	return (
		<div className="grid gap-3 border border-line bg-white p-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
						Audio file
					</span>
					<p className="mt-1 text-sm text-ink-soft">
						{audioFileLabel || currentAudioLabel || "No audio selected"}
					</p>
				</div>
				<label className="inline-flex min-h-11 cursor-pointer items-center justify-center border border-ink bg-white px-5 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:bg-ink hover:text-white">
					Choose audio
					<input
						accept="audio/*,.aac,.aif,.aiff,.flac,.m4a,.mp3,.ogg,.wav,.webm"
						className="sr-only"
						onChange={(event) => onAudioChange(event.currentTarget.files?.[0] ?? null)}
						type="file"
					/>
				</label>
			</div>
			{audioUrl ? (
				<audio className="h-11 w-full" controls preload="metadata" src={audioUrl}>
					<track kind="captions" />
				</audio>
			) : null}
			<FieldError message={error} />
			{hasCurrentAudio ? (
				<label className="flex items-center gap-3 text-coral text-sm">
					<input
						checked={removeAudio}
						className="size-4 accent-current"
						onChange={(event) => onRemoveAudioChange(event.currentTarget.checked)}
						type="checkbox"
					/>
					Remove current audio on save
				</label>
			) : null}
		</div>
	);
}
