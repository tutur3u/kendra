"use client";

import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import { labelText } from "./ui";

export type ReelMutationResponse = {
	code?: string;
	details?: unknown;
	error?: string;
	errors?: Record<string, string>;
	label?: string;
	reel?: KendraAdminReel | null;
	reels?: KendraAdminReel[];
	status?: number;
	step?: string;
};

type DirectAudioUploadResponse = {
	error?: string;
	errors?: Record<string, string>;
	fullPath: string | null;
	headers: Record<string, string>;
	method: "PUT";
	path: string;
	signedUrl: string;
};

export type SaveProgressState = {
	details?: unknown;
	error?: string;
	label: string;
	percent: number;
	status: "idle" | "running" | "success" | "error";
	statusCode?: number;
	step?: string;
	uploadedPath?: string;
};

type SaveStreamEvent =
	| {
			label: string;
			percent: number;
			step: string;
			type: "progress";
	  }
	| ({
			label: string;
			percent: 100;
			step: "done";
			type: "result";
	  } & Required<Pick<ReelMutationResponse, "reel" | "reels">>)
	| ({
			percent: number;
			type: "error";
	  } & Pick<
			ReelMutationResponse,
			"code" | "details" | "error" | "label" | "status" | "step"
	  >);

export type UploadedAudioMetadata = {
	contentType: string | null;
	filename: string;
	size: number;
	storagePath: string;
};

export type SaveFlowError = Error & {
	details?: unknown;
	errors?: Record<string, string>;
	label?: string;
	statusCode?: number;
	step?: string;
};

const REDACTED = "[redacted]";
const SECRET_KEY_PATTERN =
	/(authorization|cookie|secret|token|apikey|api_key|accesskey|access_key|signedurl|signed_url|signature)/i;

function readPayloadError(payload: ReelMutationResponse, fallback: string) {
	return payload.error ?? Object.values(payload.errors ?? {})[0] ?? fallback;
}

function redactDebugString(value: string) {
	if (/^https?:\/\//i.test(value) && /([?&](token|signature|x-amz|x-goog)|signed)/i.test(value)) {
		return REDACTED;
	}

	return value.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`);
}

function sanitizeSaveDebugDetails(value: unknown): unknown {
	if (typeof value === "string") {
		return redactDebugString(value);
	}

	if (typeof value !== "object" || value === null) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => sanitizeSaveDebugDetails(item));
	}

	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).map(([key, item]) => [
			key,
			SECRET_KEY_PATTERN.test(key) ? REDACTED : sanitizeSaveDebugDetails(item),
		]),
	);
}

export function createSaveFlowError(
	payload: ReelMutationResponse,
	fallback: string,
): SaveFlowError {
	const error = new Error(readPayloadError(payload, fallback)) as SaveFlowError;
	error.details = sanitizeSaveDebugDetails(payload.details);
	error.errors = payload.errors;
	error.label = payload.label;
	error.statusCode = payload.status;
	error.step = payload.step;
	return error;
}

function tryFormatDetails(value: unknown) {
	if (value === undefined || value === null) return null;

	const sanitized = sanitizeSaveDebugDetails(value);

	if (typeof sanitized === "string") return sanitized;

	try {
		return JSON.stringify(sanitized, null, 2);
	} catch {
		return String(sanitized);
	}
}

export function SaveProgressPanel({ state }: { state: SaveProgressState }) {
	if (state.status === "idle") return null;

	const details = tryFormatDetails(state.details);
	const statusText =
		state.status === "error"
			? state.error || "Save failed."
			: state.status === "success"
				? "Saved."
				: state.label;

	return (
		<section
			aria-live="polite"
			className="grid gap-3 border border-line bg-surface p-4"
			role="status"
		>
			<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<span className={labelText}>
						{state.status === "error" ? "Save error" : "Save progress"}
					</span>
					<p className="mt-1 font-semibold text-ink text-sm">{statusText}</p>
				</div>
				<strong className="text-accent text-sm">
					{Math.round(state.percent)}%
				</strong>
			</div>
			<div
				aria-label="Save progress"
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={Math.round(state.percent)}
				className="h-2 overflow-hidden border border-line bg-white"
				role="progressbar"
			>
				<div
					className="h-full bg-accent transition-[width]"
					style={{ width: `${Math.max(0, Math.min(100, state.percent))}%` }}
				/>
			</div>
			<div className="grid gap-1 text-ink-soft text-xs">
				{state.step ? <span>Step: {state.step}</span> : null}
				{state.statusCode ? <span>Status: {state.statusCode}</span> : null}
				{state.uploadedPath ? (
					<span>Uploaded path: {state.uploadedPath}</span>
				) : null}
			</div>
			{details ? (
				<details className="border border-line bg-white p-3 text-xs">
					<summary className="cursor-pointer font-semibold text-ink">
						Debug details
					</summary>
					<pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-ink-soft">
						{details}
					</pre>
				</details>
			) : null}
		</section>
	);
}

export async function requestSignedAudioUpload({
	file,
	setSaveProgress,
	slug,
}: {
	file: File;
	setSaveProgress: (state: SaveProgressState) => void;
	slug: string;
}) {
	setSaveProgress({
		label: "Preparing upload",
		percent: 8,
		status: "running",
		step: "prepare-upload",
	});

	const response = await fetch("/api/admin/reels/audio-upload-url", {
		body: JSON.stringify({
			contentType: file.type || null,
			filename: file.name,
			size: file.size,
			slug,
		}),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	const payload = (await response.json().catch(() => ({}))) as
		| DirectAudioUploadResponse
		| ReelMutationResponse;

	if (!response.ok) {
		throw createSaveFlowError(
			{ ...payload, status: response.status },
			"We could not prepare the audio upload.",
		);
	}

	if (!("signedUrl" in payload) || !("path" in payload) || !("headers" in payload)) {
		throw createSaveFlowError(
			{
				details: payload,
				error: "Upload preparation did not return a signed URL.",
				label: "Preparing upload",
				step: "prepare-upload",
			},
			"We could not prepare the audio upload.",
		);
	}

	return payload;
}

export async function uploadAudioDirectly({
	file,
	setSaveProgress,
	upload,
}: {
	file: File;
	setSaveProgress: (state: SaveProgressState) => void;
	upload: DirectAudioUploadResponse;
}): Promise<UploadedAudioMetadata> {
	setSaveProgress({
		label: "Uploading audio",
		percent: 12,
		status: "running",
		step: "upload-audio",
		uploadedPath: upload.path,
	});

	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open(upload.method, upload.signedUrl);

		for (const [key, value] of Object.entries(upload.headers ?? {})) {
			xhr.setRequestHeader(key, value);
		}

		xhr.upload.onprogress = (event) => {
			const uploadPercent = event.lengthComputable ? event.loaded / event.total : 0;
			setSaveProgress({
				label: "Uploading audio",
				percent: 12 + uploadPercent * 58,
				status: "running",
				step: "upload-audio",
				uploadedPath: upload.path,
			});
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve({
					contentType: file.type || null,
					filename: file.name,
					size: file.size,
					storagePath: upload.path,
				});
				return;
			}

			reject(
				createSaveFlowError(
					{
						details: {
							path: upload.path,
							response: xhr.responseText || null,
							status: xhr.status,
							statusText: xhr.statusText,
						},
						error: `Direct audio upload failed (${xhr.status}).`,
						label: "Uploading audio",
						status: xhr.status,
						step: "upload-audio",
					},
					"We could not upload the audio file.",
				),
			);
		};

		xhr.onerror = () => {
			reject(
				createSaveFlowError(
					{
						details: { path: upload.path },
						error: "Direct audio upload failed.",
						label: "Uploading audio",
						step: "upload-audio",
					},
					"We could not upload the audio file.",
				),
			);
		};

		xhr.send(file);
	});
}

export async function readMetadataSaveResponse({
	response,
	setSaveProgress,
	uploadedAudio,
}: {
	response: Response;
	setSaveProgress: (state: SaveProgressState) => void;
	uploadedAudio: UploadedAudioMetadata | null;
}): Promise<Required<Pick<ReelMutationResponse, "reel" | "reels">>> {
	const uploadedPath = uploadedAudio?.storagePath;
	const mapServerPercent = (percent: number) =>
		uploadedAudio
			? 70 + (Math.max(0, Math.min(100, percent)) / 100) * 30
			: percent;

	if (!response.ok) {
		const payload = (await response.json().catch(() => ({}))) as ReelMutationResponse;
		throw createSaveFlowError(
			{ ...payload, status: response.status },
			"We could not save this reel.",
		);
	}

	if (
		!response.body ||
		!response.headers
			.get("content-type")
			?.toLowerCase()
			.includes("application/x-ndjson")
	) {
		const payload = (await response.json().catch(() => ({}))) as ReelMutationResponse;

		if (!payload.reels) {
			throw createSaveFlowError(payload, "We could not save this reel.");
		}

		return { reel: payload.reel ?? null, reels: payload.reels };
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let result: Required<Pick<ReelMutationResponse, "reel" | "reels">> | null =
		null;

	while (true) {
		const { done, value } = await reader.read();
		buffer += decoder.decode(value, { stream: !done });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";

		for (const line of lines) {
			if (!line.trim()) continue;
			const event = JSON.parse(line) as SaveStreamEvent;

			if (event.type === "progress") {
				setSaveProgress({
					label: event.label,
					percent: mapServerPercent(event.percent),
					status: "running",
					step: event.step,
					uploadedPath,
				});
			} else if (event.type === "result") {
				result = { reel: event.reel, reels: event.reels };
				setSaveProgress({
					label: event.label,
					percent: 100,
					status: "success",
					step: event.step,
					uploadedPath,
				});
			} else if (event.type === "error") {
				throw createSaveFlowError(
					{
						...event,
						status: event.status,
					},
					"We could not save this reel.",
				);
			}
		}

		if (done) break;
	}

	if (!result) {
		throw createSaveFlowError(
			{
				error: "Save stream ended before returning a result.",
				label: "Saving reel",
				step: "save-stream",
			},
			"We could not save this reel.",
		);
	}

	return result;
}
