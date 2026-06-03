"use client";

import type {
	KendraAdminReel,
	KendraAdminReelStatus,
} from "@/lib/kendra-admin-reel-model";
import { cn, labelText } from "./ui";

export function formatStatus(value: KendraAdminReelStatus) {
	return value
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function statusClass(value: KendraAdminReelStatus) {
	if (value === "published") return "border-green/25 bg-green/10 text-green-deep";
	if (value === "draft") return "border-sun/35 bg-sun/15 text-ink";
	if (value === "archived") return "border-line bg-mist text-ink-soft";
	return "border-accent/25 bg-accent/10 text-accent";
}

export function countByStatus(reels: KendraAdminReel[], status: KendraAdminReelStatus) {
	return reels.filter((reel) => reel.status === status).length;
}

export function StatTile({ label, value }: { label: string; value: number | string }) {
	return (
		<div className="border border-line bg-white p-5">
			<span className={labelText}>{label}</span>
			<strong className="mt-4 block font-serif text-5xl font-normal italic leading-none text-ink tabular-nums">
				{value}
			</strong>
		</div>
	);
}

export function ReelList({
	onNew,
	onSelect,
	reels,
	selectedId,
}: {
	onNew: () => void;
	onSelect: (id: string) => void;
	reels: KendraAdminReel[];
	selectedId: string | null;
}) {
	return (
		<aside className="grid content-start gap-3">
			<div className="flex items-center justify-between gap-3">
				<div>
					<span className={labelText}>Library</span>
					<h2 className="mt-2 font-serif text-4xl font-normal italic leading-none text-ink">
						Voice reels
					</h2>
				</div>
				<button
					className={cn(
						"min-h-11 border px-4 text-sm font-bold uppercase tracking-[0.1em] transition",
						selectedId === null
							? "border-ink bg-ink text-white"
							: "border-line bg-white text-ink hover:border-accent hover:text-accent",
					)}
					onClick={onNew}
					type="button"
				>
					New
				</button>
			</div>

			{reels.length > 0 ? (
				<div className="grid gap-2">
					{reels.map((reel) => (
						<button
							className={cn(
								"grid gap-3 border p-4 text-left transition",
								selectedId === reel.id
									? "border-ink bg-white shadow-[0_18px_46px_rgba(10,10,10,0.08)]"
									: "border-line bg-white hover:border-accent",
							)}
							key={reel.id}
							onClick={() => onSelect(reel.id)}
							type="button"
						>
							<div className="flex flex-wrap items-center gap-2">
								<span
									className={cn(
										"border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em]",
										statusClass(reel.status),
									)}
								>
									{formatStatus(reel.status)}
								</span>
								{reel.featured ? (
									<span className="border border-accent/25 bg-accent/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-accent">
										Featured
									</span>
								) : null}
							</div>
							<div>
								<strong className="block text-base text-ink">{reel.title}</strong>
								<span className="mt-1 block text-ink-soft text-sm">
									{reel.category}
									{reel.duration ? ` / ${reel.duration}` : ""}
								</span>
							</div>
							<span className="text-ink-soft text-xs">
								{reel.audioUrl ? "Audio ready" : "Audio missing"}
							</span>
						</button>
					))}
				</div>
			) : (
				<div className="border border-dashed border-line bg-white p-6">
					<h3 className="font-serif text-3xl font-normal italic text-ink">No reels yet.</h3>
					<p className="mt-2 text-sm leading-relaxed text-ink-soft">
						Create the first public reel from the editor.
					</p>
				</div>
			)}
		</aside>
	);
}

export function AudioTab({
	onSelect,
	reels,
}: {
	onSelect: (id: string) => void;
	reels: KendraAdminReel[];
}) {
	return (
		<section className="grid gap-5">
			<div className="grid gap-3 sm:grid-cols-3">
				<StatTile label="Ready" value={reels.filter((reel) => reel.audioUrl).length} />
				<StatTile label="Missing" value={reels.filter((reel) => !reel.audioUrl).length} />
				<StatTile label="Published" value={countByStatus(reels, "published")} />
			</div>

			<div className="overflow-x-auto border border-line bg-white">
				<table className="w-full min-w-[760px] border-collapse text-left text-sm">
					<thead className="border-b border-line bg-surface text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
						<tr>
							<th className="px-4 py-3">Reel</th>
							<th className="px-4 py-3">File</th>
							<th className="px-4 py-3">Duration</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Action</th>
						</tr>
					</thead>
					<tbody>
						{reels.map((reel) => (
							<tr className="border-b border-line last:border-b-0" key={reel.id}>
								<td className="px-4 py-3 font-semibold text-ink">{reel.title}</td>
								<td className="px-4 py-3 text-ink-soft">
									{reel.audioFileName ?? reel.audioStoragePath ?? "Missing"}
								</td>
								<td className="px-4 py-3 text-ink-soft">{reel.duration ?? "-"}</td>
								<td className="px-4 py-3">
									<span
										className={cn(
											"border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em]",
											statusClass(reel.status),
										)}
									>
										{formatStatus(reel.status)}
									</span>
								</td>
								<td className="px-4 py-3">
									<button
										className="font-bold text-accent text-xs uppercase tracking-[0.12em] underline decoration-accent/25 underline-offset-4"
										onClick={() => onSelect(reel.id)}
										type="button"
									>
										Edit audio
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
