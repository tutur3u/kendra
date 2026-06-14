"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { KendraStorageAnalyticsState } from "@/lib/kendra-storage-analytics";
import type {
	KendraStorageFileItem,
	KendraStorageFilesState,
} from "@/lib/kendra-storage-files";
import { adminFetch } from "./kendra-admin-session-client";
import { labelText } from "./ui";

type ReadyStorageAnalytics = Extract<
	KendraStorageAnalyticsState,
	{ status: "ready" }
>;
type ReadyStorageFiles = Extract<KendraStorageFilesState, { status: "ready" }>;

const byteUnits = ["B", "KB", "MB", "GB", "TB"] as const;

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

function joinStoragePath(...parts: Array<string | null | undefined>) {
	return parts
		.flatMap((part) => part?.split("/") ?? [])
		.map((part) => part.trim())
		.filter(Boolean)
		.join("/");
}

function buildTuturuuuDriveUrl({
	baseUrl,
	path,
	prefix,
}: {
	baseUrl: string;
	path?: string;
	prefix: string;
}) {
	try {
		const url = new URL(baseUrl);
		const drivePath = joinStoragePath(prefix, path);

		if (drivePath) {
			url.searchParams.set("path", drivePath);
		}

		return url.toString();
	} catch {
		return baseUrl;
	}
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
	tuturuuuDriveHref,
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
	tuturuuuDriveHref: string;
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
				{!isRenaming && !isConfirmingDelete ? (
					<a
						className="inline-flex min-h-10 items-center border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
						href={tuturuuuDriveHref}
						rel="noreferrer"
						target="_blank"
					>
						View in Drive
					</a>
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

function StorageLoadingPanel() {
	return (
		<section className="border border-line bg-white p-6">
			<span className={labelText}>Storage</span>
			<div className="mt-4 flex items-center gap-3 text-ink-soft text-sm">
				<span
					aria-hidden="true"
					className="h-5 w-5 animate-[slow-spin_700ms_linear_infinite] rounded-full border-2 border-accent/25 border-t-accent"
				/>
				<span>Loading storage details...</span>
			</div>
		</section>
	);
}

export function KendraAdminStoragePanel({
	onResourcesChanged,
	tuturuuuDrivePathPrefix,
	tuturuuuDriveUrl,
}: {
	onResourcesChanged: () => Promise<void>;
	tuturuuuDrivePathPrefix: string;
	tuturuuuDriveUrl: string;
}) {
	const [analyticsState, setAnalyticsState] =
		useState<KendraStorageAnalyticsState | null>(null);
	const [filesState, setFilesState] = useState<KendraStorageFilesState | null>(
		null,
	);
	const [currentPath, setCurrentPath] = useState("");
	const [folderName, setFolderName] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(
		null,
	);
	const [message, setMessage] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const refreshStorage = useCallback(async (path: string) => {
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
			} else {
				setAnalyticsState({
					message: "Storage analytics are not available right now.",
					status: "unavailable",
				});
			}
		} catch {
			setAnalyticsState({
				message: "Storage analytics are not available right now.",
				status: "unavailable",
			});
			setFilesState({
				message: "Files are not available right now.",
				status: "unavailable",
			});
		} finally {
			setBusy(false);
		}
	}, []);

	useEffect(() => {
		void refreshStorage("");
	}, [refreshStorage]);

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

	if (!analyticsState && !filesState) {
		return <StorageLoadingPanel />;
	}

	if (
		analyticsState?.status === "unavailable" &&
		filesState?.status === "unavailable"
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

	const data = analyticsState?.status === "ready" ? analyticsState.data : null;
	const usagePercentage = data
		? Math.max(0, Math.min(100, data.usagePercentage))
		: 0;
	const files = filesState?.status === "ready" ? filesState.data.items : [];
	const pathLabel = currentPath || "Main room";
	const currentDriveHref = buildTuturuuuDriveUrl({
		baseUrl: tuturuuuDriveUrl,
		path: currentPath,
		prefix: tuturuuuDrivePathPrefix,
	});

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
							<div className="flex flex-wrap items-center gap-3 md:justify-end">
								<a
									className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-5 font-bold text-white text-xs uppercase tracking-[0.1em] transition hover:bg-accent"
									href={currentDriveHref}
									rel="noreferrer"
									target="_blank"
								>
									View on Tuturuuu
								</a>
								<strong className="text-4xl font-semibold text-accent">
									{usagePercentage.toFixed(usagePercentage % 1 === 0 ? 0 : 1)}%
								</strong>
							</div>
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
						<a
							className="inline-flex min-h-10 items-center border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent"
							href={currentDriveHref}
							rel="noreferrer"
							target="_blank"
						>
							View on Tuturuuu
						</a>
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
					{filesState?.status === "unavailable" ? (
						<p className="text-ink-soft text-sm">{filesState.message}</p>
					) : files.length > 0 ? (
						files.map((item) => (
							<StorageFileRow
								busy={busy}
								confirmDeletePath={confirmDeletePath}
								item={item}
								key={item.path}
								tuturuuuDriveHref={buildTuturuuuDriveUrl({
									baseUrl: tuturuuuDriveUrl,
									path: item.path,
									prefix: tuturuuuDrivePathPrefix,
								})}
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
							{busy ? "Loading files..." : "No files in this spot yet."}
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
