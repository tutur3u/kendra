"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ClientStrip } from "./components/client-strip";
import { DemoCard } from "./components/demo-card";
import {
	bodyText,
	cn,
	displayHeading,
	labelText,
	pillButton,
	sectionHeading,
	shell,
} from "./components/ui";
import { Waveform } from "./components/waveform";
import {
	availability,
	bio,
	demos,
	notableClients,
	performanceModes,
	site,
	studioSpecs,
} from "./content";

const sectionGrid = cn(
	shell,
	"grid grid-cols-[minmax(240px,0.4fr)_minmax(0,1.6fr)] gap-[clamp(2rem,8vw,6rem)] py-[clamp(80px,12vw,160px)] max-[920px]:grid-cols-1",
);

type HeroSpec = {
	label: string;
	value: string;
	badge?: {
		alt: string;
		height: number;
		src: string;
		width: number;
	};
	details?: { label: string; value: string }[];
};

const heroSpecs: HeroSpec[] = [
	{
		label: "Certified",
		value: "Source-Connect Standard",
		badge: {
			alt: "Source-Connect Standard badge",
			height: 81,
			src: "/images/source-connect-standard-badge.svg",
			width: 100,
		},
	},
	{
		label: "Mic",
		value: "Neumann TLM 103",
		details: [
			{ label: "Interface", value: "Audient EVO4" },
			{ label: "DAW", value: "Adobe Audition" },
		],
	},
	{ label: "Base", value: "Alberta, Canada" },
];

const fadeInUp = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
	animate: {
		transition: {
			staggerChildren: 0.1
		}
	}
};

export default function Home() {
	return (
		<main className="overflow-hidden bg-white selection:bg-accent selection:text-white">
			{/* Hero Section - Editorial Spread */}
			<section className={cn(shell, "pt-[clamp(40px,8vw,80px)] pb-[clamp(60px,10vw,120px)]")}>
				<div className="grid grid-cols-[1fr_minmax(300px,460px)] gap-12 md:gap-16 max-[920px]:grid-cols-1">
					<motion.div 
						className="flex flex-col justify-end pb-8 max-[920px]:order-2"
						variants={staggerContainer}
						initial="initial"
						animate="animate"
					>
						<motion.h1
							variants={fadeInUp}
							className={cn(
								displayHeading,
								"tracking-[-0.04em]",
							)}
						>
							{site.name}
						</motion.h1>
						<div className="mt-8 flex flex-col gap-6">
							<motion.p variants={fadeInUp} className="max-w-[540px] text-[clamp(1.1rem,2vw,1.6rem)] font-light leading-tight tracking-tight text-ink">
								{site.tagline}
							</motion.p>
							<motion.p variants={fadeInUp} className={cn(bodyText, "max-w-[480px]")}>
								A flexible voice for commercials, animation, ADR, video games,
								narration, and remote sessions from a Source-Connect Standard
								equipped home studio.
							</motion.p>
							<motion.div variants={fadeInUp} className="mt-8 flex flex-wrap gap-4 max-[480px]:flex-col">
								<Link
									href="#demos"
									className={cn(pillButton, "bg-ink text-white max-[480px]:w-full")}
								>
									Listen to reels
								</Link>
								<Link
									href="/contact"
									className={cn(pillButton, "bg-transparent text-ink max-[480px]:w-full")}
								>
									Book a session
								</Link>
							</motion.div>
						</div>
					</motion.div>

					<motion.div
						className="relative aspect-[4/5] overflow-hidden border border-line bg-[#fff6ed] max-[920px]:order-1 max-[920px]:aspect-[1/1.1] max-[620px]:aspect-[4/5]"
						initial={{ opacity: 0, scale: 1.05 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
					>
						<div className="absolute inset-0 bg-[linear-gradient(135deg,#fff6ed_0%,#f8fbf4_48%,#f6eef0_100%)]" />
						<div className="absolute inset-x-8 top-8 h-px bg-ink/10" />
						<div className="absolute inset-y-8 left-8 w-px bg-ink/10" />
						<Image
							src={site.heroImage}
							alt={site.heroImageAlt}
							fill
							priority
							sizes="(max-width: 920px) calc(100vw - 32px), 460px"
							className="object-contain object-bottom p-[clamp(1.25rem,3vw,2.75rem)] drop-shadow-[0_22px_34px_rgba(10,10,10,0.18)] transition-all duration-700 hover:scale-[1.025]"
						/>
						<motion.div 
							className="absolute bottom-4 left-4 right-4 flex items-end justify-between border border-white/70 bg-white/80 px-4 py-3 text-ink shadow-[0_18px_44px_rgba(10,10,10,0.12)] backdrop-blur max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-3"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.6, duration: 0.8 }}
						>
							<div className="grid gap-1">
								<span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-accent">Location</span>
								<span className="text-sm font-medium tracking-wide">Alberta, Canada</span>
							</div>
							<div className="grid gap-1 text-right max-[520px]:text-left">
								<span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-accent">Status</span>
								<span className="flex items-center gap-2 text-sm font-medium tracking-wide">
									<span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
									Now Booking
								</span>
							</div>
						</motion.div>
					</motion.div>
				</div>

				<motion.div 
					className="mt-12 md:mt-16 grid grid-cols-3 border-t border-line pt-8 max-[620px]:grid-cols-1 max-[620px]:gap-6"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8, duration: 1 }}
				>
					{heroSpecs.map((spec) => (
						<div key={spec.label} className="grid gap-1">
							<span className={labelText}>{spec.label}</span>
							<span className="text-sm font-medium text-ink">{spec.value}</span>
							{spec.badge ? (
								<Image
									src={spec.badge.src}
									alt={spec.badge.alt}
									width={spec.badge.width}
									height={spec.badge.height}
									className="mt-2 h-auto w-[100px]"
								/>
							) : null}
							{spec.details ? (
								<div className="mt-3 grid gap-3">
									{spec.details.map((detail) => (
										<div key={detail.label} className="grid gap-1">
											<span className={labelText}>{detail.label}</span>
											<span className="text-sm font-medium text-ink">{detail.value}</span>
										</div>
									))}
								</div>
							) : null}
						</div>
					))}
				</motion.div>
			</section>

			<motion.div 
				className="border-y border-line py-8"
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				viewport={{ once: true, margin: "-100px" }}
				transition={{ duration: 1 }}
			>
				<ClientStrip />
			</motion.div>

			{/* Demos Section */}
			<section id="demos" className={sectionGrid}>
				<motion.div 
					className="sticky top-[100px] self-start max-[920px]:static mb-8 md:mb-0"
					initial={{ opacity: 0, x: -20 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8 }}
				>
					<span className={labelText}>Reels & Demos</span>
					<h2 className={cn(sectionHeading, "mt-4 italic")}>Audio Proof</h2>
					<p className={cn(bodyText, "mt-4 md:mt-6 max-w-[280px]")}>
						A curated selection of performance samples across commercial and narrative categories.
					</p>
				</motion.div>
				<motion.div 
					className="grid gap-px bg-line border border-line"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					{demos.map((demo, index) => (
						<DemoCard key={demo.title} demo={demo} featured={index === 0} />
					))}
				</motion.div>
			</section>

			{/* About Section */}
			<section className="bg-surface">
				<div className={sectionGrid}>
					<motion.div 
						className="sticky top-[100px] self-start max-[920px]:static mb-8 md:mb-0"
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.8 }}
					>
						<span className={labelText}>The Artist</span>
						<h2 className={cn(sectionHeading, "mt-4 italic")}>About</h2>
					</motion.div>
					<motion.div 
						className="grid gap-6 md:gap-8"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						{bio.map((paragraph, index) => (
							<p
								key={index}
								className={cn(bodyText, "max-w-[720px] text-[clamp(1.1rem,1.8vw,1.4rem)] leading-relaxed")}
							>
								{paragraph}
							</p>
						))}
						<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-line pt-12">
							<div>
								<span className={labelText}>Performance Modes</span>
								<ul className="mt-6 flex flex-wrap gap-x-4 md:gap-x-8 gap-y-4">
									{performanceModes.map((mode) => (
										<li key={mode} className="text-[0.8rem] md:text-sm font-medium tracking-tight text-ink-soft">
											— {mode}
										</li>
									))}
								</ul>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Home Studio Section */}
			<section className={cn(shell, "py-[clamp(80px,12vw,160px)]")}>
				<div className="grid grid-cols-[1fr_minmax(0,1.2fr)] gap-16 items-start max-[920px]:grid-cols-1">
					<motion.div 
						className="grid gap-8"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.8 }}
					>
						<div>
							<span className={labelText}>Workflow</span>
							<h2 className={cn(sectionHeading, "mt-4 italic")}>Home Studio</h2>
						</div>
						<p className={cn(bodyText, "max-w-[440px]")}>
							Broadcast remotely or book Alberta-based studio work with a professional recording setup.
						</p>
						<div className="flex flex-wrap items-center gap-4">
							<Image
								src="/images/source-connect-standard-badge.svg"
								alt="Source-Connect Standard badge"
								width={130}
								height={105}
								className="h-auto w-[130px]"
							/>
							<p className="max-w-[230px] text-sm font-medium leading-relaxed text-ink-soft">
								Source-Connect Standard equipped for certified remote sessions.
							</p>
						</div>
						<Link
							href="/home-studio"
							className={cn(pillButton, "w-fit")}
						>
							View Technical Specs
						</Link>
					</motion.div>
					<motion.dl 
						className="grid grid-cols-2 gap-x-12 gap-y-12 border-l border-line pl-12 max-[620px]:grid-cols-1 max-[620px]:pl-0 max-[620px]:border-l-0 max-[620px]:border-t max-[620px]:pt-12"
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						{studioSpecs.slice(0, 5).map((spec) => (
							<div key={spec.label} className="grid gap-2">
								<dt className={labelText}>{spec.label}</dt>
								<dd className="text-lg font-light tracking-tight text-ink">{spec.value}</dd>
							</div>
						))}
					</motion.dl>
				</div>
			</section>
		</main>
	);
}
