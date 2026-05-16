"use client";

import { motion } from "framer-motion";
import { PageHero } from "../components/page-hero";
import {
	bodyText,
	cn,
	labelText,
	sectionHeading,
	shell,
} from "../components/ui";
import { Waveform } from "../components/waveform";
import { availability, studioSpecs } from "../content";

const fadeInUp = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export default function HomeStudioPage() {
	return (
		<main className="bg-white">
			<PageHero
				title="Home Studio"
				description="A compact, sound-treated home studio for remote VO sessions, live direction, and Source-Connect Standard workflows."
			>
				<motion.span 
					className="text-[1.2rem] font-bold italic tracking-tight text-ink"
					variants={fadeInUp}
					initial="initial"
					animate="animate"
				>
					Source-Connect Standard certified
				</motion.span>
			</PageHero>

			<section
				className={cn(
					shell,
					"grid grid-cols-[minmax(260px,0.4fr)_minmax(0,1.6fr)] gap-16 py-[clamp(80px,12vw,140px)] max-[920px]:grid-cols-1",
				)}
			>
				<motion.div 
					className="sticky top-[140px] self-start flex flex-col gap-8 max-[920px]:static"
					initial={{ opacity: 0, x: -20 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8 }}
				>
					<div className="flex flex-col gap-4">
						<span className={labelText}>Specs</span>
						<h2 className="font-serif text-[clamp(2.5rem,4vw,3.5rem)] italic leading-[0.9] text-ink tracking-tight">
							Technology
						</h2>
					</div>
					<Waveform label="Decorative studio waveform" className="h-10" />
					<p className={cn(bodyText, "max-w-[280px]")}>Clean remote sessions from Alberta, Canada.</p>
				</motion.div>
				<div className="grid grid-cols-2 gap-px bg-line border border-line max-[620px]:grid-cols-1">
					{studioSpecs.map((spec, index) => (
						<motion.article
							key={spec.label}
							className="bg-white p-10 flex flex-col gap-6 transition-all duration-500 hover:bg-surface"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ duration: 0.6, delay: index * 0.1 }}
						>
							<span className={labelText}>{spec.label}</span>
							<h3 className="font-serif text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.1] text-ink italic tracking-tight">
								{spec.value}
							</h3>
						</motion.article>
					))}
				</div>
			</section>

			<section
				className={cn(
					shell,
					"mb-[clamp(80px,12vw,150px)] grid grid-cols-[0.4fr_1.6fr] gap-16 py-24 border-t border-line max-[920px]:grid-cols-1",
				)}
			>
				<motion.div 
					className="flex flex-col gap-4"
					initial={{ opacity: 0, x: -20 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8 }}
				>
					<span className={labelText}>Availability</span>
					<h2 className={cn(sectionHeading, "italic")}>Live Direction</h2>
				</motion.div>
				<motion.ul 
					className="flex flex-col gap-6"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					{availability.map((item) => (
						<li key={item} className="text-[clamp(1.1rem,1.8vw,1.4rem)] font-light tracking-tight text-ink-soft border-b border-line pb-6 last:border-0">
							— {item}
						</li>
					))}
				</motion.ul>
			</section>
		</main>
	);
}
