import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import {
	getExternalProjectPublicAssetFilename,
	getExternalProjectPublicAssetStoragePath,
	getExternalProjectPublicAssetUploads,
	linkExternalProjectPublicFolderAssets,
} from "tuturuuu/external-projects/public-assets";
import type { ExternalProjectsClient } from "tuturuuu/external-projects";

type SyncManifest = Parameters<ExternalProjectsClient["applySyncManifest"]>[1];

type UploadUrlClient = Pick<ExternalProjectsClient, "createAssetUploadUrl">;

export type KendraPublicAssetPlanItem = {
	collectionSlug: string;
	entrySlug: string;
	filename: string;
	metadata: KendraObservedPublicAssetMetadata | null;
	publicPath: string;
	stableSourceId: string | null;
	storagePath: string;
};

type PublicAssetUploadDescriptor = KendraPublicAssetPlanItem;

type PublicAssetSourceAttempt = {
	source: "local" | "public-url";
	detail: string;
	ok: boolean;
	reason?: string;
};

type PublicAssetSource = {
	bytes: number;
	contentType: string;
	detail: string;
	metadata: KendraObservedPublicAssetMetadata;
	source: "local" | "public-url";
	value: Uint8Array;
};

export type KendraPublicAssetUpload = PublicAssetUploadDescriptor & {
	bytes: number;
	contentType: string;
	source: "local" | "public-url";
};

export type KendraObservedPublicAssetMetadata = {
	bytes: number;
	contentType: string;
	filename: string;
	height?: number;
	publicPath: string;
	width?: number;
};

export type KendraPublicAssetSkipped = PublicAssetUploadDescriptor & {
	attempts: PublicAssetSourceAttempt[];
	reason: string;
};

export type KendraPublicAssetSyncResult = {
	manifest: SyncManifest;
	skipped: KendraPublicAssetSkipped[];
	uploaded: KendraPublicAssetUpload[];
};

export type KendraPublicAssetSyncOptions = {
	appBaseUrl: string;
	fetch?: typeof fetch;
	publicDir?: string;
	upsert?: boolean;
};

const CONTENT_TYPES: Record<string, string> = {
	".gif": "image/gif",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".mp3": "audio/mpeg",
	".mp4": "video/mp4",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webp": "image/webp",
};

function contentTypeForPath(publicPath: string) {
	return CONTENT_TYPES[extname(publicPath).toLowerCase()] ?? "application/octet-stream";
}

function resolvePublicFilePath(publicDir: string, publicPath: string) {
	const publicRoot = resolve(publicDir);
	const filePath = resolve(publicRoot, publicPath.slice(1));

	if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${sep}`)) {
		throw new Error(`Refusing to read public asset outside publicDir: ${publicPath}`);
	}

	return filePath;
}

function readErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function pngDimensions(bytes: Uint8Array) {
	if (
		bytes.length < 24 ||
		bytes[0] !== 0x89 ||
		bytes[1] !== 0x50 ||
		bytes[2] !== 0x4e ||
		bytes[3] !== 0x47
	) {
		return null;
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	return {
		height: view.getUint32(20),
		width: view.getUint32(16),
	};
}

function imageDimensions(bytes: Uint8Array, contentType: string) {
	if (contentType === "image/png") {
		return pngDimensions(bytes);
	}

	return null;
}

function observedMetadata({
	bytes,
	contentType,
	filename,
	publicPath,
	value,
}: {
	bytes: number;
	contentType: string;
	filename: string;
	publicPath: string;
	value: Uint8Array;
}): KendraObservedPublicAssetMetadata {
	const dimensions = imageDimensions(value, contentType);

	return {
		bytes,
		contentType,
		filename,
		publicPath,
		...(dimensions ?? {}),
	};
}

function getUploadDescriptor({
	asset,
	entry,
	manifest,
	publicPath,
}: ReturnType<typeof getExternalProjectPublicAssetUploads>[number] & {
	manifest: SyncManifest;
}): PublicAssetUploadDescriptor {
	return {
		collectionSlug: entry.collectionSlug,
		entrySlug: entry.slug,
		filename: getExternalProjectPublicAssetFilename(publicPath),
		metadata:
			asset.metadata &&
			typeof asset.metadata === "object" &&
			"observedPublicAsset" in asset.metadata
				? (asset.metadata.observedPublicAsset as KendraObservedPublicAssetMetadata)
				: null,
		publicPath,
		stableSourceId: asset.stableSourceId ?? null,
		storagePath:
			asset.storagePath ??
			getExternalProjectPublicAssetStoragePath({
				adapter: manifest.adapter,
				collectionSlug: entry.collectionSlug,
				entrySlug: entry.slug,
				publicPath,
			}),
	};
}

async function readLocalPublicAsset({
	descriptor,
	publicDir,
}: {
	descriptor: PublicAssetUploadDescriptor;
	publicDir: string;
}) {
	const filePath = resolvePublicFilePath(publicDir, descriptor.publicPath);
	const file = await readFile(filePath);
	const value = new Uint8Array(file);
	const bytes = value.byteLength;
	const contentType = contentTypeForPath(descriptor.publicPath);

	return {
		bytes,
		contentType,
		detail: filePath,
		metadata: observedMetadata({
			bytes,
			contentType,
			filename: descriptor.filename,
			publicPath: descriptor.publicPath,
			value,
		}),
		source: "local" as const,
		value,
	};
}

async function observeLocalPublicAssetMetadata({
	descriptor,
	publicDir,
}: {
	descriptor: PublicAssetUploadDescriptor;
	publicDir: string;
}) {
	const filePath = resolvePublicFilePath(publicDir, descriptor.publicPath);
	const file = await readFile(filePath);
	const value = new Uint8Array(file);
	const bytes = value.byteLength;
	const contentType = contentTypeForPath(descriptor.publicPath);

	return observedMetadata({
		bytes,
		contentType,
		filename: descriptor.filename,
		publicPath: descriptor.publicPath,
		value,
	});
}

async function fetchPublicAsset({
	appBaseUrl,
	descriptor,
	fetchImpl,
}: {
	appBaseUrl: string;
	descriptor: PublicAssetUploadDescriptor;
	fetchImpl: typeof fetch;
}) {
	const assetUrl = new URL(descriptor.publicPath, appBaseUrl).toString();
	const response = await fetchImpl(assetUrl, { cache: "no-store" });

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || contentTypeForPath(descriptor.publicPath);
	const buffer = await response.arrayBuffer();
	const value = new Uint8Array(buffer);
	const bytes = value.byteLength;

	return {
		bytes,
		contentType,
		detail: assetUrl,
		metadata: observedMetadata({
			bytes,
			contentType,
			filename: descriptor.filename,
			publicPath: descriptor.publicPath,
			value,
		}),
		source: "public-url" as const,
		value,
	};
}

function toArrayBuffer(bytes: Uint8Array) {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);
	return buffer;
}

function attachObservedMetadata(
	asset: ReturnType<typeof getExternalProjectPublicAssetUploads>[number]["asset"],
	source: PublicAssetSource,
) {
	asset.metadata = {
		...(asset.metadata ?? {}),
		observedPublicAsset: source.metadata,
	};
}

async function uploadAsset({
	client,
	descriptor,
	fetchImpl,
	source,
	upsert,
	workspaceId,
}: {
	client: UploadUrlClient;
	descriptor: PublicAssetUploadDescriptor;
	fetchImpl: typeof fetch;
	source: PublicAssetSource;
	upsert: boolean;
	workspaceId: string;
}) {
	const uploadUrl = await client.createAssetUploadUrl(workspaceId, {
		collectionType: descriptor.collectionSlug,
		entrySlug: descriptor.entrySlug,
		filename: descriptor.filename,
		upsert,
	});
	const body = toArrayBuffer(source.value);
	let uploadResponse = await fetchImpl(uploadUrl.signedUrl, {
		body,
		cache: "no-store",
		headers: {
			Authorization: `Bearer ${uploadUrl.token}`,
			"Content-Type": source.contentType,
		},
		method: "PUT",
	});

	if (!uploadResponse.ok) {
		uploadResponse = await fetchImpl(uploadUrl.signedUrl, {
			body,
			cache: "no-store",
			headers: {
				Authorization: `Bearer ${uploadUrl.token}`,
			},
			method: "PUT",
		});
	}

	if (!uploadResponse.ok) {
		const message = await uploadResponse.text().catch(() => "");
		throw new Error(
			`Failed to upload public asset ${descriptor.publicPath} (${uploadResponse.status})${message ? `: ${message}` : ""}`,
		);
	}
}

export async function uploadKendraPublicManifestAssets(
	client: UploadUrlClient,
	workspaceId: string,
	manifestInput: SyncManifest,
	options: KendraPublicAssetSyncOptions,
): Promise<KendraPublicAssetSyncResult> {
	const manifest = linkExternalProjectPublicFolderAssets(manifestInput) as SyncManifest;
	const publicDir = options.publicDir ?? resolve(process.cwd(), "public");
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const uploaded: KendraPublicAssetUpload[] = [];
	const skipped: KendraPublicAssetSkipped[] = [];

	for (const upload of getExternalProjectPublicAssetUploads(manifest)) {
		const descriptor = getUploadDescriptor({ ...upload, manifest });
		const attempts: PublicAssetSourceAttempt[] = [];
		let source: PublicAssetSource | null = null;

		try {
			source = await readLocalPublicAsset({ descriptor, publicDir });
			attempts.push({ detail: source.detail, ok: true, source: "local" });
		} catch (error) {
			attempts.push({
				detail: resolvePublicFilePath(publicDir, descriptor.publicPath),
				ok: false,
				reason: readErrorMessage(error),
				source: "local",
			});
		}

		if (!source) {
			try {
				source = await fetchPublicAsset({
					appBaseUrl: options.appBaseUrl,
					descriptor,
					fetchImpl,
				});
				attempts.push({ detail: source.detail, ok: true, source: "public-url" });
			} catch (error) {
				attempts.push({
					detail: new URL(descriptor.publicPath, options.appBaseUrl).toString(),
					ok: false,
					reason: readErrorMessage(error),
					source: "public-url",
				});
			}
		}

		if (!source) {
			const reason = attempts
				.filter((attempt) => !attempt.ok)
				.map((attempt) => `${attempt.source}: ${attempt.reason}`)
				.join("; ");
			skipped.push({
				...descriptor,
				attempts,
				reason: reason || "Asset was not found locally or at the public URL.",
			});
			continue;
		}

		attachObservedMetadata(upload.asset, source);
		await uploadAsset({
			client,
			descriptor,
			fetchImpl,
			source,
			upsert: options.upsert ?? true,
			workspaceId,
		});
		uploaded.push({
			...descriptor,
			bytes: source.bytes,
			contentType: source.contentType,
			metadata: source.metadata,
			source: source.source,
		});
	}

	return { manifest, skipped, uploaded };
}

export async function getKendraPublicManifestAssetPlan(
	manifestInput: SyncManifest,
	options: { publicDir?: string } = {},
) {
	const manifest = linkExternalProjectPublicFolderAssets(manifestInput) as SyncManifest;
	const publicDir = options.publicDir ?? resolve(process.cwd(), "public");
	const plan: KendraPublicAssetPlanItem[] = [];

	for (const upload of getExternalProjectPublicAssetUploads(manifest)) {
		const descriptor = getUploadDescriptor({ ...upload, manifest });

		plan.push({
			...descriptor,
			metadata: await observeLocalPublicAssetMetadata({ descriptor, publicDir }).catch(() => descriptor.metadata),
		});
	}

	return plan;
}
