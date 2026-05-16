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
				"relative h-[104px] w-[156px] shrink-0 overflow-hidden border border-line shadow-[0_14px_34px_rgba(10,10,10,0.08)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_42px_rgba(10,10,10,0.12)] max-[720px]:h-[88px] max-[720px]:w-[112px]",
				visualToneClasses[tone],
			)}
		>
			<div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.1)_48%,rgba(10,10,10,0.08))]" />
			{hasImage ? (
				<div className="absolute inset-3" style={imageStyle} />
			) : (
				<div className="absolute inset-0 grid place-items-center px-4 text-center">
					<span className="block max-w-full whitespace-nowrap pr-1 font-serif text-[clamp(1rem,1.6vw,1.55rem)] italic leading-none tracking-tight">
						{visual?.label ?? project}
					</span>
				</div>
			)}
			<div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
				<span className="h-px flex-1 bg-current/30" />
				<span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] opacity-70">
					VO
				</span>
			</div>
		</div>
	);
}

export function CreditList({ title, items }: CreditListProps) {
	return (
		<section className="py-12 border-b border-line last:border-0">
			<div className="grid grid-cols-[0.4fr_1.6fr] gap-16 max-[920px]:grid-cols-1 max-[920px]:gap-8">
				<div className="flex flex-col gap-4">
					<span className={labelText}>Credits</span>
					<h2 className="font-serif text-[clamp(2.5rem,4vw,3.5rem)] italic leading-[0.9] text-ink tracking-tight">
						{title}
					</h2>
				</div>
				<ul className="flex flex-col gap-0 border-l border-line pl-16 max-[920px]:pl-0 max-[920px]:border-l-0">
					{items.map((item) => (
						<li
							key={`${item.project}-${item.role}`}
							className="group grid grid-cols-[156px_minmax(0,1fr)_minmax(160px,auto)] items-center gap-7 border-b border-line py-5 transition-all duration-300 last:border-0 max-[720px]:grid-cols-[112px_minmax(0,1fr)] max-[720px]:gap-4"
						>
							<CreditVisualTile project={item.project} visual={item.visual} />
							<div className="grid min-w-0 gap-2">
								<strong className="text-[clamp(1.1rem,1.8vw,1.45rem)] font-light tracking-tight text-ink transition-all group-hover:italic">
									{item.project}
								</strong>
								<div className="hidden h-px w-full border-b border-line border-dotted opacity-40 max-[720px]:block" />
								<span
									className={cn(
										bodyText,
										"hidden text-accent italic font-medium max-[720px]:block",
									)}
								>
									{item.role}
								</span>
							</div>
							<span
								className={cn(
									bodyText,
									"text-right text-accent italic font-medium max-[720px]:hidden",
								)}
							>
								{item.role}
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
