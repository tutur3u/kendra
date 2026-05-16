import { bodyText, cn, labelText } from "./ui";

type CreditListProps = {
	title: string;
	items: Array<{
		project: string;
		role: string;
	}>;
};

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
							className="group flex justify-between items-baseline gap-8 py-6 border-b border-line last:border-0 transition-all duration-300 hover:pl-4"
						>
							<strong className="text-[clamp(1.1rem,1.8vw,1.4rem)] font-light tracking-tight text-ink group-hover:italic transition-all">
								{item.project}
							</strong>
							<div className="h-px flex-1 border-b border-line border-dotted opacity-20" />
							<span className={cn(bodyText, "text-accent italic font-medium")}>
								{item.role}
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
