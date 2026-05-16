import Image from "next/image";
import { clientLogos, notableClients } from "../content";
import { cn, labelText, shell } from "./ui";

const logoDelays = [
	"[animation-delay:0ms]",
	"[animation-delay:80ms]",
	"[animation-delay:160ms]",
	"[animation-delay:240ms]",
	"[animation-delay:320ms]",
];

const logoCard =
	"grid min-h-[110px] place-items-center rounded-2xl border border-white/15 bg-white/10 p-3 text-center font-black transition duration-200 animate-[logo-pop_560ms_ease_both] hover:-translate-y-1 hover:border-white/30 hover:bg-white/15";

export function ClientStrip() {
	return (
		<section
			className={cn(shell)}
			aria-labelledby="client-strip-title"
		>
			<div className="flex flex-col gap-8">
				<div className="flex justify-between items-end max-[620px]:flex-col max-[620px]:items-start max-[620px]:gap-2">
					<h2 id="client-strip-title" className={cn(labelText)}>
						Featured Partnerships
					</h2>
					<p className="text-[0.8rem] font-medium text-ink-soft uppercase tracking-wider">
						Commercial — Corporate — Broadcast
					</p>
				</div>
				<ul className="grid grid-cols-5 gap-4 md:gap-8 items-center justify-items-center opacity-80 md:opacity-60 md:grayscale grayscale-0 transition-all duration-700 hover:opacity-100 hover:grayscale-0 max-[920px]:grid-cols-3 max-[620px]:grid-cols-2">
					{clientLogos.map((client) => (
						<li key={client.name} className="flex items-center justify-center h-10 md:h-12 w-full">
							<Image
								src={client.image}
								alt={`${client.name} logo`}
								width={140}
								height={60}
								className="h-full w-auto object-contain"
							/>
						</li>
					))}
					{notableClients
						.filter((client) => !clientLogos.some((logo) => logo.name === client))
						.slice(0, 5)
						.map((client) => (
							<li
								key={client}
								className="text-sm font-bold uppercase tracking-[0.15em] text-ink-soft text-center"
							>
								{client}
							</li>
						))}
				</ul>
			</div>
		</section>
	);
}
