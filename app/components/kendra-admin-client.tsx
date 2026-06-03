"use client";

import { useState } from "react";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import { KendraAdminReelForm } from "./kendra-admin-reel-form";
import { ReelList } from "./kendra-admin-reel-panels";
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
	const [reels, setReels] = useState(initialReels);
	const [selectedId, setSelectedId] = useState<string | null>(
		initialReels[0]?.id ?? null,
	);
	const selectedReel = selectedId
		? reels.find((reel) => reel.id === selectedId) ?? null
		: null;

	return (
		<main className="min-h-screen bg-surface">
			<section className={cn(shell, "grid gap-8 py-[clamp(32px,6vw,72px)]")}>
				<header className="border-b border-line pb-6">
					<h1 className="text-3xl font-semibold text-ink">Admin Dashboard</h1>
				</header>

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
