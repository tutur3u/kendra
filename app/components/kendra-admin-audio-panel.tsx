"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { KendraAdminReel } from "@/lib/kendra-admin-reel-model";
import { adminFetch } from "./kendra-admin-session-client";
import { KendraAdminReelForm } from "./kendra-admin-reel-form";
import { ReelList } from "./kendra-admin-reel-panels";

type ReelMutationResponse = {
	error?: string;
	errors?: Record<string, string>;
	reel?: KendraAdminReel | null;
	reels?: KendraAdminReel[];
};

function readPayloadError(payload: ReelMutationResponse, fallback: string) {
	return payload.error ?? Object.values(payload.errors ?? {})[0] ?? fallback;
}

export function KendraAdminAudioPanel({
	initialReels,
}: {
	initialReels: KendraAdminReel[];
}) {
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

	const requestDeleteReel = (reel: KendraAdminReel) => {
		setDeleteTargetId(reel.id);
		setSelectedId(reel.id);
	};

	const deleteReel = async (reel: KendraAdminReel) => {
		setDeletingId(reel.id);

		try {
			const response = await adminFetch(
				`/api/admin/reels/${encodeURIComponent(reel.id)}`,
				{ method: "DELETE" },
			);
			const payload = (await response
				.json()
				.catch(() => ({}))) as ReelMutationResponse;

			if (!response.ok) {
				toast.error(
					readPayloadError(payload, "We could not delete this reel."),
				);
				return;
			}

			const nextReels =
				payload.reels ?? reels.filter((item) => item.id !== reel.id);
			setReels(nextReels);
			setSelectedId((current) =>
				current && current !== reel.id
					? current
					: (nextReels[0]?.id ?? null),
			);
			setDeleteTargetId(null);
			toast.success("Deleted reel.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "We could not delete this reel.",
			);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<section className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
			<ReelList
				deletingId={deletingId}
				deleteTargetId={deleteTargetId}
				onNew={() => {
					setSelectedId(null);
					setDeleteTargetId(null);
				}}
				onRequestDelete={requestDeleteReel}
				onSelect={(id) => {
					setSelectedId(id);
					setDeleteTargetId(null);
				}}
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
						deletePending={
							selectedReel ? deletingId === selectedReel.id : false
						}
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
	);
}
