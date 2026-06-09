"use client";

import { useState } from "react";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import type { KendraStorageAnalyticsState } from "@/lib/kendra-storage-analytics";
import { KendraAdminReelForm } from "./kendra-admin-reel-form";
import { ReelList } from "./kendra-admin-reel-panels";
import { cn, labelText, shell } from "./ui";

type AdminTab = "audio" | "account" | "storage";
type ReadyStorageAnalytics = Extract<KendraStorageAnalyticsState, { status: "ready" }>;

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
	const initials = parts.map((part) => part[0]).join("").slice(0, 2);
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
		value >= 10 || exponent === 0 ? Math.round(value).toString() : value.toFixed(1);

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
			<strong className="mt-3 block text-3xl font-semibold text-ink">{value}</strong>
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
				<p className="mt-3 text-ink-soft text-sm">No files have been added yet.</p>
			)}
		</div>
	);
}

function StoragePanel({
	storageAnalytics,
}: {
	storageAnalytics: KendraStorageAnalyticsState;
}) {
	if (storageAnalytics.status === "unavailable") {
		return (
			<section className="border border-line bg-white p-6">
				<span className={labelText}>Storage</span>
				<h2 className="mt-3 text-3xl font-semibold text-ink">
					Storage details are unavailable
				</h2>
				<p className="mt-3 max-w-2xl text-ink-soft text-sm">{storageAnalytics.message}</p>
			</section>
		);
	}

	const { data } = storageAnalytics;
	const usagePercentage = Math.max(0, Math.min(100, data.usagePercentage));

	return (
		<section className="grid gap-4 lg:grid-cols-3">
			<div className="border border-line bg-white p-6 lg:col-span-3">
				<span className={labelText}>Storage</span>
				<div className="mt-3 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
					<div>
						<h2 className="text-3xl font-semibold text-ink">File room</h2>
						<p className="mt-2 max-w-2xl text-ink-soft text-sm">
							Track the files connected to this admin account.
						</p>
					</div>
					<strong className="text-4xl font-semibold text-accent">
						{usagePercentage.toFixed(usagePercentage % 1 === 0 ? 0 : 1)}%
					</strong>
				</div>
				<div className="mt-6 h-3 overflow-hidden border border-line bg-surface">
					<div className="h-full bg-accent" style={{ width: `${usagePercentage}%` }} />
				</div>
			</div>
			<StorageMetric
				detail={`${formatBytes(data.totalSize)} of ${formatBytes(data.storageLimit)}`}
				label="Used"
				value={formatBytes(data.totalSize)}
			/>
			<StorageMetric label="Plan limit" value={formatBytes(data.storageLimit)} />
			<StorageMetric label="Files" value={String(data.fileCount)} />
			<StorageFileHighlight file={data.largestFile} label="Largest file" />
			<StorageFileHighlight file={data.smallestFile} label="Smallest file" />
		</section>
	);
}

export function KendraAdminClient({
	initialReels,
	storageAnalytics,
	userEmail,
}: {
	initialReels: KendraAdminReel[];
	storageAnalytics: KendraStorageAnalyticsState;
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

				{activeTab === "storage" ? (
					<StoragePanel storageAnalytics={storageAnalytics} />
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
