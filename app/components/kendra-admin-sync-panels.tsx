import type { KendraPublicAssetPlanItem } from "@/lib/kendra-public-asset-sync";
import { cn, labelText } from "./ui";

export type SyncState = {
	kind: "idle" | "loading" | "success" | "error";
	label?: string;
	payload?: unknown;
};

type PublicAssetSyncPayload = {
	skipped?: Array<KendraPublicAssetPlanItem & { attempts?: unknown[]; reason?: string }>;
	uploaded?: Array<KendraPublicAssetPlanItem & { bytes?: number; source?: "local" | "public-url" }>;
};

export function readPublicAssetSync(payload: unknown): PublicAssetSyncPayload | null {
	if (!payload || typeof payload !== "object" || !("publicAssetSync" in payload)) {
		return null;
	}

	const sync = (payload as { publicAssetSync?: unknown }).publicAssetSync;

	if (!sync || typeof sync !== "object") {
		return null;
	}

	return sync as PublicAssetSyncPayload;
}

function readError(payload: unknown) {
	if (!payload || typeof payload !== "object" || !("error" in payload)) {
		return null;
	}

	const error = (payload as { error?: unknown }).error;
	return typeof error === "string" ? error : null;
}

function statusClass(status: "missing" | "pending" | "uploaded") {
	if (status === "uploaded") return "border-green/25 bg-green/10 text-green-deep";
	if (status === "missing") return "border-coral/25 bg-coral/10 text-coral";
	return "border-line bg-surface text-ink-soft";
}

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function metadataSummary(asset: KendraPublicAssetPlanItem) {
	if (!asset.metadata) return "Not observed locally";

	const dimensions =
		asset.metadata.width && asset.metadata.height
			? `, ${asset.metadata.width}x${asset.metadata.height}`
			: "";

	return `${asset.metadata.contentType}, ${formatBytes(asset.metadata.bytes)}${dimensions}`;
}

export function JsonDetails({ state }: { state: SyncState }) {
	if (state.kind === "idle") {
		return (
			<div className="rounded-2xl border border-dashed border-line bg-white p-5 text-sm leading-relaxed text-ink-soft">
				Run a diff or push the manifest to inspect the CMS response.
			</div>
		);
	}

	if (state.kind === "loading") {
		return (
			<div className="grid min-h-40 place-items-center rounded-2xl border border-line bg-white p-6 text-center text-sm font-bold uppercase tracking-[0.18em] text-accent">
				{state.label}
			</div>
		);
	}

	return (
		<details className="group rounded-2xl border border-line bg-white">
			<summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-ink transition hover:text-accent">
				Response details
			</summary>
			<div className="border-line border-t p-0">
				<pre
					className={cn(
						"max-h-[420px] overflow-auto p-5 text-xs leading-relaxed",
						state.kind === "error" ? "bg-coral/10 text-ink" : "bg-surface text-ink",
					)}
				>
					{JSON.stringify(state.payload, null, 2)}
				</pre>
			</div>
		</details>
	);
}

export function AssetReadinessTable({
	assets,
	sync,
}: {
	assets: KendraPublicAssetPlanItem[];
	sync: PublicAssetSyncPayload | null;
}) {
	const uploaded = new Set(sync?.uploaded?.map((asset) => asset.publicPath) ?? []);
	const skipped = new Map(sync?.skipped?.map((asset) => [asset.publicPath, asset]) ?? []);

	return (
		<section className="overflow-hidden rounded-2xl border border-line bg-white">
			<div className="flex flex-col gap-2 border-line border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<span className={labelText}>Asset readiness</span>
					<p className="mt-1 text-sm text-ink-soft">Public assets are uploaded before the CMS manifest is applied.</p>
				</div>
				<span className="text-sm font-medium text-ink-soft tabular-nums">
					{assets.length} file{assets.length === 1 ? "" : "s"}
				</span>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[760px] border-collapse text-left text-sm">
					<thead className="bg-surface text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft">
						<tr>
							<th className="px-5 py-3 font-bold">File</th>
							<th className="px-5 py-3 font-bold">CMS location</th>
							<th className="px-5 py-3 font-bold">Public path</th>
							<th className="px-5 py-3 font-bold">Observed metadata</th>
							<th className="px-5 py-3 font-bold">Status</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-line">
						{assets.map((asset) => {
							const skippedAsset = skipped.get(asset.publicPath);
							const status = uploaded.has(asset.publicPath) ? "uploaded" : skippedAsset ? "missing" : "pending";

							return (
								<tr key={`${asset.collectionSlug}-${asset.entrySlug}-${asset.filename}`}>
									<td className="px-5 py-4 font-medium text-ink">{asset.filename}</td>
									<td className="px-5 py-4 text-ink-soft">
										<div className="max-w-[260px] break-words">
											{asset.collectionSlug} / {asset.entrySlug}
										</div>
									</td>
									<td className="px-5 py-4">
										<code className="break-all rounded-md bg-surface px-2 py-1 text-xs text-ink">{asset.publicPath}</code>
									</td>
									<td className="px-5 py-4 text-ink-soft">
										<div className="max-w-[220px] break-words text-xs">{metadataSummary(asset)}</div>
									</td>
									<td className="px-5 py-4">
										<span
											className={cn(
												"inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em]",
												statusClass(status),
											)}
											title={skippedAsset?.reason}
										>
											{status}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export function SyncSummary({ state }: { state: SyncState }) {
	const sync = readPublicAssetSync(state.payload);
	const error = readError(state.payload);

	if (state.kind === "idle" || state.kind === "loading") {
		return null;
	}

	if (state.kind === "error") {
		return (
			<div className="rounded-2xl border border-coral/25 bg-coral/10 p-5">
				<div className="font-semibold text-coral">Manifest push needs attention</div>
				<p className="mt-2 text-sm leading-relaxed text-ink-soft">{error ?? "The request failed. Review the details and try again."}</p>
				{sync?.skipped?.length ? (
					<ul className="mt-4 grid gap-2 text-sm">
						{sync.skipped.map((asset) => (
							<li key={asset.publicPath} className="rounded-lg border border-coral/20 bg-white/70 p-3">
								<div className="font-medium text-ink">{asset.filename}</div>
								<div className="mt-1 break-all text-ink-soft text-xs">{asset.reason}</div>
							</li>
						))}
					</ul>
				) : null}
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-green/25 bg-green/10 p-5">
			<div className="font-semibold text-green-deep">CMS manifest is ready</div>
			<p className="mt-2 text-sm leading-relaxed text-ink-soft">
				{sync
					? `${sync.uploaded?.length ?? 0} public asset(s) uploaded, ${sync.skipped?.length ?? 0} skipped.`
					: "The CMS response completed successfully."}
			</p>
		</div>
	);
}
