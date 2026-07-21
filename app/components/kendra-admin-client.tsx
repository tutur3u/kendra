"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
	AudioLines,
	CircleUserRound,
	ExternalLink,
	FileText,
	Globe2,
	HardDrive,
	ListTodo,
	LoaderCircle,
	LogOut,
	Users,
	type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import {
	adminFetch,
	scheduleKendraAdminSessionRefresh,
} from "./kendra-admin-session-client";
import {
	clearKendraAdminSessionHint,
	writeKendraAdminSessionHint,
	writeKendraAdminSessionRefreshHint,
} from "./kendra-admin-session-hint";
import { KendraAdminReelForm } from "./kendra-admin-reel-form";
import { ReelList } from "./kendra-admin-reel-panels";
import { cn, labelText, shell } from "./ui";

type AdminTab = "audio" | "account" | "members" | "pages" | "storage";
type ReelMutationResponse = {
	error?: string;
	errors?: Record<string, string>;
	reel?: KendraAdminReel | null;
	reels?: KendraAdminReel[];
};

const tabs: Array<{ icon: LucideIcon; id: AdminTab; label: string }> = [
	{ icon: AudioLines, id: "audio", label: "Audio library" },
	{ icon: FileText, id: "pages", label: "Website pages" },
	{ icon: HardDrive, id: "storage", label: "Storage" },
	{ icon: Users, id: "members", label: "Members" },
	{ icon: CircleUserRound, id: "account", label: "Account" },
];

function AdminTabLoading({
	label,
	text,
}: {
	label: string;
	text: string;
}) {
	return (
		<section className="border border-line bg-white p-6">
			<span className={labelText}>{label}</span>
			<div className="mt-4 flex items-center gap-3 text-ink-soft text-sm">
				<LoaderCircle
					aria-hidden="true"
					className="size-5 animate-[slow-spin_700ms_linear_infinite] text-accent"
				/>
				<span>{text}</span>
			</div>
		</section>
	);
}

const LazyPagesPanel = dynamic(
	() =>
		import("./kendra-admin-pages-panel").then(
			(module) => module.KendraAdminPagesPanel,
		),
	{
		loading: () => (
			<AdminTabLoading label="Pages" text="Loading page editor..." />
		),
	},
);

const LazyStoragePanel = dynamic(
	() =>
		import("./kendra-admin-storage-panel").then(
			(module) => module.KendraAdminStoragePanel,
		),
	{
		loading: () => (
			<AdminTabLoading label="Storage" text="Loading storage details..." />
		),
	},
);

const LazyMembersPanel = dynamic(
	() =>
		import("./kendra-admin-members-panel").then(
			(module) => module.KendraAdminMembersPanel,
		),
	{
		loading: () => (
			<AdminTabLoading label="Members" text="Loading workspace members..." />
		),
	},
);

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

function readPayloadError(payload: ReelMutationResponse, fallback: string) {
	return payload.error ?? Object.values(payload.errors ?? {})[0] ?? fallback;
}

export function KendraAdminClient({
	initialReels,
	sessionExpiresAt,
	sessionRefreshEarlySeconds,
	tuturuuuDrivePathPrefix,
	tuturuuuDriveUrl,
	tuturuuuMembersUrl,
	tuturuuuTasksUrl,
	userEmail,
}: {
	initialReels: KendraAdminReel[];
	sessionExpiresAt: string;
	sessionRefreshEarlySeconds?: number;
	tuturuuuDrivePathPrefix: string;
	tuturuuuDriveUrl: string;
	tuturuuuMembersUrl: string;
	tuturuuuTasksUrl: string;
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

	useEffect(() => {
		writeKendraAdminSessionHint({
			email: userEmail,
			expiresAt: sessionExpiresAt,
			refreshEarlySeconds: sessionRefreshEarlySeconds ?? null,
		});

		return scheduleKendraAdminSessionRefresh({
			expiresAt: sessionExpiresAt,
			onRefresh: (payload) =>
				writeKendraAdminSessionRefreshHint({
					fallbackEmail: userEmail,
					payload,
				}),
			onRefreshFailed: clearKendraAdminSessionHint,
			refreshEarlySeconds: sessionRefreshEarlySeconds,
		});
	}, [sessionExpiresAt, sessionRefreshEarlySeconds, userEmail]);

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
				<header className="grid gap-5 border border-line bg-white p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
					<div className="min-w-0">
						<span className={labelText}>Kendra Studio</span>
						<h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
							Content dashboard
						</h1>
						<p className="mt-3 max-w-2xl text-ink-soft text-sm leading-6">
							Manage voice reels, website copy, media, and collaborators without leaving the studio.
						</p>
					</div>
					<Link
						className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white px-5 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent"
						href="/"
					>
						<Globe2 aria-hidden="true" className="size-4" />
						View website
					</Link>
				</header>

				<nav
					className="flex gap-2 overflow-x-auto border-b border-line pb-3"
					aria-label="Admin sections"
				>
					{tabs.map((tab) => {
						const Icon = tab.icon;

						return (
						<button
							className={cn(
								"inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 text-sm font-bold uppercase tracking-[0.12em] transition",
								activeTab === tab.id
									? "border-accent text-accent"
									: "border-transparent text-ink-soft hover:text-ink",
							)}
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							type="button"
						>
							<Icon aria-hidden="true" className="size-4" />
							{tab.label}
						</button>
						);
					})}
					<a
						className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-accent/35 bg-accent/5 px-4 text-sm font-bold uppercase tracking-[0.12em] text-accent transition hover:border-accent"
						href={tuturuuuTasksUrl}
						rel="noreferrer"
						target="_blank"
					>
						<ListTodo aria-hidden="true" className="size-4" />
						Tasks
						<ExternalLink aria-hidden="true" className="size-3.5" />
					</a>
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

				{activeTab === "pages" ? <LazyPagesPanel /> : null}

				{activeTab === "storage" ? (
					<LazyStoragePanel
						onResourcesChanged={refreshReels}
						tuturuuuDrivePathPrefix={tuturuuuDrivePathPrefix}
						tuturuuuDriveUrl={tuturuuuDriveUrl}
					/>
				) : null}

				{activeTab === "members" ? (
					<LazyMembersPanel manageMembersUrl={tuturuuuMembersUrl} />
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
								className="inline-flex min-h-11 items-center justify-center gap-2 border border-ink bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent"
								href="/voice-over#reels"
							>
								<ExternalLink aria-hidden="true" className="size-4" />
								View public reels
							</a>
							<a
								className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent"
								href="/admin/logout"
								onClick={clearKendraAdminSessionHint}
							>
								<LogOut aria-hidden="true" className="size-4" />
								Sign out
							</a>
						</div>
					</section>
				) : null}
			</section>
		</main>
	);
}
