"use client";

import { useState } from "react";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import { KendraAdminReelForm } from "./kendra-admin-reel-form";
import {
	countByStatus,
	ReelList,
	StatTile,
} from "./kendra-admin-reel-panels";
import { cn, labelText, shell } from "./ui";

type AdminTab = "audio" | "account";

const tabs: Array<{ id: AdminTab; label: string }> = [
	{ id: "audio", label: "Audio" },
	{ id: "account", label: "Account" },
];

function getInitials(email: string | null) {
	if (!email) return "KB";

	const [name] = email.split("@");
	const parts = name?.split(/[._-]+/).filter(Boolean) ?? [];
	const initials = parts.map((part) => part[0]).join("").slice(0, 2);
	return initials.toUpperCase() || "KB";
}

export function KendraAdminClient({
	initialReels,
	userEmail,
}: {
	initialReels: KendraAdminReel[];
	userEmail: string | null;
}) {
	const [activeTab, setActiveTab] = useState<AdminTab>("audio");
	const [accountOpen, setAccountOpen] = useState(false);
	const [reels, setReels] = useState(initialReels);
	const [selectedId, setSelectedId] = useState<string | null>(
		initialReels[0]?.id ?? null,
	);
	const selectedReel = selectedId
		? reels.find((reel) => reel.id === selectedId) ?? null
		: null;
	const publishedCount = countByStatus(reels, "published");
	const readyAudioFiles = reels.filter((reel) => reel.audioUrl).length;

	return (
		<main className="min-h-screen bg-surface">
			<section className={cn(shell, "grid gap-8 py-[clamp(32px,6vw,72px)]")}>
				<header className="flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-3xl">
						<span className={labelText}>Kendra admin</span>
						<h1 className="mt-3 text-balance font-serif text-[clamp(3rem,8vw,7rem)] italic leading-[0.86] tracking-tight text-ink">
							Audio reels, edited in one place.
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
							Create reels, replace audio files, manage public status, and remove outdated demos from a focused workspace.
						</p>
					</div>

					<div className="relative self-start lg:self-end">
						<button
							aria-expanded={accountOpen}
							aria-haspopup="menu"
							className="flex min-h-12 items-center gap-3 border border-line bg-white px-3 py-2 text-left shadow-[0_16px_44px_rgba(10,10,10,0.08)] transition hover:border-accent"
							onClick={() => setAccountOpen((value) => !value)}
							type="button"
						>
							<span className="grid size-8 place-items-center bg-ink text-[0.72rem] font-bold text-white">
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
								accountOpen
									? "translate-y-0 opacity-100"
									: "pointer-events-none -translate-y-1 opacity-0",
							)}
							role="menu"
						>
							<a
								className="px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface hover:text-accent"
								href="/voice-over#reels"
								role="menuitem"
							>
								View public reels
							</a>
							<a
								className="px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface hover:text-accent"
								href="/admin/logout"
								role="menuitem"
							>
								Sign out
							</a>
						</div>
					</div>
				</header>

				<div className="grid gap-3 sm:grid-cols-3">
					<StatTile label="Audio reels" value={reels.length} />
					<StatTile label="Published" value={publishedCount} />
					<StatTile label="Audio ready" value={readyAudioFiles} />
				</div>

				<nav className="flex flex-wrap gap-2 border-b border-line" aria-label="Admin sections">
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
							onNew={() => setSelectedId(null)}
							onSelect={(id) => setSelectedId(id)}
							reels={reels}
							selectedId={selectedId}
						/>
						<div className="border border-line bg-white p-5">
							<KendraAdminReelForm
								key={selectedReel?.id ?? "new"}
								onDeleted={(nextReels) => {
									setReels(nextReels);
									setSelectedId(nextReels[0]?.id ?? null);
								}}
								onSaved={(nextReels, savedReel) => {
									setReels(nextReels);
									setSelectedId(savedReel?.id ?? nextReels[0]?.id ?? null);
								}}
								reel={selectedReel}
							/>
						</div>
					</section>
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
										{userEmail ?? "Kendra admin session"}
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
