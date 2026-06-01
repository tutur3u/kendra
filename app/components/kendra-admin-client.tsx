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

function countItems(value: unknown[] | undefined) {
	return Array.isArray(value) ? value.length : 0;
}

export function KendraAdminClient({
	adminLinks,
	cmsBaseUrl,
	initialStudio,
	initialTarget,
	publicAssets,
	userEmail,
	webAppUrl,
	workspaceId,
}: {
	adminLinks: AdminLink[];
	cmsBaseUrl: string;
	initialStudio: KendraAdminStudioPayload;
	initialTarget: KendraAdminTargetKey;
	publicAssets: KendraPublicAssetPlanItem[];
	userEmail: string | null;
	webAppUrl: string;
	workspaceId: string;
}) {
	const [forceApply, setForceApply] = useState(false);
	const [syncState, setSyncState] = useState<SyncState>({ kind: "idle" });
	const activeLink = adminLinks.find((link) => link.key === initialTarget) ?? adminLinks[0];
	const publicAssetSync = readPublicAssetSync(syncState.payload);
	const stats = useMemo(
		() => [
			{ label: "Collections", value: countItems(initialStudio.collections) },
			{ label: "Entries", value: countItems(initialStudio.entries) },
			{ label: "Assets", value: countItems(initialStudio.assets) },
			{ label: "Blocks", value: countItems(initialStudio.blocks) },
		],
		[initialStudio],
	);

	const runSync = async (mode: "diff" | "apply") => {
		setSyncState({
			kind: "loading",
			label: mode === "diff" ? "Comparing manifest" : "Pushing manifest",
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
		<main className="bg-surface">
			<section className={cn(shell, "grid gap-8 py-[clamp(40px,7vw,88px)]")}>
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
					<div className="min-w-0 rounded-3xl border border-line bg-white p-6 md:p-8">
						<div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
							<div className="min-w-0">
								<span className={labelText}>Tuturuuu CMS</span>
								<h1 className="mt-3 max-w-3xl text-balance font-serif text-[clamp(2.4rem,7vw,5.8rem)] italic leading-[0.9] tracking-tight text-ink">
									Kendra control room
								</h1>
								<p className="mt-5 max-w-[640px] text-base leading-relaxed text-ink-soft md:text-lg">
									Review local content, upload public audio and images, then open the CMS surfaces for editing.
								</p>
							</div>

							<div className="grid min-w-0 gap-2 rounded-2xl border border-line bg-surface p-4 text-sm">
								<span className="font-bold uppercase tracking-[0.16em] text-accent text-xs">Signed in</span>
								<strong className="min-w-0 break-all font-medium text-ink">{userEmail ?? "Tuturuuu admin session"}</strong>
								<span className="min-w-0 break-all text-ink-soft text-xs">Workspace {workspaceId}</span>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						{stats.map((stat) => (
							<div key={stat.label} className="rounded-3xl border border-line bg-white p-5">
								<span className={labelText}>{stat.label}</span>
								<strong className="mt-4 block font-serif text-5xl italic font-normal leading-none text-ink tabular-nums">
									{stat.value}
								</strong>
							</div>
						))}
					</div>
				</div>

				<section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
					<div className="rounded-3xl border border-line bg-white p-5">
						<div className="flex items-center justify-between gap-3">
							<div>
								<span className={labelText}>CMS destinations</span>
								<p className="mt-1 text-sm text-ink-soft">Open the exact workspace surface you need.</p>
							</div>
						</div>

						<div className="mt-5 grid gap-3">
							{adminLinks.map((link) => (
								<a
									className={cn(
										"group grid gap-2 rounded-2xl border p-4 transition",
										link.key === activeLink.key
											? "border-accent bg-accent text-white"
											: "border-line bg-surface text-ink hover:border-accent hover:bg-white",
									)}
									href={link.cmsHref}
									key={link.key}
									rel="noreferrer"
									target="_blank"
								>
									<div className="flex items-center justify-between gap-3">
										<span className="font-semibold">{link.label}</span>
										<span className="text-xl leading-none transition group-hover:translate-x-0.5">→</span>
									</div>
									<p className={cn("text-sm leading-relaxed", link.key === activeLink.key ? "text-white/75" : "text-ink-soft")}>
										{link.description}
									</p>
								</a>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-line bg-white p-5">
						<span className={labelText}>Quick links</span>
						<h2 className="mt-3 font-serif text-4xl italic leading-none text-ink">{activeLink.label}</h2>
						<p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">{activeLink.description}</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<a className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent" href={activeLink.cmsHref} rel="noreferrer" target="_blank">
								{activeLink.actionLabel}
							</a>
							<a className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent" href={cmsBaseUrl} rel="noreferrer" target="_blank">
								CMS root
							</a>
							<a className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent" href={webAppUrl} rel="noreferrer" target="_blank">
								Tuturuuu
							</a>
						</div>
					</div>
				</section>

				<AssetReadinessTable assets={publicAssets} sync={publicAssetSync} />

				<section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
					<div className="rounded-3xl border border-line bg-white p-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<span className={labelText}>Manifest sync</span>
								<h2 className="mt-3 font-semibold text-2xl text-ink">Compare, upload, apply</h2>
								<p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
									Diff first when checking content. Push uploads public assets, applies the manifest, and revalidates Kendra pages.
								</p>
							</div>
							<label className="inline-flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
								<input checked={forceApply} className="h-4 w-4 accent-current" onChange={(event) => setForceApply(event.currentTarget.checked)} type="checkbox" />
								Force apply
							</label>
						</div>

						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							<button className="min-h-12 rounded-full border border-ink bg-white px-6 text-sm font-bold uppercase tracking-[0.12em] text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={syncState.kind === "loading"} onClick={() => void runSync("diff")} type="button">
								Diff manifest
							</button>
							<button className="min-h-12 rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50" disabled={syncState.kind === "loading"} onClick={() => void runSync("apply")} type="button">
								Push manifest
							</button>
						</div>
					</div>

					<div className="grid gap-4">
						<SyncSummary state={syncState} />
						<JsonDetails state={syncState} />
					</div>
				</section>
			</section>
		</main>
	);
}
