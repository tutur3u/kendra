"use client";

import { useState, type FormEvent } from "react";
import type {
	KendraAdminReel,
	KendraAdminReelStatus,
} from "@/lib/kendra-admin-reel-model";
import { slugifyKendraReel } from "@/lib/kendra-admin-reel-model";
import { FieldError, TextAreaField, TextField } from "./kendra-admin-reel-form-fields";
import { labelText } from "./ui";

type ReelDraft = {
	category: string;
	downloadLabel: string;
	duration: string;
	featured: boolean;
	removeAudio: boolean;
	scriptNotes: string;
	slug: string;
	status: KendraAdminReelStatus;
	style: string;
	subtitle: string;
	summary: string;
	title: string;
};

type ReelMutationResponse = {
	error?: string;
	errors?: Record<string, string>;
	reel?: KendraAdminReel | null;
	reels?: KendraAdminReel[];
};

const statusOptions: Array<{ label: string; value: KendraAdminReelStatus }> = [
	{ label: "Draft", value: "draft" },
	{ label: "Published", value: "published" },
	{ label: "Archived", value: "archived" },
	{ label: "Scheduled", value: "scheduled" },
];

function draftFromReel(reel: KendraAdminReel | null): ReelDraft {
	return {
		category: reel?.category ?? "Voice reel",
		downloadLabel: reel?.downloadLabel ?? "Download MP3",
		duration: reel?.duration ?? "",
		featured: reel?.featured ?? false,
		removeAudio: false,
		scriptNotes: reel?.scriptNotes ?? "",
		slug: reel?.slug ?? "",
		status: reel?.status ?? "draft",
		style: reel?.style ?? "",
		subtitle: reel?.subtitle ?? "Audio reel",
		summary: reel?.summary ?? "",
		title: reel?.title ?? "",
	};
}

function formatAudioDuration(seconds: number) {
	const rounded = Math.round(seconds);
	const minutes = Math.floor(rounded / 60);
	const remaining = String(rounded % 60).padStart(2, "0");
	return `${minutes}:${remaining}`;
}

function readPayloadError(payload: ReelMutationResponse, fallback: string) {
	return payload.error ?? Object.values(payload.errors ?? {})[0] ?? fallback;
}

export function KendraAdminReelForm({
	onDeleted,
	onSaved,
	reel,
}: {
	onDeleted: (reels: KendraAdminReel[]) => void;
	onSaved: (reels: KendraAdminReel[], reel: KendraAdminReel | null) => void;
	reel: KendraAdminReel | null;
}) {
	const [draft, setDraft] = useState(() => draftFromReel(reel));
	const [slugTouched, setSlugTouched] = useState(Boolean(reel));
	const [audioFile, setAudioFile] = useState<File | null>(null);
	const [audioFileLabel, setAudioFileLabel] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [message, setMessage] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const featuredInputId = `kendra-reel-featured-${reel?.id ?? "new"}`;

	const updateDraft = (name: keyof ReelDraft, value: string | boolean) => {
		setDraft((current) => {
			const next = { ...current, [name]: value };

			if (name === "title" && typeof value === "string" && !slugTouched && !reel) {
				next.slug = slugifyKendraReel(value);
			}

			return next;
		});
	};

	const onAudioChange = (file: File | null) => {
		setAudioFile(file);
		setAudioFileLabel(file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : "");

		if (!file) return;

		updateDraft("removeAudio", false);

		const audio = document.createElement("audio");
		const url = URL.createObjectURL(file);
		audio.preload = "metadata";
		audio.src = url;
		audio.onloadedmetadata = () => {
			if (Number.isFinite(audio.duration) && audio.duration > 0) {
				setDraft((current) => ({
					...current,
					duration: current.duration || formatAudioDuration(audio.duration),
				}));
			}
			URL.revokeObjectURL(url);
		};
		audio.onerror = () => URL.revokeObjectURL(url);
	};

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setMessage(null);
		setFieldErrors({});

		const body = new FormData();
		for (const [key, value] of Object.entries(draft)) {
			body.set(key, typeof value === "boolean" ? String(value) : value);
		}

		if (audioFile) {
			body.set("audioFile", audioFile);
		}

		try {
			const response = await fetch(
				reel ? `/api/admin/reels/${encodeURIComponent(reel.id)}` : "/api/admin/reels",
				{
					body,
					method: reel ? "PATCH" : "POST",
				},
			);
			const payload = (await response.json().catch(() => ({}))) as ReelMutationResponse;

			if (!response.ok) {
				setFieldErrors(payload.errors ?? {});
				setMessage(readPayloadError(payload, "We could not save this reel."));
				return;
			}

			onSaved(payload.reels ?? [], payload.reel ?? null);
			setMessage("Saved.");
			setAudioFile(null);
			setAudioFileLabel("");
			setDraft((current) => ({ ...current, removeAudio: false }));
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "We could not save this reel.");
		} finally {
			setSubmitting(false);
		}
	};

	const deleteReel = async () => {
		if (!reel) return;

		setDeleting(true);
		setMessage(null);

		try {
			const response = await fetch(`/api/admin/reels/${encodeURIComponent(reel.id)}`, {
				method: "DELETE",
			});
			const payload = (await response.json().catch(() => ({}))) as ReelMutationResponse;

			if (!response.ok) {
				setMessage(readPayloadError(payload, "We could not delete this reel."));
				return;
			}

			onDeleted(payload.reels ?? []);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "We could not delete this reel.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<form className="grid gap-5" onSubmit={submit}>
			<div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<span className={labelText}>{reel ? "Edit reel" : "New reel"}</span>
					<h2 className="mt-2 font-serif text-4xl font-normal italic leading-none text-ink">
						{reel ? draft.title || "Untitled reel" : "Create a reel"}
					</h2>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						className="min-h-11 border border-ink bg-ink px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
						disabled={submitting || deleting}
						type="submit"
					>
						{submitting ? "Saving" : reel ? "Save reel" : "Create reel"}
					</button>
				</div>
			</div>

			{message ? (
				<div className="border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
					{message}
				</div>
			) : null}

			<div className="grid gap-4 md:grid-cols-2">
				<TextField
					error={fieldErrors.title}
					label="Title"
					name="title"
					onChange={updateDraft}
					required
					value={draft.title}
				/>
				<TextField
					error={fieldErrors.slug}
					label="Slug"
					name="slug"
					onChange={(name, value) => {
						setSlugTouched(true);
						updateDraft(name, slugifyKendraReel(value));
					}}
					required
					value={draft.slug}
				/>
				<label className="grid gap-2">
					<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
						Status
					</span>
					<select
						className="min-h-11 border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent"
						onChange={(event) =>
							updateDraft("status", event.currentTarget.value as KendraAdminReelStatus)
						}
						value={draft.status}
					>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<FieldError message={fieldErrors.status} />
				</label>
				<TextField
					label="Category"
					name="category"
					onChange={updateDraft}
					value={draft.category}
				/>
				<TextField
					label="Duration"
					name="duration"
					onChange={updateDraft}
					placeholder="1:23"
					value={draft.duration}
				/>
				<TextField
					label="Voice style"
					name="style"
					onChange={updateDraft}
					value={draft.style}
				/>
				<TextField
					label="Type"
					name="subtitle"
					onChange={updateDraft}
					value={draft.subtitle}
				/>
				<TextField
					label="Download label"
					name="downloadLabel"
					onChange={updateDraft}
					value={draft.downloadLabel}
				/>
			</div>

			<div className="flex items-center justify-between gap-4 border border-line bg-surface px-4 py-3 text-sm text-ink">
				<span>
					<label className="block font-semibold" htmlFor={featuredInputId}>
						Featured reel
					</label>
					<span className="text-ink-soft text-xs">Shown first in admin and public lists.</span>
				</span>
				<input
					checked={draft.featured}
					className="size-5 accent-current"
					id={featuredInputId}
					onChange={(event) => updateDraft("featured", event.currentTarget.checked)}
					type="checkbox"
				/>
			</div>

			<TextAreaField
				label="Public summary"
				name="summary"
				onChange={updateDraft}
				value={draft.summary}
			/>
			<TextAreaField
				label="Script notes"
				name="scriptNotes"
				onChange={updateDraft}
				rows={5}
				value={draft.scriptNotes}
			/>

			<div className="grid gap-3 border border-line bg-white p-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
							Audio file
						</span>
						<p className="mt-1 text-sm text-ink-soft">
							{audioFileLabel || reel?.audioFileName || reel?.audioStoragePath || "No audio selected"}
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
				{reel?.audioUrl ? (
					<audio className="h-11 w-full" controls preload="metadata" src={reel.audioUrl}>
						<track kind="captions" />
					</audio>
				) : null}
				<FieldError message={fieldErrors.audioFile} />
				{reel?.audioAssetId ? (
					<label className="flex items-center gap-3 text-coral text-sm">
						<input
							checked={draft.removeAudio}
							className="size-4 accent-current"
							onChange={(event) => updateDraft("removeAudio", event.currentTarget.checked)}
							type="checkbox"
						/>
						Remove current audio on save
					</label>
				) : null}
			</div>

			{reel ? (
				<div className="border-t border-line pt-5">
					{confirmDelete ? (
						<div className="grid gap-3 border border-coral/30 bg-coral/10 p-4">
							<p className="text-coral text-sm">
								Delete "{reel.title}" from the reel library and public delivery.
							</p>
							<div className="flex flex-wrap gap-2">
								<button
									className="min-h-10 bg-coral px-4 text-sm font-bold uppercase tracking-[0.1em] text-white disabled:opacity-50"
									disabled={deleting || submitting}
									onClick={() => void deleteReel()}
									type="button"
								>
									{deleting ? "Deleting" : "Delete reel"}
								</button>
								<button
									className="min-h-10 border border-line bg-white px-4 text-sm font-bold uppercase tracking-[0.1em] text-ink"
									disabled={deleting}
									onClick={() => setConfirmDelete(false)}
									type="button"
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<button
							className="text-coral text-sm font-bold uppercase tracking-[0.12em] underline decoration-coral/25 underline-offset-4"
							disabled={submitting || deleting}
							onClick={() => setConfirmDelete(true)}
							type="button"
						>
							Delete reel
						</button>
					)}
				</div>
			) : null}
		</form>
	);
}
