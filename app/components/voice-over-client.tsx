"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { KendraContent, KendraDemo } from "@/lib/kendra-content";
import { AudioReelPlayer, isAudioReel } from "./audio-reels";
import { bodyText, cn, labelText, pillButton, shell } from "./ui";

const fadeInUp = {
	initial: { opacity: 0, y: 18 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

function groupDemos(demos: KendraDemo[]) {
	const groups = new Map<string, KendraDemo[]>();

	for (const demo of demos) {
		const category = demo.category ?? demo.type ?? "Voice reel";
		groups.set(category, [...(groups.get(category) ?? []), demo]);
	}

	return [...groups.entries()];
}

function StatPill({ label, value }: { label: string; value: string }) {
	return (
		<div className="border border-line bg-white px-4 py-3">
			<span className="block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-accent">
				{label}
			</span>
			<strong className="mt-1 block text-sm font-semibold text-ink">
				{value}
			</strong>
		</div>
	);
}

function ReelCard({
	demo,
	featured,
}: {
	demo: KendraDemo;
	featured?: boolean;
}) {
	return (
		<motion.article
			className={cn(
				"grid gap-5 border p-5 md:p-7",
				featured
					? "border-ink bg-ink text-white shadow-[0_28px_80px_rgba(10,10,10,0.18)]"
					: "border-line bg-white",
			)}
			variants={fadeInUp}
		>
			<div className="flex flex-wrap items-center gap-3">
				<span className={cn(labelText, featured ? "text-sun" : "text-accent")}>
					{demo.category ?? demo.type}
				</span>
				{demo.duration ? (
					<span
						className={cn(
							"font-mono text-xs",
							featured ? "text-white/58" : "text-ink-soft",
						)}
					>
						{demo.duration}
					</span>
				) : null}
			</div>

			<div className="grid gap-3">
				<h3 className="text-balance font-serif text-[clamp(2rem,3.6vw,3.5rem)] italic font-normal leading-[0.96] tracking-tight">
					{demo.title}
				</h3>
				{demo.style ? (
					<p
						className={cn(
							"text-sm font-bold uppercase tracking-[0.16em]",
							featured ? "text-white/70" : "text-accent",
						)}
					>
						{demo.style}
					</p>
				) : null}
			</div>

			{demo.description ? (
				<p
					className={cn(
						"max-w-[66ch] text-base font-light leading-relaxed tracking-tight",
						featured ? "text-white/78" : "text-ink-soft",
					)}
				>
					{demo.description}
				</p>
			) : null}

			<AudioReelPlayer featured={featured} reel={demo} />

			{demo.scriptNotes ? (
				<details className="group border-t border-current/15 pt-5">
					<summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.14em]">
						Script notes
					</summary>
					<p
						className={cn(
							"mt-4 whitespace-pre-line text-sm font-light leading-relaxed",
							featured ? "text-white/72" : "text-ink-soft",
						)}
					>
						{demo.scriptNotes}
					</p>
				</details>
			) : null}
		</motion.article>
	);
}

export function VoiceOverClient({ content }: { content: KendraContent }) {
	const demos = content.demos.filter(isAudioReel);
	const primaryDemo = demos.find((demo) => demo.featured) ?? demos[0] ?? null;
	const groupedDemos = groupDemos(demos);

	return (
		<main className="overflow-hidden bg-white">
			<section className={cn(shell, "py-[clamp(56px,8vw,104px)]")}>
				<div className="grid grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] items-center gap-[clamp(2rem,7vw,5.5rem)] max-[980px]:grid-cols-1">
					<motion.div
						className="grid gap-7"
						initial="initial"
						animate="animate"
						variants={{
							animate: {
								transition: { staggerChildren: 0.1 },
							},
						}}
					>
						<motion.span variants={fadeInUp} className={labelText}>
							Voice-over reel room
						</motion.span>
						<motion.h1
							className="text-balance font-serif text-[clamp(3.4rem,7vw,6.6rem)] italic font-normal leading-[0.95] tracking-tight text-ink"
							variants={fadeInUp}
						>
							Listen closely. Book clearly.
						</motion.h1>
						<motion.p
							className="max-w-[600px] text-[clamp(1.08rem,1.8vw,1.38rem)] font-light leading-snug tracking-tight text-ink-soft"
							variants={fadeInUp}
						>
							{content.site.tagline} from {content.site.location}. Browse the
							full reel library, download session-ready audio, and send booking
							details from the same page.
						</motion.p>
						<motion.div
							className="grid grid-cols-3 gap-3 max-[620px]:grid-cols-1"
							variants={fadeInUp}
						>
							<StatPill label="Reels" value={String(demos.length)} />
							<StatPill label="Categories" value={String(groupedDemos.length)} />
							<StatPill label="Location" value={content.site.location} />
						</motion.div>
						<motion.div
							className="flex flex-wrap gap-4 max-[520px]:flex-col"
							variants={fadeInUp}
						>
							<a
								className={cn(pillButton, "bg-ink text-white max-[520px]:w-full")}
								href={`mailto:${content.site.email}`}
							>
								Book Kendra
							</a>
							<Link
								className={cn(pillButton, "bg-transparent text-ink max-[520px]:w-full")}
								href="#reels"
							>
								Browse reels
							</Link>
						</motion.div>
					</motion.div>

					{primaryDemo ? <ReelCard demo={primaryDemo} featured /> : null}
				</div>
			</section>

			<section className="border-y border-line bg-surface" id="reels">
				<div className={cn(shell, "py-[clamp(64px,10vw,128px)]")}>
					<div className="grid grid-cols-[minmax(220px,0.42fr)_minmax(0,1.58fr)] gap-12 max-[920px]:grid-cols-1">
						<aside className="grid content-start gap-5">
							<span className={labelText}>Full reel library</span>
							<h2 className="text-balance font-serif text-[clamp(2.8rem,6vw,5.6rem)] italic font-normal leading-[0.94] tracking-tight text-ink">
								Audio by category
							</h2>
							<p className={cn(bodyText, "max-w-[360px]")}>
								Every published reel from the Kendra admin library appears here.
								Use the category headers to scan by read type.
							</p>
						</aside>
						<motion.div
							className="grid gap-10"
							initial="initial"
							whileInView="animate"
							viewport={{ once: true, margin: "-120px" }}
							variants={{
								animate: { transition: { staggerChildren: 0.08 } },
							}}
						>
							{groupedDemos.length > 0 ? (
								groupedDemos.map(([category, categoryDemos]) => (
									<section className="grid gap-4" key={category}>
										<div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
											<h3 className={cn(labelText, "text-ink-soft")}>{category}</h3>
											<span className="font-mono text-xs text-ink-soft">
												{categoryDemos.length} reel
												{categoryDemos.length === 1 ? "" : "s"}
											</span>
										</div>
										<div className="grid gap-4">
											{categoryDemos.map((demo) => (
												<ReelCard demo={demo} key={demo.title} />
											))}
										</div>
									</section>
								))
							) : (
								<p className={bodyText}>
									Published reels can be managed through the Kendra admin dashboard.
								</p>
							)}
						</motion.div>
					</div>
				</div>
			</section>

			<section className={cn(shell, "py-[clamp(72px,11vw,144px)]")}>
				<div className="grid grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)] gap-14 max-[920px]:grid-cols-1">
					<div className="grid content-start gap-6">
						<span className={labelText}>Studio capability</span>
						<h2 className="text-balance font-serif text-[clamp(2.8rem,6vw,5.6rem)] italic font-normal leading-[0.94] tracking-tight text-ink">
							Remote-ready from Alberta
						</h2>
						<p className={cn(bodyText, "max-w-[540px]")}>
							{content.contactIntro}{" "}
							<a
								className="font-bold italic text-accent underline decoration-accent/30 underline-offset-4"
								href={content.site.gvaaUrl}
								rel="noreferrer"
								target="_blank"
							>
								GVAA Rate Guide
							</a>
						</p>
					</div>
					<div className="grid gap-10">
						<div className="grid grid-cols-2 gap-px border border-line bg-line max-[620px]:grid-cols-1">
							{content.studioSpecs.map((spec) => (
								<div className="grid gap-4 bg-white p-6" key={spec.label}>
									<span className={labelText}>{spec.label}</span>
									<strong className="font-serif text-2xl italic font-normal leading-tight text-ink">
										{spec.value}
									</strong>
								</div>
							))}
						</div>
						<ul className="grid gap-4 border-t border-line pt-8">
							{content.availability.map((item) => (
								<li
									className="text-[clamp(1rem,1.8vw,1.35rem)] font-light leading-relaxed tracking-tight text-ink-soft"
									key={item}
								>
									- {item}
								</li>
							))}
						</ul>
						<a
							className={cn(pillButton, "w-fit bg-ink text-white max-[520px]:w-full")}
							href={`mailto:${content.site.email}`}
						>
							Send booking details
						</a>
					</div>
				</div>
			</section>
		</main>
	);
}
