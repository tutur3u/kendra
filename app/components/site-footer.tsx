import Link from "next/link";
import { availability, navigation, site } from "../content";
import { bodyText, cn, labelText, pillButton, shell } from "./ui";
import { Waveform } from "./waveform";

const COPYRIGHT_YEAR = "2026";

export function SiteFooter() {
	return (
		<footer className="mt-32 border-t border-line bg-surface py-24">
			<div className={cn(shell)}>
				<div className="grid grid-cols-[1.5fr_1fr_1fr] gap-12 md:gap-16 max-[920px]:grid-cols-1">
					<div className="flex flex-col gap-8 md:gap-10">
						<div className="flex flex-col gap-6">
							<span className={labelText}>Contact</span>
							<p className="font-serif text-[clamp(2.2rem,5vw,4rem)] italic leading-[0.9] text-ink tracking-tight">
								Book a voice that travels.
							</p>
							<p className={cn(bodyText, "max-w-[420px]")}>
								Remote sessions from Alberta, international VO experience, and
								Source-Connect workflows for commercials, games, animation, and narration.
							</p>
						</div>
						<div className="flex flex-wrap gap-4 max-[480px]:flex-col">
							<a
								href={`mailto:${site.email}`}
								className={cn(pillButton, "bg-ink text-white max-[480px]:w-full")}
							>
								Email Kendra
							</a>
							<Link
								href="/contact"
								className={cn(pillButton, "bg-transparent text-ink max-[480px]:w-full")}
							>
								Project details
							</Link>
						</div>
					</div>

					<nav aria-label="Footer navigation" className="flex flex-col gap-6 md:gap-8 border-t border-line pt-12 md:border-t-0 md:pt-0">
						<span className={labelText}>Explore</span>
						<ul className="flex flex-col gap-4">
							{navigation.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-[0.9rem] font-medium tracking-tight text-ink hover:italic hover:text-accent transition-all"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					<div className="flex flex-col gap-8">
						<span className={labelText}>Studio</span>
						<div className="flex flex-col gap-4">
							<strong className="font-serif text-2xl italic leading-none">{site.location}</strong>
							<p className="text-sm font-medium leading-relaxed text-ink-soft">
								{availability[2]}
							</p>
							<a
								href={`mailto:${site.email}`}
								className="mt-4 text-[0.9rem] font-bold text-accent hover:italic underline decoration-accent/30 underline-offset-4"
							>
								{site.email}
							</a>
						</div>
					</div>
				</div>

				<div className="mt-24 flex flex-wrap items-center justify-between gap-8 border-t border-line pt-8">
					<div className="flex items-center gap-4">
						<Waveform className="h-4" />
						<span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft opacity-60">
							{site.name} © {COPYRIGHT_YEAR}
						</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
