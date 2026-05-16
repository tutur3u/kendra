import { Waveform } from "./waveform";
import { bodyText, cn, displayHeading, shell } from "./ui";

type PageHeroProps = {
	title: string;
	description: string;
	children?: React.ReactNode;
};

export function PageHero({ title, description, children }: PageHeroProps) {
	return (
		<section
			className={cn(
				shell,
				"py-[clamp(80px,12vw,140px)] border-b border-line animate-[rise-in_680ms_ease_both]",
			)}
		>
			<div className="grid grid-cols-[1.2fr_1fr] gap-16 items-end max-[920px]:grid-cols-1 max-[920px]:gap-8">
				<div className="flex flex-col gap-8">
					<h1
						className={cn(
							displayHeading,
							"text-[clamp(4rem,10vw,8rem)] italic tracking-tight",
						)}
					>
						{title}
					</h1>
					<p className={cn(bodyText, "max-w-[540px] text-[clamp(1.1rem,1.8vw,1.4rem)]")}>
						{description}
					</p>
				</div>
				<div className="flex flex-col gap-8 items-start justify-end max-[920px]:items-start">
					<Waveform className="h-8" />
					<div className="flex flex-col gap-4 text-ink">
						{children}
					</div>
				</div>
			</div>
		</section>
	);
}
