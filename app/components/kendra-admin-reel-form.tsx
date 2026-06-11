"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import { slugifyKendraReel } from "@/lib/kendra-admin-reel-model";
import {
	ReelAdvancedSection,
	ReelAudioSection,
	ReelBasicsSection,
	type ReelDraft,
	ReelPublicDetailsSection,
} from "./kendra-admin-reel-sections";
import {
	readMetadataSaveResponse,
	requestSignedAudioUpload,
	SaveProgressPanel,
	type SaveFlowError,
	type SaveProgressState,
	type UploadedAudioMetadata,
	uploadAudioDirectly,
} from "./kendra-admin-reel-save-progress";
import { labelText } from "./ui";

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

function draftsMatch(left: ReelDraft, right: ReelDraft) {
	return (Object.keys(left) as Array<keyof ReelDraft>).every(
		(key) => left[key] === right[key],
	);
}

export function KendraAdminReelForm({
	deletePending,
	onDeleteRequest,
	onSaved,
	reel,
}: {
	deletePending?: boolean;
	onDeleteRequest: (reel: KendraAdminReel) => void;
	onSaved: (reels: KendraAdminReel[], reel: KendraAdminReel | null) => void;
	reel: KendraAdminReel | null;
}) {
	const [draft, setDraft] = useState(() => draftFromReel(reel));
	const [savedDraft, setSavedDraft] = useState(() => draftFromReel(reel));
	const [slugTouched, setSlugTouched] = useState(Boolean(reel));
	const [audioFile, setAudioFile] = useState<File | null>(null);
	const [audioFileLabel, setAudioFileLabel] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [saveProgress, setSaveProgress] = useState<SaveProgressState>({
		label: "",
		percent: 0,
		status: "idle",
	});
	const [submitting, setSubmitting] = useState(false);
	const featuredInputId = `kendra-reel-featured-${reel?.id ?? "new"}`;
	const hasUnsavedChanges =
		!reel || audioFile !== null || draft.removeAudio || !draftsMatch(draft, savedDraft);

	useEffect(() => {
		const nextDraft = draftFromReel(reel);
		setDraft(nextDraft);
		setSavedDraft(nextDraft);
		setSlugTouched(Boolean(reel));
		setAudioFile(null);
		setAudioFileLabel("");
		setFieldErrors({});
		setSaveProgress({ label: "", percent: 0, status: "idle" });
	}, [reel]);

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

		setDraft((current) => ({ ...current, duration: "", removeAudio: false }));

		const audio = document.createElement("audio");
		const url = URL.createObjectURL(file);
		audio.preload = "metadata";
		audio.src = url;
		audio.onloadedmetadata = () => {
			if (Number.isFinite(audio.duration) && audio.duration > 0) {
				setDraft((current) => ({
					...current,
					duration: formatAudioDuration(audio.duration),
				}));
			}
			URL.revokeObjectURL(url);
		};
		audio.onerror = () => URL.revokeObjectURL(url);
	};

	const updateRemoveAudio = (checked: boolean) => {
		setDraft((current) => ({
			...current,
			duration: checked ? "" : (reel?.duration ?? current.duration),
			removeAudio: checked,
		}));
	};

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (reel && !hasUnsavedChanges) return;

		setSubmitting(true);
		setFieldErrors({});
		setSaveProgress({
			label: "Validating reel",
			percent: 2,
			status: "running",
			step: "validate",
		});
		let uploadedAudio: UploadedAudioMetadata | null = null;

		const body = new FormData();
		for (const [key, value] of Object.entries(draft)) {
			body.set(key, typeof value === "boolean" ? String(value) : value);
		}

		try {
			if (audioFile) {
				const upload = await requestSignedAudioUpload({
					file: audioFile,
					setSaveProgress,
					slug: draft.slug,
				});
				uploadedAudio = await uploadAudioDirectly({
					file: audioFile,
					setSaveProgress,
					upload,
				});
				body.set("audioStoragePath", uploadedAudio.storagePath);
				body.set("audioFileName", uploadedAudio.filename);
				body.set("audioContentType", uploadedAudio.contentType ?? "");
				body.set("audioSize", String(uploadedAudio.size));
			}

			setSaveProgress({
				label: "Saving reel",
				percent: uploadedAudio ? 72 : 12,
				status: "running",
				step: "save-reel",
				uploadedPath: uploadedAudio?.storagePath,
			});
			const response = await fetch(
				reel ? `/api/admin/reels/${encodeURIComponent(reel.id)}` : "/api/admin/reels",
				{
					body,
					method: reel ? "PATCH" : "POST",
				},
			);
			const payload = await readMetadataSaveResponse({
				response,
				setSaveProgress,
				uploadedAudio,
			});

			onSaved(payload.reels ?? [], payload.reel ?? null);
			toast.success("Saved.");
			setAudioFile(null);
			setAudioFileLabel("");
			const nextDraft = draftFromReel(payload.reel ?? reel);
			setDraft(nextDraft);
			setSavedDraft(nextDraft);
		} catch (error) {
			const saveError = error as SaveFlowError;
			const message =
				saveError instanceof Error ? saveError.message : "We could not save this reel.";
			setFieldErrors(saveError.errors ?? {});
			setSaveProgress((current) => ({
				details: saveError.details ?? current.details,
				error: message,
				label: (saveError.label ?? current.label) || "Save failed",
				percent: Math.max(current.percent, 1),
				status: "error",
				statusCode: saveError.statusCode,
				step: saveError.step ?? current.step,
				uploadedPath: current.uploadedPath ?? uploadedAudio?.storagePath,
			}));
			toast.error(message);
		} finally {
			setSubmitting(false);
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
					{reel ? (
						<button
							className="min-h-11 border border-coral/40 bg-white px-5 text-coral text-sm font-bold uppercase tracking-[0.1em] transition hover:border-coral disabled:cursor-not-allowed disabled:opacity-50"
							disabled={submitting || deletePending}
							onClick={() => onDeleteRequest(reel)}
							type="button"
						>
							{deletePending ? "Deleting" : "Delete"}
						</button>
					) : null}
					<button
						className="min-h-11 border border-ink bg-ink px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
						disabled={submitting || deletePending || (reel ? !hasUnsavedChanges : false)}
						type="submit"
					>
						{submitting ? "Saving" : reel ? "Save" : "Create reel"}
					</button>
				</div>
			</div>

			<SaveProgressPanel state={saveProgress} />

			<ReelBasicsSection
				draft={draft}
				featuredInputId={featuredInputId}
				fieldErrors={fieldErrors}
				onChange={updateDraft}
			/>
			<ReelAudioSection
				audioFileLabel={audioFileLabel}
				audioUrl={reel?.audioUrl}
				currentAudioLabel={reel?.audioFileName || reel?.audioStoragePath}
				duration={draft.duration}
				error={fieldErrors.audioFile}
				hasCurrentAudio={Boolean(reel?.audioAssetId) && !audioFile}
				onAudioChange={onAudioChange}
				onRemoveAudioChange={updateRemoveAudio}
				removeAudio={draft.removeAudio}
			/>
			<ReelPublicDetailsSection draft={draft} onChange={updateDraft} />
			<ReelAdvancedSection
				draft={draft}
				fieldErrors={fieldErrors}
				onChange={updateDraft}
				onSlugChange={(name, value) => {
					setSlugTouched(true);
					updateDraft(name, slugifyKendraReel(value));
				}}
			/>
		</form>
	);
}
