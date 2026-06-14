"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	KendraMembersPayload,
	KendraMembersState,
	KendraWorkspaceMember,
} from "@/lib/kendra-members";
import { adminFetch } from "./kendra-admin-session-client";
import { labelText } from "./ui";

function isMembersState(value: unknown): value is KendraMembersState {
	if (!value || typeof value !== "object") return false;

	const payload = value as Record<string, unknown>;
	return payload.status === "ready" || payload.status === "unavailable";
}

function formatJoinedDate(value: string | null) {
	if (!value) return "Date unavailable";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Date unavailable";

	return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function getInitials(member: KendraWorkspaceMember) {
	const source = member.displayName ?? member.email ?? member.id;
	const words = source.split(/[\s._@-]+/).filter(Boolean);
	return (
		words
			.map((word) => word[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() || "KB"
	);
}

function statusLabel(member: KendraWorkspaceMember) {
	if (member.pending) return "Invited";
	if (member.directBoardGuest) return "Guest";
	return member.workspaceMemberType === "GUEST" ? "Guest" : "Joined";
}

function MemberMetric({ label, value }: { label: string; value: number }) {
	return (
		<div className="border border-line bg-surface p-4">
			<span className={labelText}>{label}</span>
			<strong className="mt-2 block text-2xl font-semibold text-ink">
				{value}
			</strong>
		</div>
	);
}

function MemberRow({ member }: { member: KendraWorkspaceMember }) {
	const primary = member.displayName ?? member.email ?? "Unnamed member";
	const secondary = member.email && member.email !== primary ? member.email : member.id;
	const visibleRoles = member.roles.slice(0, 3);
	const overflowRoleCount = Math.max(0, member.roles.length - visibleRoles.length);

	return (
		<li className="grid gap-4 border border-line bg-surface p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
			<div className="flex min-w-0 items-center gap-3">
				<span className="grid size-12 shrink-0 place-items-center border border-line bg-white font-bold text-accent text-sm uppercase">
					{getInitials(member)}
				</span>
				<div className="min-w-0">
					<div className="flex min-w-0 flex-wrap items-center gap-2">
						<strong className="truncate text-ink">{primary}</strong>
						{member.isCreator ? (
							<span className="border border-accent/30 bg-accent/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-accent">
								Creator
							</span>
						) : null}
					</div>
					<span className="mt-1 block truncate text-ink-soft text-sm">
						{secondary} - {formatJoinedDate(member.createdAt)}
					</span>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 md:justify-end">
				<span className="border border-line bg-white px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
					{statusLabel(member)}
				</span>
				{visibleRoles.length > 0 ? (
					visibleRoles.map((role) => (
						<span
							className="border border-line bg-white px-3 py-1 text-ink text-xs"
							key={role.id}
						>
							{role.name}
						</span>
					))
				) : (
					<span className="border border-line bg-white px-3 py-1 text-ink-soft text-xs">
						Default access
					</span>
				)}
				{overflowRoleCount > 0 ? (
					<span className="text-ink-soft text-xs">+{overflowRoleCount}</span>
				) : null}
			</div>
		</li>
	);
}

function MembersLoading() {
	return (
		<div className="grid gap-3" aria-label="Loading workspace members">
			{["one", "two", "three"].map((item) => (
				<div className="border border-line bg-surface p-4" key={item}>
					<div className="h-4 w-1/3 bg-line" />
					<div className="mt-3 h-3 w-2/3 bg-line" />
				</div>
			))}
		</div>
	);
}

export function KendraAdminMembersPanel({
	manageMembersUrl,
}: {
	manageMembersUrl: string;
}) {
	const [state, setState] = useState<KendraMembersState | null>(null);
	const [loading, setLoading] = useState(true);

	const loadMembers = useCallback(async () => {
		setLoading(true);
		try {
			const response = await adminFetch("/api/admin/members", {
				cache: "no-store",
			});
			const payload = (await response.json().catch(() => null)) as unknown;

			if (response.ok && isMembersState(payload)) {
				setState(payload);
				return;
			}

			setState({
				message: "Members are not available right now.",
				status: "unavailable",
			});
		} catch {
			setState({
				message: "Members are not available right now.",
				status: "unavailable",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadMembers();
	}, [loadMembers]);

	const data: KendraMembersPayload | null =
		state?.status === "ready" ? state.data : null;
	const guestCount = useMemo(
		() =>
			data?.items.filter(
				(member) =>
					member.directBoardGuest || member.workspaceMemberType === "GUEST",
			).length ?? 0,
		[data],
	);

	return (
		<section className="grid gap-4">
			<div className="border border-line bg-white p-6">
				<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
					<div>
						<span className={labelText}>Members</span>
						<h2 className="mt-2 text-3xl font-semibold text-ink">
							Workspace access
						</h2>
						<p className="mt-2 max-w-2xl text-ink-soft text-sm">
							View who can access Kendra. Invitations, removals, and role changes
							stay in Tuturuuu workspace settings.
						</p>
					</div>
					<a
						className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-5 font-bold text-white text-xs uppercase tracking-[0.1em] transition hover:bg-accent"
						href={manageMembersUrl}
						rel="noreferrer"
						target="_blank"
					>
						Manage on Tuturuuu
					</a>
				</div>
			</div>

			{data ? (
				<div className="grid gap-3 md:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
					<MemberMetric label="Total" value={data.total} />
					<MemberMetric label="Joined" value={data.joinedCount} />
					<MemberMetric label="Invited" value={data.invitedCount} />
					<MemberMetric label="Guests" value={guestCount} />
				</div>
			) : null}

			<div className="border border-line bg-white p-6">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<span className={labelText}>People</span>
					<button
						className="min-h-10 border border-line bg-white px-4 font-bold text-ink text-xs uppercase tracking-[0.1em] transition hover:border-accent hover:text-accent disabled:opacity-50"
						disabled={loading}
						onClick={() => void loadMembers()}
						type="button"
					>
						Refresh
					</button>
				</div>
				{loading && !state ? <MembersLoading /> : null}
				{state?.status === "unavailable" ? (
					<div className="border border-line bg-surface p-5">
						<p className="text-ink-soft text-sm">{state.message}</p>
						<button
							className="mt-4 min-h-10 border border-ink bg-ink px-4 font-bold text-white text-xs uppercase tracking-[0.1em] transition hover:bg-accent"
							onClick={() => void loadMembers()}
							type="button"
						>
							Retry
						</button>
					</div>
				) : null}
				{data?.items.length ? (
					<ul className="grid gap-3">
						{data.items.map((member) => (
							<MemberRow key={`${member.id}:${member.email ?? ""}`} member={member} />
						))}
					</ul>
				) : data && !loading ? (
					<p className="border border-dashed border-line bg-surface p-6 text-ink-soft text-sm">
						No members are visible from Kendra yet. Manage workspace access from
						Tuturuuu.
					</p>
				) : null}
			</div>
		</section>
	);
}
