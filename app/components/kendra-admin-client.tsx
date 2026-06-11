"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import type { KendraStorageAnalyticsState } from "@/lib/kendra-storage-analytics";
import type {
	KendraStorageFileItem,
	KendraStorageFilesState,
} from "@/lib/kendra-storage-files";
import {
	adminFetch,
	scheduleKendraAdminSessionRefresh,
} from "./kendra-admin-session-client";
import { KendraAdminReelForm } from "./kendra-admin-reel-form";
import { ReelList } from "./kendra-admin-reel-panels";
import { cn, labelText, shell } from "./ui";

type AdminTab = "audio" | "account" | "storage";
type ReelMutationResponse = {
	error?: string;
	errors?: Record<string, string>;
	reel?: KendraAdminReel | null;
	reels?: KendraAdminReel[];
};
type ReadyStorageAnalytics = Extract<
	KendraStorageAnalyticsState,
	{ status: "ready" }
>;
type ReadyStorageFiles = Extract<KendraStorageFilesState, { status: "ready" }>;

const tabs: Array<{ id: AdminTab; label: string }> = [
	{ id: "audio", label: "Audio" },
	{ id: "storage", label: "Storage" },
	{ id: "account", label: "Account" },
];

const byteUnits = ["B", "KB", "MB", "GB", "TB"] as const;

function getInitials(email: string | null) {
	if (!email) return "KB";

	const [name] = email.split("@");
	const parts = name?.split(/[._-]+/).filter(Boolean) ?? [];
	const initials = parts
		.map((part) => part[0])
		.join("")
		.slice(0, 2);
	return initials.toUpperCase() || "KB";
}

function formatBytes(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

	const exponent = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		byteUnits.length - 1,
	);
	const value = bytes / 1024 ** exponent;
	const formatted =
		value >= 10 || exponent === 0
			? Math.round(value).toString()
			: value.toFixed(1);

	return `${formatted} ${byteUnits[exponent]}`;
}

function readPayloadError(payload: ReelMutationResponse, fallback: string) {
	return payload.error ?? Object.values(payload.errors ?? {})[0] ?? fallback;
}

function formatFileDate(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Date unavailable";
	}

	return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function StorageMetric({
	detail,
	label,
	value,
}: {
	detail?: string;
	label: string;
	value: string;
}) {
	return (
		<div className="border border-line bg-white p-6">
			<span className={labelText}>{label}</span>
			<strong className="mt-3 block text-3xl font-semibold text-ink">
				{value}
			</strong>
			{detail ? <p className="mt-2 text-ink-soft text-sm">{detail}</p> : null}
		</div>
	);
}

function StorageFileHighlight({
	file,
	label,
}: {
	file: ReadyStorageAnalytics["data"]["largestFile"];
	label: string;
}) {
	return (
		<div className="border border-line bg-white p-6">
			<span className={labelText}>{label}</span>
			{file ? (
				<div className="mt-3">
					<strong className="block truncate text-ink">{file.name}</strong>
					<span className="mt-1 block text-ink-soft text-sm">
						{formatBytes(file.size)} - {formatFileDate(file.createdAt)}
					</span>
				</div>
			) : (
				<p className="mt-3 text-ink-soft text-sm">
					No files have been added yet.
				</p>
			)}
		</div>
	);
}

function storageParentPath(path: string) {
	const segments = path.split("/").filter(Boolean);
	segments.pop();
	return segments.join("/");
}

function isStorageFilesPayload(
	value: unknown,
): value is ReadyStorageFiles["data"] {
	if (!value || typeof value !== "object") return false;

	const payload = value as Record<string, unknown>;
	return (
		Array.isArray(payload.items) &&
		typeof payload.path === "string" &&
		typeof payload.total === "number"
	);
}

function isStorageAnalyticsState(
	value: unknown,
): value is KendraStorageAnalyticsState {
	if (!value || typeof value !== "object") return false;

	const payload = value as Record<string, unknown>;
	return payload.status === "ready" || payload.status === "unavailable";
}

function StorageFileRow({
	busy,
	confirmDeletePath,
	item,
	onDelete,
	onOpen,
	onOpenFolder,
	onRename,
	renameValue,
	renamingPath,
	setConfirmDeletePath,
	setRenameValue,
	setRenamingPath,
}: {
	busy: boolean;
	confirmDeletePath: string | null;
	item: KendraStorageFileItem;
	onDelete: (item: KendraStorageFileItem) => void;
	onOpen: (item: KendraStorageFileItem) => void;
	onOpenFolder: (path: string) => void;
	onRename: (item: KendraStorageFileItem) => void;
	renameValue: string;
	renamingPath: string | null;
	setConfirmDeletePath: (path: string | null) => void;
	setRenameValue: (name: string) => void;
	setRenamingPath: (path: string | null) => void;
}) {
	const isRenaming = renamingPath === item.path;
	const isConfirmingDelete = confirmDeletePath === item.path;
	const dateLabel = formatFileDate(item.updatedAt ?? item.createdAt ?? "");

	return (
		<div className="grid gap-4 border border-line bg-surface p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
			<div className="min-w-0">
				{isRenaming ? (
					<input
						className="min-h-11 w-full border border-line bg-white px-3 font-semibold text-ink text-sm outline-none focus:border-accent"
						onChange={(event) => setRenameValue(event.currentTarget.value)}
						value={renameValue}
					/>
				) : item.kind === "folder" ? (
					<button
						className="block max-w-full truncate text-left font-semibold text-ink underline decoration-line underline-offset-4"
						onClick={() => onOpenFolder(item.path)}
						type="button"
					>
						{item.name}
					</button>
				) : (
					<strong className="block truncate text-ink">{item.name}</strong>
				)}
				<span className="mt-1 block text-ink-soft text-sm">
					{item.kind === "folder" ? "Folder" : formatBytes(item.size)} -{" "}
					{dateLabel}
				</span>
			</div>
			<div className="flex flex-wrap gap-2">
				{item.kind === "file" && !isRenaming && !isConfirmingDelete ? (
					<button
						className="min-h-10 border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
						disabled={busy}
						onClick={() => onOpen(item)}
						type="button"
					>
						Open
					</button>
				) : null}
				{isRenaming ? (
					<>
						<button
							className="min-h-10 border border-ink bg-ink px-4 font-bold text-white text-xs uppercase tracking-[0.1em] transition hover:bg-accent disabled:opacity-50"
							disabled={busy || !renameValue.trim()}
							onClick={() => onRename(item)}
							type="button"
						>
							Save
						</button>
						<button
							className="min-h-10 border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
							disabled={busy}
							onClick={() => setRenamingPath(null)}
							type="button"
						>
							Cancel
						</button>
					</>
				) : isConfirmingDelete ? (
					<>
						<button
							className="min-h-10 bg-red-800 px-4 font-bold text-white text-xs uppercase tracking-[0.1em] disabled:opacity-50"
							disabled={busy}
							onClick={() => onDelete(item)}
							type="button"
						>
							Remove
						</button>
						<button
							className="min-h-10 border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
							disabled={busy}
							onClick={() => setConfirmDeletePath(null)}
							type="button"
						>
							Keep
						</button>
					</>
				) : (
					<>
						<button
							className="min-h-10 border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
							disabled={busy}
							onClick={() => {
								setRenameValue(item.name);
								setRenamingPath(item.path);
							}}
							type="button"
						>
							Rename
						</button>
						<button
							className="min-h-10 border border-red-300 bg-white px-4 font-bold text-red-800 text-xs uppercase tracking-[0.1em] disabled:opacity-50"
							disabled={busy}
							onClick={() => setConfirmDeletePath(item.path)}
							type="button"
						>
							Remove
						</button>
					</>
				)}
			</div>
			{isConfirmingDelete ? (
				<p className="text-red-800 text-sm md:col-span-2">
					This also clears it from any reel using it.
				</p>
			) : null}
		</div>
	);
}

function StoragePanel({
	storageAnalytics,
	storageFiles,
	onResourcesChanged,
}: {
	storageAnalytics: KendraStorageAnalyticsState;
	storageFiles: KendraStorageFilesState;
	onResourcesChanged: () => Promise<void>;
}) {
	const [analyticsState, setAnalyticsState] = useState(storageAnalytics);
	const [filesState, setFilesState] = useState(storageFiles);
	const [currentPath, setCurrentPath] = useState(
		storageFiles.status === "ready" ? storageFiles.data.path : "",
	);
	const [folderName, setFolderName] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(
		null,
	);
	const [message, setMessage] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const refreshStorage = async (path = currentPath) => {
		setBusy(true);
		setMessage(null);
		setCurrentPath(path);

		try {
			const filesUrl = new URL("/api/admin/storage", window.location.origin);
			if (path) filesUrl.searchParams.set("path", path);

			const [filesResponse, analyticsResponse] = await Promise.all([
				adminFetch(filesUrl, { cache: "no-store" }),
				adminFetch("/api/admin/storage/analytics", { cache: "no-store" }),
			]);
			const filesPayload = (await filesResponse.json().catch(() => null)) as {
				data?: unknown;
				error?: string;
			} | null;
			const analyticsPayload = (await analyticsResponse
				.json()
				.catch(() => null)) as unknown;

			if (filesResponse.ok && isStorageFilesPayload(filesPayload?.data)) {
				setFilesState({ data: filesPayload.data, status: "ready" });
			} else {
				setFilesState({
					message: filesPayload?.error ?? "Files are not available right now.",
					status: "unavailable",
				});
			}

			if (analyticsResponse.ok && isStorageAnalyticsState(analyticsPayload)) {
				setAnalyticsState(analyticsPayload);
			}
		} catch {
			setFilesState({
				message: "Files are not available right now.",
				status: "unavailable",
			});
		} finally {
			setBusy(false);
		}
	};

	const runStorageMutation = async (
		request: Promise<Response>,
		successMessage: string,
		refreshPath = currentPath,
	) => {
		setBusy(true);
		setMessage(null);

		try {
			const response = await request;
			const payload = (await response.json().catch(() => null)) as {
				data?: { detachedAssets?: number; updatedAssets?: number };
				error?: string;
			} | null;

			if (!response.ok) {
				setMessage(payload?.error ?? "Storage request failed.");
				return;
			}

			const changedLinks =
				(payload?.data?.detachedAssets ?? 0) +
				(payload?.data?.updatedAssets ?? 0);
			const successText =
				changedLinks > 0
					? `${successMessage} ${changedLinks} reel link${
							changedLinks === 1 ? "" : "s"
						} updated.`
					: successMessage;
			setConfirmDeletePath(null);
			setRenamingPath(null);
			await refreshStorage(refreshPath);
			setMessage(successText);
			await onResourcesChanged();
		} catch {
			setMessage("Storage request failed.");
		} finally {
			setBusy(false);
		}
	};

	const uploadSelectedFile = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!uploadFile) {
			setMessage("Choose a file first.");
			return;
		}

		const body = new FormData();
		body.set("file", uploadFile);
		body.set("path", currentPath);
		body.set("upsert", "true");

		await runStorageMutation(
			adminFetch("/api/admin/storage", { body, method: "POST" }),
			"Uploaded.",
		);
		setUploadFile(null);
	};

	const createFolder = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const name = folderName.trim();
		if (!name) return;

		await runStorageMutation(
			adminFetch("/api/admin/storage", {
				body: JSON.stringify({ name, path: currentPath }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			}),
			"Folder added.",
		);
		setFolderName("");
	};

	const renameItem = (item: KendraStorageFileItem) => {
		void runStorageMutation(
			adminFetch("/api/admin/storage", {
				body: JSON.stringify({
					kind: item.kind,
					newName: renameValue.trim(),
					path: item.path,
				}),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			}),
			"Renamed.",
			storageParentPath(item.path),
		);
	};

	const deleteItem = (item: KendraStorageFileItem) => {
		void runStorageMutation(
			adminFetch("/api/admin/storage", {
				body: JSON.stringify({ kind: item.kind, path: item.path }),
				headers: { "Content-Type": "application/json" },
				method: "DELETE",
			}),
			"Removed.",
			storageParentPath(item.path),
		);
	};

	const openFile = async (item: KendraStorageFileItem) => {
		setBusy(true);
		setMessage(null);

		try {
			const url = new URL("/api/admin/storage", window.location.origin);
			url.searchParams.set("filePath", item.path);
			const response = await adminFetch(url, { cache: "no-store" });
			const payload = (await response.json().catch(() => null)) as {
				data?: { signedUrl?: string };
				error?: string;
			} | null;

			if (!response.ok || !payload?.data?.signedUrl) {
				setMessage(payload?.error ?? "File could not be opened.");
				return;
			}

			window.open(payload.data.signedUrl, "_blank", "noopener,noreferrer");
		} catch {
			setMessage("File could not be opened.");
		} finally {
			setBusy(false);
		}
	};

	if (
		analyticsState.status === "unavailable" &&
		filesState.status === "unavailable"
	) {
		return (
			<section className="border border-line bg-white p-6">
				<span className={labelText}>Storage</span>
				<h2 className="mt-3 text-3xl font-semibold text-ink">
					Storage details are unavailable
				</h2>
				<p className="mt-3 max-w-2xl text-ink-soft text-sm">
					{analyticsState.message}
				</p>
			</section>
		);
	}

	const data = analyticsState.status === "ready" ? analyticsState.data : null;
	const usagePercentage = data
		? Math.max(0, Math.min(100, data.usagePercentage))
		: 0;
	const files = filesState.status === "ready" ? filesState.data.items : [];
	const pathLabel = currentPath || "Main room";

	return (
		<section className="grid gap-4 lg:grid-cols-3">
			{data ? (
				<>
					<div className="border border-line bg-white p-6 lg:col-span-3">
						<span className={labelText}>Storage</span>
						<div className="mt-3 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
							<div>
								<h2 className="text-3xl font-semibold text-ink">File room</h2>
								<p className="mt-2 max-w-2xl text-ink-soft text-sm">
									Track and manage the files connected to this admin account.
								</p>
							</div>
							<strong className="text-4xl font-semibold text-accent">
								{usagePercentage.toFixed(usagePercentage % 1 === 0 ? 0 : 1)}%
							</strong>
						</div>
						<div className="mt-6 h-3 overflow-hidden border border-line bg-surface">
							<div
								className="h-full bg-accent"
								style={{ width: `${usagePercentage}%` }}
							/>
						</div>
					</div>
					<StorageMetric
						detail={`${formatBytes(data.totalSize)} of ${formatBytes(data.storageLimit)}`}
						label="Used"
						value={formatBytes(data.totalSize)}
					/>
					<StorageMetric
						label="Plan limit"
						value={formatBytes(data.storageLimit)}
					/>
					<StorageMetric label="Files" value={String(data.fileCount)} />
					<StorageFileHighlight file={data.largestFile} label="Largest file" />
					<StorageFileHighlight
						file={data.smallestFile}
						label="Smallest file"
					/>
				</>
			) : null}

			<div className="grid gap-5 border border-line bg-white p-6 lg:col-span-3">
				<div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
					<div className="min-w-0">
						<span className={labelText}>Manage files</span>
						<h3 className="mt-2 text-2xl font-semibold text-ink">
							{pathLabel}
						</h3>
						<p className="mt-2 text-ink-soft text-sm">
							Upload the same filename to replace a file without changing linked
							reels.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{currentPath ? (
							<button
								className="min-h-10 border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
								disabled={busy}
								onClick={() =>
									void refreshStorage(storageParentPath(currentPath))
								}
								type="button"
							>
								Back
							</button>
						) : null}
						<button
							className="min-h-10 border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
							disabled={busy}
							onClick={() => void refreshStorage(currentPath)}
							type="button"
						>
							Refresh
						</button>
					</div>
				</div>

				{message ? (
					<div className="border border-line bg-surface px-4 py-3 text-ink-soft text-sm">
						{message}
					</div>
				) : null}

				<div className="grid gap-4 lg:grid-cols-2">
					<form
						className="grid gap-3 border border-line bg-surface p-4"
						onSubmit={uploadSelectedFile}
					>
						<label className="grid gap-2">
							<span className={labelText}>Choose file</span>
							<input
								className="min-h-11 border border-line bg-white px-3 py-2 text-ink text-sm"
								onChange={(event) =>
									setUploadFile(event.currentTarget.files?.[0] ?? null)
								}
								type="file"
							/>
						</label>
						<button
							className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-6 font-bold text-white text-sm uppercase tracking-[0.1em] transition hover:bg-accent disabled:opacity-50"
							disabled={busy || !uploadFile}
							type="submit"
						>
							Upload
						</button>
					</form>

					<form
						className="grid gap-3 border border-line bg-surface p-4"
						onSubmit={createFolder}
					>
						<label className="grid gap-2">
							<span className={labelText}>Folder name</span>
							<input
								className="min-h-11 border border-line bg-white px-3 text-ink text-sm outline-none focus:border-accent"
								onChange={(event) => setFolderName(event.currentTarget.value)}
								value={folderName}
							/>
						</label>
						<button
							className="inline-flex min-h-11 items-center justify-center border border-line bg-white px-6 font-bold text-ink text-sm uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent disabled:opacity-50"
							disabled={busy || !folderName.trim()}
							type="submit"
						>
							New folder
						</button>
					</form>
				</div>

				<div className="grid gap-3">
					{filesState.status === "unavailable" ? (
						<p className="text-ink-soft text-sm">{filesState.message}</p>
					) : files.length > 0 ? (
						files.map((item) => (
							<StorageFileRow
								busy={busy}
								confirmDeletePath={confirmDeletePath}
								item={item}
								key={item.path}
								onDelete={deleteItem}
								onOpen={(file) => void openFile(file)}
								onOpenFolder={(path) => void refreshStorage(path)}
								onRename={renameItem}
								renameValue={renameValue}
								renamingPath={renamingPath}
								setConfirmDeletePath={setConfirmDeletePath}
								setRenameValue={setRenameValue}
								setRenamingPath={setRenamingPath}
							/>
						))
					) : (
						<p className="border border-dashed border-line bg-surface p-6 text-ink-soft text-sm">
							No files in this spot yet.
						</p>
					)}
				</div>
			</div>
		</section>
	);
}

export function KendraAdminClient({
	initialReels,
	sessionExpiresAt,
	sessionRefreshEarlySeconds,
	storageAnalytics,
	storageFiles,
	userEmail,
}: {
	initialReels: KendraAdminReel[];
	sessionExpiresAt: string;
	sessionRefreshEarlySeconds?: number;
	storageAnalytics: KendraStorageAnalyticsState;
	storageFiles: KendraStorageFilesState;
	userEmail: string | null;
}) {
	const [activeTab, setActiveTab] = useState<AdminTab>("audio");
	const [reels, setReels] = useState(initialReels);
	const [selectedId, setSelectedId] = useState<string | null>(
		initialReels[0]?.id ?? null,
	);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const selectedReel = selectedId
		? (reels.find((reel) => reel.id === selectedId) ?? null)
		: null;
	const deleteTarget = deleteTargetId
		? (reels.find((reel) => reel.id === deleteTargetId) ?? null)
		: null;

	useEffect(
		() =>
			scheduleKendraAdminSessionRefresh({
				expiresAt: sessionExpiresAt,
				refreshEarlySeconds: sessionRefreshEarlySeconds,
			}),
		[sessionExpiresAt, sessionRefreshEarlySeconds],
	);

	const refreshReels = async () => {
		const response = await adminFetch("/api/admin/reels", { cache: "no-store" });
		const payload = (await response.json().catch(() => ({}))) as {
			reels?: KendraAdminReel[];
		};

		if (!response.ok || !payload.reels) return;

		setReels(payload.reels);
		setSelectedId((current) =>
			current && payload.reels?.some((reel) => reel.id === current)
				? current
				: (payload.reels?.[0]?.id ?? null),
		);
	};

	const requestDeleteReel = (reel: KendraAdminReel) => {
		setDeleteTargetId(reel.id);
		setSelectedId(reel.id);
	};

	const selectReel = (id: string) => {
		setSelectedId(id);
		setDeleteTargetId(null);
	};

	const createNewReel = () => {
		setSelectedId(null);
		setDeleteTargetId(null);
	};

	const deleteReel = async (reel: KendraAdminReel) => {
		setDeletingId(reel.id);

		try {
			const response = await adminFetch(
				`/api/admin/reels/${encodeURIComponent(reel.id)}`,
				{
					method: "DELETE",
				},
			);
			const payload = (await response.json().catch(() => ({}))) as ReelMutationResponse;

			if (!response.ok) {
				toast.error(readPayloadError(payload, "We could not delete this reel."));
				return;
			}

			const nextReels = payload.reels ?? reels.filter((item) => item.id !== reel.id);
			setReels(nextReels);
			setSelectedId((current) =>
				current && current !== reel.id ? current : (nextReels[0]?.id ?? null),
			);
			setDeleteTargetId(null);
			toast.success("Deleted reel.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "We could not delete this reel.");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<main className="min-h-screen bg-surface">
			<section className={cn(shell, "grid gap-8 py-[clamp(32px,6vw,72px)]")}>
				<header className="border-b border-line pb-6">
					<h1 className="text-3xl font-semibold text-ink">Admin Dashboard</h1>
				</header>

				<nav
					className="flex flex-wrap gap-2 border-b border-line"
					aria-label="Admin sections"
				>
					{tabs.map((tab) => (
						<button
							className={cn(
								"min-h-11 border-b-2 px-4 text-sm font-bold uppercase tracking-[0.12em] transition",
								activeTab === tab.id
									? "border-accent text-accent"
									: "border-transparent text-ink-soft hover:text-ink",
							)}
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							type="button"
						>
							{tab.label}
						</button>
					))}
				</nav>

				{activeTab === "audio" ? (
					<section className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
						<ReelList
							deletingId={deletingId}
							deleteTargetId={deleteTargetId}
							onNew={createNewReel}
							onRequestDelete={requestDeleteReel}
							onSelect={selectReel}
							reels={reels}
							selectedId={selectedId}
						/>
						<div className="grid content-start gap-4">
							{deleteTarget ? (
								<div className="grid gap-3 border border-coral/30 bg-coral/10 p-4">
									<p className="text-coral text-sm">
										Delete "{deleteTarget.title}" from the reel library and public
										delivery.
									</p>
									<div className="flex flex-wrap gap-2">
										<button
											className="min-h-10 bg-coral px-4 text-sm font-bold uppercase tracking-[0.1em] text-white disabled:cursor-not-allowed disabled:opacity-50"
											disabled={deletingId !== null}
											onClick={() => void deleteReel(deleteTarget)}
											type="button"
										>
											{deletingId === deleteTarget.id ? "Deleting" : "Delete reel"}
										</button>
										<button
											className="min-h-10 border border-line bg-white px-4 text-ink text-sm font-bold uppercase tracking-[0.1em]"
											disabled={deletingId !== null}
											onClick={() => setDeleteTargetId(null)}
											type="button"
										>
											Cancel
										</button>
									</div>
								</div>
							) : null}
							<div className="border border-line bg-white p-5">
								<KendraAdminReelForm
									deletePending={selectedReel ? deletingId === selectedReel.id : false}
									key={selectedReel?.id ?? "new"}
									onDeleteRequest={requestDeleteReel}
									onSaved={(nextReels, savedReel) => {
										setReels(nextReels);
										setSelectedId(savedReel?.id ?? nextReels[0]?.id ?? null);
										setDeleteTargetId(null);
									}}
									reel={selectedReel}
								/>
							</div>
						</div>
					</section>
				) : null}

				{activeTab === "storage" ? (
					<StoragePanel
						onResourcesChanged={refreshReels}
						storageAnalytics={storageAnalytics}
						storageFiles={storageFiles}
					/>
				) : null}

				{activeTab === "account" ? (
					<section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
						<div className="border border-line bg-white p-6">
							<span className={labelText}>Signed in</span>
							<div className="mt-4 flex items-center gap-4">
								<span className="grid size-14 place-items-center bg-ink font-bold text-white">
									{getInitials(userEmail)}
								</span>
								<div className="min-w-0">
									<div className="truncate font-semibold text-ink">
										{userEmail ?? "Admin session"}
									</div>
									<div className="text-ink-soft text-sm">
										Can manage audio reels and public delivery.
									</div>
								</div>
							</div>
						</div>
						<div className="grid content-start gap-3 border border-line bg-white p-6">
							<a
								className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent"
								href="/voice-over#reels"
							>
								View public reels
							</a>
							<a
								className="inline-flex min-h-11 items-center justify-center border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent"
								href="/admin/logout"
							>
								Sign out
							</a>
						</div>
					</section>
				) : null}
			</section>
		</main>
	);
}
