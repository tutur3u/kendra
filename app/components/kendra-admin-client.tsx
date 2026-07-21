"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LoaderCircle, LogOut } from "lucide-react";
import { useEffect } from "react";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import type { KendraAdminSection } from "@/lib/kendra-admin-sections";
import { scheduleKendraAdminSessionRefresh } from "./kendra-admin-session-client";
import {
	clearKendraAdminSessionHint,
	writeKendraAdminSessionHint,
	writeKendraAdminSessionRefreshHint,
} from "./kendra-admin-session-hint";
import { labelText } from "./ui";

function AdminTabLoading({ label, text }: { label: string; text: string }) {
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

const LazyAudioPanel = dynamic(
	() =>
		import("./kendra-admin-audio-panel").then(
			(module) => module.KendraAdminAudioPanel,
		),
	{
		loading: () => (
			<AdminTabLoading label="Audio library" text="Loading audio editor..." />
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

export function KendraAdminClient({
	activeSection,
	initialReels,
	sessionExpiresAt,
	sessionRefreshEarlySeconds,
	tuturuuuDrivePathPrefix,
	tuturuuuDriveUrl,
	tuturuuuMembersUrl,
	userEmail,
}: {
	activeSection: KendraAdminSection;
	initialReels: KendraAdminReel[];
	sessionExpiresAt: string;
	sessionRefreshEarlySeconds?: number;
	tuturuuuDrivePathPrefix: string;
	tuturuuuDriveUrl: string;
	tuturuuuMembersUrl: string;
	userEmail: string | null;
}) {
	const router = useRouter();

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

	return (
		<>
			{activeSection === "audio" ? (
				<LazyAudioPanel initialReels={initialReels} />
			) : null}

			{activeSection === "pages" ? <LazyPagesPanel /> : null}

			{activeSection === "storage" ? (
				<LazyStoragePanel
					onResourcesChanged={async () => router.refresh()}
					tuturuuuDrivePathPrefix={tuturuuuDrivePathPrefix}
					tuturuuuDriveUrl={tuturuuuDriveUrl}
				/>
			) : null}

			{activeSection === "members" ? (
				<LazyMembersPanel manageMembersUrl={tuturuuuMembersUrl} />
			) : null}

			{activeSection === "account" ? (
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
						<Link
							className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent"
							href="/admin/logout"
							onClick={clearKendraAdminSessionHint}
						>
							<LogOut aria-hidden="true" className="size-4" />
							Sign out
						</Link>
					</div>
				</section>
			) : null}
		</>
	);
}
