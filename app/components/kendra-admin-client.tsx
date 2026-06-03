"use client";

import { useMemo, useState } from "react";
import type { KendraAdminStudioPayload } from "@/lib/kendra-admin-api";
import type { KendraAdminTargetKey } from "@/lib/kendra-config";
import type { KendraPublicAssetPlanItem } from "@/lib/kendra-public-asset-sync";
import {
	AssetReadinessTable,
	JsonDetails,
	readPublicAssetSync,
	SyncSummary,
	type SyncState,
} from "./kendra-admin-sync-panels";
import { cn, labelText, shell } from "./ui";

type AdminLink = {
	actionLabel: string;
	cmsHref: string;
	description: string;
	key: KendraAdminTargetKey;
	label: string;
	loginHref: string;
	pathSuffix: string;
};

type AdminTab = "reels" | "uploads" | "publish" | "account";

type VoiceReel = {
	audioUrl: string | null;
	category: string;
	duration: string | null;
	featured: boolean;
	id: string;
	status: string;
	style: string | null;
	summary: string | null;
	title: string;
};

const tabs: Array<{ id: AdminTab; label: string }> = [
	{ id: "reels", label: "Reels" },
	{ id: "uploads", label: "Uploads" },
	{ id: "publish", label: "Publish" },
	{ id: "account", label: "Account" },
];

function readRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function readString(record: Record<string, unknown>, key: string) {
	const value = record[key];
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBoolean(record: Record<string, unknown>, key: string) {
	return record[key] === true;
}

function getLink(adminLinks: AdminLink[], key: KendraAdminTargetKey) {
	return adminLinks.find((link) => link.key === key) ?? adminLinks[0]!;
}

function getEntryCollectionSlug(
	entry: Record<string, unknown>,
	collectionById: Map<string, Record<string, unknown>>,
) {
	const directSlug = readString(entry, "collectionSlug") ?? readString(entry, "collection_slug");
	if (directSlug) return directSlug;

	const collectionId = readString(entry, "collection_id");
	const collection = collectionId ? collectionById.get(collectionId) : null;
	return collection ? readString(collection, "slug") : null;
}

function getAssetEntryId(asset: Record<string, unknown>) {
	return readString(asset, "entry_id") ?? readString(asset, "entryId");
}

function getAssetType(asset: Record<string, unknown>) {
	return readString(asset, "asset_type") ?? readString(asset, "assetType");
}

function getAssetUrl(asset: Record<string, unknown> | undefined) {
	if (!asset) return null;

	return (
		readString(asset, "asset_url") ??
		readString(asset, "assetUrl") ??
		readString(asset, "source_url") ??
		readString(asset, "sourceUrl")
	);
}

function readVoiceReels(studio: KendraAdminStudioPayload) {
	const collectionById = new Map(
		studio.collections.map((collection) => [String(collection.id), collection]),
	);
	const audioAssets = studio.assets.filter((asset) => getAssetType(asset) === "audio");

	return studio.entries
		.filter((entry) => getEntryCollectionSlug(entry, collectionById) === "voice-reels")
		.map<VoiceReel>((entry) => {
			const profileData = readRecord(entry.profile_data ?? entry.profileData);
			const audioAsset = audioAssets.find((asset) => getAssetEntryId(asset) === String(entry.id));
			const audioMetadata = readRecord(audioAsset?.metadata);

			return {
				audioUrl: getAssetUrl(audioAsset),
				category: readString(profileData, "category") ?? "Voice reel",
				duration:
					readString(profileData, "duration") ?? readString(audioMetadata, "duration"),
				featured: readBoolean(profileData, "featured"),
				id: String(entry.id),
				status: readString(entry, "status") ?? "draft",
				style: readString(profileData, "style"),
				summary: readString(entry, "summary"),
				title: readString(entry, "title") ?? "Untitled reel",
			};
		})
		.sort((left, right) => Number(right.featured) - Number(left.featured) || left.title.localeCompare(right.title));
}

function formatStatus(value: string) {
	return value
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function statusClass(value: string) {
	if (value === "published") return "border-green/25 bg-green/10 text-green-deep";
	if (value === "draft") return "border-sun/35 bg-sun/15 text-ink";
	return "border-line bg-surface text-ink-soft";
}

function getInitials(email: string | null) {
	if (!email) return "KB";

	const [name] = email.split("@");
	const parts = name?.split(/[._-]+/).filter(Boolean) ?? [];
	const initials = parts.map((part) => part[0]).join("").slice(0, 2);
	return initials.toUpperCase() || "KB";
}

export function KendraAdminClient({
	adminLinks,
	initialStudio,
	initialTarget,
	publicAssets,
	userEmail,
}: {
	adminLinks: AdminLink[];
	initialStudio: KendraAdminStudioPayload;
	initialTarget: KendraAdminTargetKey;
	publicAssets: KendraPublicAssetPlanItem[];
	userEmail: string | null;
}) {
	const [activeTab, setActiveTab] = useState<AdminTab>(
		initialTarget === "preview" ? "publish" : "reels",
	);
	const [forceApply, setForceApply] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [syncState, setSyncState] = useState<SyncState>({ kind: "idle" });
	const reels = useMemo(() => readVoiceReels(initialStudio), [initialStudio]);
	const publicAssetSync = readPublicAssetSync(syncState.payload);
	const libraryLink = getLink(adminLinks, "library");
	const previewLink = getLink(adminLinks, "preview");
	const publishedCount = reels.filter((reel) => reel.status === "published").length;
	const draftCount = reels.filter((reel) => reel.status !== "published").length;
	const readyAudioFiles = publicAssets.filter((asset) => asset.metadata).length;
	const missingAudioFiles = publicAssets.length - readyAudioFiles;

	const runSync = async (mode: "diff" | "apply") => {
		setSyncState({
			kind: "loading",
			label: mode === "diff" ? "Checking reel changes" : "Publishing reels",
		});

		try {
			const response = await fetch(`/api/admin/sync/${mode}`, {
				body: mode === "apply" ? JSON.stringify({ force: forceApply }) : undefined,
				headers:
					mode === "apply"
						? {
								"Content-Type": "application/json",
							}
						: undefined,
				method: "POST",
			});
			const payload = (await response.json().catch(() => null)) as unknown;

			if (!response.ok) {
				setSyncState({
					kind: "error",
					payload: payload ?? { error: `Request failed with ${response.status}` },
				});
				return;
			}

			setSyncState({ kind: "success", payload });
		} catch (error) {
			setSyncState({
				kind: "error",
				payload: {
					error: error instanceof Error ? error.message : "Sync request failed",
				},
			});
		}
	};

	return (
		<main className="min-h-screen bg-surface">
			<section className={cn(shell, "grid gap-8 py-[clamp(32px,6vw,72px)]")}>
				<header className="flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-3xl">
						<span className={labelText}>Audio reel desk</span>
						<h1 className="mt-3 text-balance font-serif text-[clamp(3rem,8vw,7rem)] italic leading-[0.86] tracking-tight text-ink">
							Reels ready for casting.
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
							Manage Kendra's public listening room, confirm audio files, and publish reel updates from one focused dashboard.
						</p>
					</div>

					<div className="relative self-start lg:self-end">
						<button
							type="button"
							className="flex min-h-12 items-center gap-3 rounded-full border border-line bg-white px-3 py-2 text-left shadow-[0_16px_44px_rgba(10,10,10,0.08)] transition hover:border-accent"
							aria-expanded={accountOpen}
							aria-haspopup="menu"
							onClick={() => setAccountOpen((value) => !value)}
						>
							<span className="grid size-8 place-items-center rounded-full bg-ink text-[0.72rem] font-bold text-white">
								{getInitials(userEmail)}
							</span>
							<span className="grid min-w-0">
								<span className="max-w-52 truncate text-sm font-semibold text-ink">
									{userEmail ?? "Kendra admin"}
								</span>
								<span className="text-ink-soft text-xs">Account</span>
							</span>
						</button>
						<div
							className={cn(
								"absolute right-0 top-14 z-20 grid min-w-56 gap-1 border border-line bg-white p-2 shadow-[0_22px_70px_rgba(10,10,10,0.14)] transition",
								accountOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
							)}
							role="menu"
						>
							<a className="px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface hover:text-accent" href={libraryLink.cmsHref} rel="noreferrer" role="menuitem" target="_blank">
								Open reel editor
							</a>
							<a className="px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface hover:text-accent" href="/admin/logout" role="menuitem">
								Sign out
							</a>
						</div>
					</div>
				</header>

				<div className="flex flex-wrap gap-2 border-b border-line">
					{tabs.map((tab) => (
						<button
							type="button"
							className={cn(
								"min-h-11 border-b-2 px-4 text-sm font-bold uppercase tracking-[0.12em] transition",
								activeTab === tab.id
									? "border-accent text-accent"
									: "border-transparent text-ink-soft hover:text-ink",
							)}
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{activeTab === "reels" ? (
					<section className="grid gap-5">
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="border border-line bg-white p-5">
								<span className={labelText}>Published reels</span>
								<strong className="mt-4 block font-serif text-5xl font-normal italic leading-none text-ink tabular-nums">
									{publishedCount}
								</strong>
							</div>
							<div className="border border-line bg-white p-5">
								<span className={labelText}>Needs review</span>
								<strong className="mt-4 block font-serif text-5xl font-normal italic leading-none text-ink tabular-nums">
									{draftCount}
								</strong>
							</div>
							<div className="border border-line bg-white p-5">
								<span className={labelText}>Audio ready</span>
								<strong className="mt-4 block font-serif text-5xl font-normal italic leading-none text-ink tabular-nums">
									{readyAudioFiles}
								</strong>
							</div>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="font-serif text-4xl font-normal italic leading-none text-ink">Voice reels</h2>
								<p className="mt-2 text-sm text-ink-soft">Each published reel appears on the public listening pages.</p>
							</div>
							<a className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent" href={libraryLink.cmsHref} rel="noreferrer" target="_blank">
								Add or edit reels
							</a>
						</div>

						<div className="grid gap-3">
							{reels.length > 0 ? (
								reels.map((reel) => (
									<article className="grid gap-4 border border-line bg-white p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]" key={reel.id}>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<span className={cn("rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em]", statusClass(reel.status))}>
													{formatStatus(reel.status)}
												</span>
												{reel.featured ? (
													<span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-accent text-xs font-bold uppercase tracking-[0.12em]">
														Featured
													</span>
												) : null}
												<span className="text-ink-soft text-xs">{reel.category}</span>
											</div>
											<h3 className="mt-3 font-serif text-3xl font-normal italic leading-none text-ink">{reel.title}</h3>
											<div className="mt-2 flex flex-wrap gap-3 text-ink-soft text-sm">
												{reel.duration ? <span>{reel.duration}</span> : null}
												{reel.style ? <span>{reel.style}</span> : null}
											</div>
											{reel.summary ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{reel.summary}</p> : null}
										</div>
										<div className="grid content-center gap-3">
											{reel.audioUrl ? (
												<audio className="h-11 w-full" controls preload="metadata" src={reel.audioUrl}>
													<track kind="captions" />
												</audio>
											) : (
												<div className="border border-coral/25 bg-coral/10 p-4 text-coral text-sm">
													Audio file missing. Upload one before publishing.
												</div>
											)}
											<a className="text-sm font-bold uppercase tracking-[0.12em] text-accent underline decoration-accent/25 underline-offset-4" href={libraryLink.cmsHref} rel="noreferrer" target="_blank">
												Edit in reel editor
											</a>
										</div>
									</article>
								))
							) : (
								<div className="border border-dashed border-line bg-white p-8">
									<h3 className="font-serif text-3xl font-normal italic text-ink">No reels synced yet.</h3>
									<p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
										Start by publishing the seeded reel manifest, then add more audio files in the reel editor.
									</p>
								</div>
							)}
						</div>
					</section>
				) : null}

				{activeTab === "uploads" ? (
					<section className="grid gap-5">
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="border border-line bg-white p-5">
								<span className={labelText}>Ready files</span>
								<strong className="mt-4 block font-serif text-5xl font-normal italic leading-none text-ink tabular-nums">
									{readyAudioFiles}
								</strong>
							</div>
							<div className="border border-line bg-white p-5">
								<span className={labelText}>Missing files</span>
								<strong className="mt-4 block font-serif text-5xl font-normal italic leading-none text-ink tabular-nums">
									{missingAudioFiles}
								</strong>
							</div>
						</div>
						<AssetReadinessTable assets={publicAssets} sync={publicAssetSync} />
					</section>
				) : null}

				{activeTab === "publish" ? (
					<section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
						<div className="border border-line bg-white p-5">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<span className={labelText}>Publish controls</span>
									<h2 className="mt-3 font-serif text-4xl font-normal italic leading-none text-ink">Check, then publish.</h2>
									<p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
										Check compares reel changes. Publish uploads public audio files, applies the reel manifest, and refreshes the public pages.
									</p>
								</div>
								<label className="inline-flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
									<input checked={forceApply} className="h-4 w-4 accent-current" onChange={(event) => setForceApply(event.currentTarget.checked)} type="checkbox" />
									Replace existing
								</label>
							</div>

							<div className="mt-6 grid gap-3 sm:grid-cols-2">
								<button className="min-h-12 rounded-full border border-ink bg-white px-6 text-sm font-bold uppercase tracking-[0.12em] text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={syncState.kind === "loading"} onClick={() => void runSync("diff")} type="button">
									Check changes
								</button>
								<button className="min-h-12 rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50" disabled={syncState.kind === "loading"} onClick={() => void runSync("apply")} type="button">
									Publish reels
								</button>
							</div>
							<a className="mt-5 inline-flex text-sm font-bold uppercase tracking-[0.12em] text-accent underline decoration-accent/25 underline-offset-4" href={previewLink.cmsHref} rel="noreferrer" target="_blank">
								Open delivery preview
							</a>
						</div>

						<div className="grid gap-4">
							<SyncSummary state={syncState} />
							<JsonDetails state={syncState} />
						</div>
					</section>
				) : null}

				{activeTab === "account" ? (
					<section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
						<div className="border border-line bg-white p-6">
							<span className={labelText}>Signed in</span>
							<div className="mt-4 flex items-center gap-4">
								<span className="grid size-14 place-items-center rounded-full bg-ink font-bold text-white">{getInitials(userEmail)}</span>
								<div className="min-w-0">
									<div className="truncate font-semibold text-ink">{userEmail ?? "Kendra admin session"}</div>
									<div className="text-ink-soft text-sm">Can manage audio reels and publish public updates.</div>
								</div>
							</div>
						</div>
						<div className="grid content-start gap-3 border border-line bg-white p-6">
							<a className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent" href={libraryLink.cmsHref} rel="noreferrer" target="_blank">
								Open reel editor
							</a>
							<a className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent" href="/voice-over#reels">
								View public reels
							</a>
							<a className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent" href="/admin/logout">
								Sign out
							</a>
						</div>
					</section>
				) : null}
			</section>
		</main>
	);
}
