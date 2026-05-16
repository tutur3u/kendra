"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CreditList } from "../components/credit-list";
import { PageHero } from "../components/page-hero";
import { cn, shell } from "../components/ui";
import { experienceGroups, site } from "../content";

const fadeInUp = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export default function ExperiencePage() {
	return (
		<main className="bg-white">
			<PageHero
				title="Experience"
				description="Commercial, corporate, character, and training credits from Kendra's voice acting work across Canada, Japan, and remote sessions."
			>
				<motion.div variants={fadeInUp} initial="initial" animate="animate">
					<Link
						className="text-[1.2rem] font-bold italic tracking-tight underline decoration-accent/30 underline-offset-8 transition-all hover:text-accent"
						href={site.resumeUrl}
						target="_blank"
						rel="noreferrer"
					>
						View full resume
					</Link>
				</motion.div>
			</PageHero>
			<section className="bg-ink text-white">
				<div
					className={cn(
						shell,
						"py-[clamp(24px,4vw,56px)]",
					)}
				>
					{experienceGroups.map((group, index) => (
						<motion.div
							key={group.title}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ duration: 0.8, delay: index * 0.1 }}
						>
							<CreditList title={group.title} items={group.items} />
						</motion.div>
					))}
				</div>
			</section>
		</main>
	);
}
