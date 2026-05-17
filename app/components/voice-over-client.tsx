"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { KendraContent, KendraDemo } from "@/lib/kendra-content";
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

function ReelCard({ demo, featured }: { demo: KendraDemo; featured?: boolean }) {
	const downloadLabel = demo.downloadLabel ?? "Download";

	return (
		<motion.article
			className={cn(
				"grid gap-6 border border-line bg-white p-5 md:p-7",
				featured && "bg-ink text-white",
			)}
			variants={fadeInUp}
		>
			<div className="grid gap-4">
				<div className="flex flex-wrap items-center gap-3">
					<span
						className={cn(
							labelText,
							featured ? "text-sun" : "text-accent",
						)}
					>
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
					<h2 className="font-serif text-[clamp(1.9rem,4vw,3.6rem)] italic font-normal leading-[0.92] tracking-tight">
						{demo.title}
					</h2>
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
			</div>

			<p
				className={cn(
					"text-base font-light leading-relaxed tracking-tight",
					featured ? "text-white/78" : "text-ink-soft",
				)}
			>
				{demo.description}
			</p>

			<audio
				className="h-12 w-full accent-current"
				controls
				preload="metadata"
				src={demo.audioSrc}
			>
				<track kind="captions" />
			</audio>

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

			<a
				className={cn(
					pillButton,
					"w-fit",
					featured ? "border-white text-white hover:bg-white hover:text-ink" : "bg-transparent text-ink",
				)}
				download
				href={demo.audioSrc}
			>
				{downloadLabel}
			</a>
		</motion.article>
	);
}

export function VoiceOverClient({ content }: { content: KendraContent }) {
	const featuredDemos = content.demos.filter((demo) => demo.featured);
	const primaryDemo = featuredDemos[0] ?? content.demos[0] ?? null;
	const remainingDemos = content.demos.filter((demo) => demo !== primaryDemo);
	const groupedDemos = groupDemos(remainingDemos);

	return (
		<main className="overflow-hidden bg-white">
			<section className={cn(shell, "py-[clamp(56px,8vw,112px)]")}>
				<div className="grid min-h-[min(780px,calc(100svh-120px))] grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] items-end gap-12 max-[980px]:min-h-0 max-[980px]:grid-cols-1">
					<motion.div
						className="grid gap-8 pb-8"
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
							className="font-serif text-[clamp(4rem,12vw,11rem)] italic font-normal leading-[0.82] tracking-tight text-ink"
							variants={fadeInUp}
						>
							Listen first. Book fast.
						</motion.h1>
						<motion.p
							className="max-w-[560px] text-[clamp(1.1rem,2vw,1.45rem)] font-light leading-snug tracking-tight text-ink-soft"
							variants={fadeInUp}
						>
							{content.site.tagline} from {content.site.location}. Browse
							categorized demos, download session-ready audio, then send the
							booking details.
						</motion.p>
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
					<div className="grid grid-cols-[minmax(220px,0.4fr)_minmax(0,1.6fr)] gap-12 max-[920px]:grid-cols-1">
						<div className="grid content-start gap-5">
							<span className={labelText}>Reels</span>
							<h2 className="font-serif text-[clamp(2.8rem,7vw,6rem)] italic font-normal leading-[0.9] tracking-tight text-ink">
								Audio by category
							</h2>
						</div>
						<div className="grid gap-10">
							{groupedDemos.length > 0 ? (
								groupedDemos.map(([category, demos]) => (
									<div className="grid gap-4" key={category}>
										<h3 className={cn(labelText, "text-ink-soft")}>{category}</h3>
										<div className="grid gap-px border border-line bg-line">
											{demos.map((demo) => (
												<ReelCard demo={demo} key={demo.title} />
											))}
										</div>
									</div>
								))
							) : primaryDemo ? (
								<p className={bodyText}>
									More categorized reels can be managed through the Kendra CMS.
								</p>
							) : null}
						</div>
					</div>
				</div>
			</section>

			<section className={cn(shell, "py-[clamp(72px,11vw,144px)]")}>
				<div className="grid grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)] gap-14 max-[920px]:grid-cols-1">
					<div className="grid content-start gap-6">
						<span className={labelText}>Studio capability</span>
						<h2 className="font-serif text-[clamp(2.8rem,7vw,6rem)] italic font-normal leading-[0.9] tracking-tight text-ink">
							Remote-ready from Alberta.
						</h2>
						<p className={cn(bodyText, "max-w-[520px]")}>
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
									— {item}
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
