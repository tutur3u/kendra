import { AudioLines, ExternalLink, LayoutDashboard, Plus } from "lucide-react";
import { cn, labelText, shell } from "./ui";

function SkeletonBlock({ className = "" }: { className?: string }) {
	return (
		<span
			aria-hidden="true"
			className={cn("block bg-line/65 motion-safe:animate-pulse", className)}
		/>
	);
}

export function KendraAdminLoadingPanel() {
	return (
		<main
			aria-busy="true"
			aria-label="Loading Kendra Studio"
			className="min-h-screen bg-surface"
		>
			<section className={cn(shell, "grid gap-8 py-[clamp(32px,6vw,72px)]")}>
				<header className="grid gap-5 border border-line bg-white p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
					<div className="min-w-0">
						<span className={cn(labelText, "inline-flex items-center gap-2")}>
							<LayoutDashboard aria-hidden="true" className="size-4" />
							Kendra Studio
						</span>
						<SkeletonBlock className="mt-3 h-10 w-full max-w-md sm:h-12" />
						<SkeletonBlock className="mt-4 h-4 w-full max-w-2xl" />
						<SkeletonBlock className="mt-2 h-4 w-3/5 max-w-md" />
					</div>
					<div className="flex min-h-11 w-full items-center justify-center gap-2 border border-line bg-white px-5 text-ink-soft text-sm font-bold uppercase tracking-[0.1em] lg:w-auto">
						<ExternalLink aria-hidden="true" className="size-4" />
						View website
					</div>
				</header>

				<div className="flex gap-2 overflow-hidden border-b border-line pb-3">
					{Array.from({ length: 6 }, (_, index) => (
						<SkeletonBlock className="h-11 w-28 shrink-0" key={index} />
					))}
				</div>

				<section className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
					<div className="grid content-start gap-4 border border-line bg-white p-5">
						<div className="flex items-end justify-between gap-4">
							<div>
								<span
									className={cn(labelText, "inline-flex items-center gap-2")}
								>
									<AudioLines aria-hidden="true" className="size-4" />
									Audio library
								</span>
								<SkeletonBlock className="mt-3 h-8 w-40" />
							</div>
							<span className="grid size-11 place-items-center border border-line text-ink-soft">
								<Plus aria-hidden="true" className="size-4" />
							</span>
						</div>
						{Array.from({ length: 4 }, (_, index) => (
							<article
								className="grid gap-3 border border-line p-4"
								key={index}
							>
								<SkeletonBlock className="h-5 w-4/5" />
								<SkeletonBlock className="h-4 w-2/3" />
								<div className="flex gap-2">
									<SkeletonBlock className="h-6 w-16" />
									<SkeletonBlock className="h-6 w-20" />
								</div>
							</article>
						))}
					</div>

					<div className="grid content-start gap-5 border border-line bg-white p-5 sm:p-6">
						<div className="flex items-center justify-between gap-4 border-b border-line pb-5">
							<div className="min-w-0 flex-1">
								<SkeletonBlock className="h-8 w-3/5 max-w-xs" />
								<SkeletonBlock className="mt-2 h-4 w-2/5" />
							</div>
							<SkeletonBlock className="size-10" />
						</div>
						<div className="grid gap-5 sm:grid-cols-2">
							{Array.from({ length: 4 }, (_, index) => (
								<div className={index > 1 ? "sm:col-span-2" : ""} key={index}>
									<SkeletonBlock className="h-4 w-24" />
									<SkeletonBlock className="mt-2 h-12 w-full" />
								</div>
							))}
						</div>
						<SkeletonBlock className="h-32 w-full" />
						<div className="flex justify-end gap-3">
							<SkeletonBlock className="h-11 w-28" />
							<SkeletonBlock className="h-11 w-32 bg-ink/20" />
						</div>
					</div>
				</section>

				<p className="sr-only" role="status">
					Loading your audio library and editing tools.
				</p>
			</section>
		</main>
	);
}

export function KendraAdminSectionLoadingPanel() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading dashboard section"
			className="grid min-w-0 gap-5"
		>
			<div className="flex items-end justify-between gap-4 border border-line bg-white p-5 sm:p-6">
				<div className="min-w-0 flex-1">
					<SkeletonBlock className="h-4 w-24" />
					<SkeletonBlock className="mt-3 h-8 w-full max-w-xs" />
					<SkeletonBlock className="mt-3 h-4 w-full max-w-lg" />
				</div>
				<SkeletonBlock className="size-11 shrink-0" />
			</div>

			<div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
				<div className="grid content-start gap-3 border border-line bg-white p-5">
					{Array.from({ length: 4 }, (_, index) => (
						<div className="grid gap-3 border border-line p-4" key={index}>
							<SkeletonBlock className="h-5 w-4/5" />
							<SkeletonBlock className="h-4 w-2/3" />
						</div>
					))}
				</div>
				<div className="grid content-start gap-5 border border-line bg-white p-5 sm:p-6">
					<SkeletonBlock className="h-8 w-2/5" />
					<SkeletonBlock className="h-12 w-full" />
					<SkeletonBlock className="h-12 w-full" />
					<SkeletonBlock className="h-28 w-full" />
				</div>
			</div>

			<p className="sr-only" role="status">
				Loading this dashboard section. Navigation remains available.
			</p>
		</section>
	);
}
