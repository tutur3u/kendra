"use client";

import { motion } from "framer-motion";
import type { KendraContent } from "@/lib/kendra-content";
import { ContactForm } from "./contact-form";
import { PageHero } from "./page-hero";
import {
	bodyText,
	cn,
	labelText,
	shell,
} from "./ui";

const fadeInUp = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

export function ContactClient({ content }: { content: KendraContent }) {
	const { availability, contactIntro, site } = content;

	return (
		<main className="bg-white">
			<PageHero
				title="Let's connect"
				description="Send details about your project, session needs, usage, timeline, and budget notes. The form opens a prepared email draft."
			>
				<motion.div variants={fadeInUp} initial="initial" animate="animate">
					<a
						className="text-[1.2rem] font-bold italic tracking-tight underline decoration-accent/30 underline-offset-8 transition-all hover:text-accent"
						href={`mailto:${site.email}`}
					>
						{site.email}
					</a>
				</motion.div>
			</PageHero>

			<section
				className={cn(
					shell,
					"grid grid-cols-[minmax(260px,0.5fr)_minmax(0,1.5fr)] gap-16 py-[clamp(80px,12vw,150px)] max-[920px]:grid-cols-1",
				)}
			>
				<motion.div
					className="flex flex-col gap-10"
					initial={{ opacity: 0, x: -20 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8 }}
				>
					<div className="flex flex-col gap-6">
						<span className={labelText}>Rates & Booking</span>
						<h2 className="font-serif text-[clamp(2.5rem,4vw,3.5rem)] italic leading-[0.9] text-ink tracking-tight">
							Process
						</h2>
						<p className={cn(bodyText)}>
							{contactIntro}{" "}
							<a
								href={site.gvaaUrl}
								target="_blank"
								rel="noreferrer"
								className="font-bold text-accent italic underline decoration-accent/30 underline-offset-4 transition-all hover:text-accent"
							>
								GVAA Rate Guide
							</a>
						</p>
					</div>
					<ul className="flex flex-col gap-4 border-t border-line pt-10">
						{availability.map((item) => (
							<li
								key={item}
								className="text-sm font-medium tracking-tight text-ink-soft"
							>
								- {item}
							</li>
						))}
					</ul>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					<ContactForm />
				</motion.div>
			</section>
		</main>
	);
}
