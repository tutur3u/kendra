"use client";

import { useMemo, useState } from "react";
import type { KendraAdminStudioPayload } from "@/lib/kendra-admin-api";
import type { KendraAdminTargetKey } from "@/lib/kendra-config";
import { cn, labelText, pillButton, shell } from "./ui";

type AdminLink = {
	actionLabel: string;
	cmsHref: string;
	description: string;
	key: KendraAdminTargetKey;
	label: string;
	loginHref: string;
	pathSuffix: string;
};

type SyncState = {
	kind: "idle" | "loading" | "success" | "error";
	label?: string;
	payload?: unknown;
};

function countItems(value: unknown[] | undefined) {
	return Array.isArray(value) ? value.length : 0;
}

function JsonPanel({ state }: { state: SyncState }) {
	if (state.kind === "idle") {
		return (
			<div className="min-h-[260px] border border-line bg-white p-6 text-sm font-medium leading-relaxed text-ink-soft">
				Sync responses will appear here after you compare or push the Kendra
				manifest.
			</div>
		);
	}

	if (state.kind === "loading") {
		return (
			<div className="grid min-h-[260px] place-items-center border border-line bg-white p-6 text-sm font-bold uppercase tracking-[0.18em] text-accent">
				{state.label}
			</div>
		);
	}

	return (
		<pre
			className={cn(
				"min-h-[260px] overflow-auto border p-6 text-xs leading-relaxed",
				state.kind === "error"
					? "border-coral/50 bg-coral/10 text-ink"
					: "border-green/50 bg-white text-ink",
			)}
		>
			{JSON.stringify(state.payload, null, 2)}
		</pre>
	);
}

export function KendraAdminClient({
	adminLinks,
	cmsBaseUrl,
	initialStudio,
	initialTarget,
	userEmail,
	webAppUrl,
	workspaceId,
}: {
	adminLinks: AdminLink[];
	cmsBaseUrl: string;
	initialStudio: KendraAdminStudioPayload;
	initialTarget: KendraAdminTargetKey;
	userEmail: string | null;
	webAppUrl: string;
	workspaceId: string;
}) {
	const [forceApply, setForceApply] = useState(false);
	const [syncState, setSyncState] = useState<SyncState>({ kind: "idle" });
	const activeLink =
		adminLinks.find((link) => link.key === initialTarget) ?? adminLinks[0];
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
			<section className={cn(shell, "py-[clamp(56px,8vw,96px)]")}>
				<div className="grid grid-cols-[minmax(280px,0.52fr)_minmax(0,1.48fr)] gap-10 max-[980px]:grid-cols-1">
					<div className="flex flex-col gap-8">
						<div className="grid gap-5">
							<span className={labelText}>Tuturuuu CMS</span>
							<h1 className="font-serif text-[clamp(3rem,8vw,7rem)] italic leading-[0.86] tracking-tight text-ink">
								Kendra Control Room
							</h1>
							<p className="max-w-[520px] text-[clamp(1rem,1.7vw,1.25rem)] font-light leading-relaxed tracking-tight text-ink-soft">
								Sync the local Kendra manifest, upload public-folder audio and
								images, then open the CMS surfaces for content editing.
							</p>
						</div>
						<div className="grid gap-3 border-t border-line pt-6">
							<span className={labelText}>Signed In</span>
							<strong className="break-all text-sm font-medium text-ink">
								{userEmail ?? "Tuturuuu admin session"}
							</strong>
							<span className="break-all text-xs font-medium text-ink-soft">
								Workspace {workspaceId}
							</span>
						</div>
					</div>

					<div className="grid gap-8">
						<div className="grid grid-cols-4 gap-px border border-line bg-line max-[720px]:grid-cols-2">
							{stats.map((stat) => (
								<div key={stat.label} className="grid gap-3 bg-white p-6">
									<span className={labelText}>{stat.label}</span>
									<strong className="font-serif text-4xl italic font-normal leading-none text-ink">
										{stat.value}
									</strong>
								</div>
							))}
						</div>

						<div className="grid grid-cols-[minmax(220px,0.75fr)_minmax(0,1.25fr)] gap-px border border-line bg-line max-[820px]:grid-cols-1">
							<div className="bg-white p-6">
								<span className={labelText}>CMS Targets</span>
								<div className="mt-6 grid gap-3">
									{adminLinks.map((link) => (
										<a
											className={cn(
												"block border px-4 py-3 text-sm font-medium tracking-tight transition",
												link.key === activeLink.key
													? "border-accent bg-accent text-white"
													: "border-line text-ink hover:border-accent hover:text-accent",
											)}
											href={link.cmsHref}
											key={link.key}
											rel="noreferrer"
											target="_blank"
										>
											{link.label}
										</a>
									))}
								</div>
							</div>
							<div className="grid gap-6 bg-white p-6">
								<div className="grid gap-3">
									<span className={labelText}>{activeLink.label}</span>
									<p className="text-lg font-light leading-relaxed tracking-tight text-ink">
										{activeLink.description}
									</p>
								</div>
								<div className="flex flex-wrap gap-3">
									<a
										className={cn(pillButton, "bg-ink text-white")}
										href={activeLink.cmsHref}
										rel="noreferrer"
										target="_blank"
									>
										{activeLink.actionLabel}
									</a>
									<a
										className={cn(pillButton, "bg-transparent text-ink")}
										href={cmsBaseUrl}
										rel="noreferrer"
										target="_blank"
									>
										CMS Root
									</a>
									<a
										className={cn(pillButton, "bg-transparent text-ink")}
										href={webAppUrl}
										rel="noreferrer"
										target="_blank"
									>
										Tuturuuu
									</a>
								</div>
							</div>
						</div>

						<div className="grid gap-6 border border-line bg-white p-6">
							<div className="flex flex-wrap items-end justify-between gap-4">
								<div className="grid gap-2">
									<span className={labelText}>Manifest Sync</span>
									<p className="max-w-[560px] text-sm font-medium leading-relaxed text-ink-soft">
										Diff before pushing. Apply uploads local public assets before
										updating the CMS manifest and revalidating Kendra pages.
									</p>
								</div>
								<label className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
									<input
										checked={forceApply}
										className="h-4 w-4 accent-current"
										onChange={(event) => setForceApply(event.currentTarget.checked)}
										type="checkbox"
									/>
									Force apply
								</label>
							</div>
							<div className="flex flex-wrap gap-3">
								<button
									className={cn(pillButton, "bg-transparent text-ink disabled:opacity-50")}
									disabled={syncState.kind === "loading"}
									onClick={() => void runSync("diff")}
									type="button"
								>
									Diff manifest
								</button>
								<button
									className={cn(pillButton, "bg-ink text-white disabled:opacity-50")}
									disabled={syncState.kind === "loading"}
									onClick={() => void runSync("apply")}
									type="button"
								>
									Push manifest
								</button>
							</div>
							<JsonPanel state={syncState} />
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
