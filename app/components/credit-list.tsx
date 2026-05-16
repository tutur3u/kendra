"use client";

import { useRef } from "react";
import { bodyText, cn, labelText } from "./ui";

type CreditVisual = {
	image?: string;
	imagePosition?: string;
	imageSize?: string;
	label?: string;
	tone?: string;
};

type CreditListProps = {
	title: string;
	items: Array<{
		project: string;
		role: string;
		visual?: CreditVisual;
	}>;
};

const visualToneClasses = {
	animation: "bg-[#fbecd7] text-[#24342d]",
	broadcast: "bg-[#fff4f1] text-[#191919]",
	cardfight: "bg-[#ecf5ff] text-[#0c315f]",
	duality: "bg-[linear-gradient(135deg,#121212_0_49%,#f7f1e7_50%_100%)] text-white",
	institution: "bg-[#e5f0ea] text-[#183929]",
	music: "bg-[#fff0bd] text-[#2e2514]",
	nightmare: "bg-[radial-gradient(circle_at_30%_25%,#4c1d95,#111827_55%,#050505)] text-white",
	otome: "bg-[#fdebf2] text-[#43111f]",
	signal: "bg-[#fff8f6] text-[#5f1515]",
	sky: "bg-[#e7f4fb] text-[#102434]",
	studio: "bg-[#edf1ed] text-[#183226]",
	training: "bg-[#f6eee4] text-[#402817]",
} as const;

function CreditVisualTile({
	project,
	visual,
}: {
	project: string;
	visual?: CreditVisual;
}) {
	const hasImage = Boolean(visual?.image);
	const tone =
		visual?.tone && visual.tone in visualToneClasses
			? (visual.tone as keyof typeof visualToneClasses)
			: "studio";
	const imageStyle = visual?.image
		? {
				backgroundImage: `url("${visual.image}")`,
				backgroundPosition: visual.imagePosition ?? "center",
				backgroundRepeat: "no-repeat",
				backgroundSize: visual.imageSize ?? "cover",
			}
		: undefined;

	return (
		<div
			aria-label={`${project} visual reference`}
			role="img"
			className={cn(
				"relative aspect-[4/3] w-full shrink-0 overflow-hidden border border-white/10 shadow-[0_20px_48px_rgba(0,0,0,0.32)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_rgba(0,0,0,0.42)]",
				visualToneClasses[tone],
			)}
		>
			<div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(255,255,255,0.08)_48%,rgba(10,10,10,0.16))]" />
			{hasImage ? (
				<div className="absolute inset-[clamp(0.75rem,1.6vw,1.15rem)]" style={imageStyle} />
			) : (
				<div className="absolute inset-0 grid place-items-center px-4 text-center">
					<span className="block max-w-full whitespace-nowrap pr-1 font-serif text-[clamp(1rem,1.6vw,1.55rem)] italic leading-none tracking-tight">
						{visual?.label ?? project}
					</span>
				</div>
			)}
		</div>
	);
}

function ArrowIcon({ direction }: { direction: "next" | "previous" }) {
	return (
		<svg
			aria-hidden="true"
			className={cn("h-5 w-5", direction === "previous" && "rotate-180")}
			fill="none"
			stroke="currentColor"
			strokeLinecap="square"
			strokeLinejoin="miter"
			strokeWidth="1.5"
			viewBox="0 0 24 24"
		>
			<path d="M4 12h15" />
			<path d="m13 6 6 6-6 6" />
		</svg>
	);
}

function CarouselButton({
	className,
	direction,
	onClick,
	title,
}: {
	className?: string;
	direction: "next" | "previous";
	onClick: () => void;
	title: string;
}) {
	const label =
		direction === "previous"
			? `Show previous ${title} credits`
			: `Show next ${title} credits`;

	return (
		<button
			aria-label={label}
			className={cn(
				"grid h-12 w-12 shrink-0 place-items-center border border-white/20 bg-white/[0.08] text-white backdrop-blur transition duration-300 hover:border-white/45 hover:bg-white/15 focus-visible:outline-[1px] focus-visible:outline-offset-4 focus-visible:outline-white",
				className,
			)}
			onClick={onClick}
			type="button"
		>
			<ArrowIcon direction={direction} />
		</button>
	);
}

export function CreditList({ title, items }: CreditListProps) {
	const carouselRef = useRef<HTMLUListElement>(null);

	const scrollCredits = (direction: -1 | 1) => {
		const carousel = carouselRef.current;

		if (!carousel) return;

		carousel.scrollBy({
			behavior: "smooth",
			left: carousel.clientWidth * 0.82 * direction,
		});
	};

	return (
		<section className="border-b border-white/10 py-[clamp(3.5rem,8vw,6.5rem)] last:border-0">
			<div className="mb-[clamp(2rem,5vw,4rem)] flex items-end justify-between gap-8 max-[820px]:items-start">
				<div className="min-w-0">
					<span className={cn(labelText, "text-accent")}>Notable Clients</span>
					<h2 className="mt-4 max-w-[760px] text-balance font-serif text-[clamp(3.15rem,8vw,7rem)] italic leading-[0.82] tracking-tight text-white">
						{title}
					</h2>
				</div>
				<div className="hidden gap-3 max-[820px]:flex">
					<CarouselButton
						direction="previous"
						onClick={() => scrollCredits(-1)}
						title={title}
					/>
					<CarouselButton
						direction="next"
						onClick={() => scrollCredits(1)}
						title={title}
					/>
				</div>
			</div>

			<div className="relative">
				<CarouselButton
					className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 max-[820px]:hidden"
					direction="previous"
					onClick={() => scrollCredits(-1)}
					title={title}
				/>
				<ul
					ref={carouselRef}
					className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 pr-8"
				>
					{items.map((item, index) => (
						<li
							key={`${item.project}-${item.role}`}
							className="snap-start"
						>
							<article className="group flex h-full w-[min(76vw,300px)] flex-col border border-white/12 bg-white/[0.045] p-4 transition duration-500 hover:-translate-y-2 hover:border-white/28 hover:bg-white/[0.075]">
								<CreditVisualTile project={item.project} visual={item.visual} />
								<div className="mt-6 grid flex-1 gap-6">
									<div className="grid gap-3">
										<span className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-white/36">
											{String(index + 1).padStart(2, "0")}
										</span>
										<strong className="text-[clamp(1.45rem,2.2vw,2rem)] font-light leading-[0.98] tracking-tight text-white transition duration-300 group-hover:italic">
											{item.project}
										</strong>
									</div>
									<div className="mt-auto flex min-h-[48px] items-end">
										<span
											className={cn(
												bodyText,
												"text-[0.98rem] font-medium italic leading-snug text-white/72",
											)}
										>
											{item.role}
										</span>
									</div>
								</div>
							</article>
						</li>
					))}
				</ul>
				<CarouselButton
					className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 max-[820px]:hidden"
					direction="next"
					onClick={() => scrollCredits(1)}
					title={title}
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent"
				/>
			</div>
		</section>
	);
}
