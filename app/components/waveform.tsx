import type { CSSProperties } from "react";
import { cn } from "./ui";

type WaveformProps = {
	className?: string;
	label?: string;
};

const bars = [34, 54, 42, 78, 50, 92, 62, 38, 74, 46, 86, 58, 32, 68, 48, 80];

export function Waveform({ className = "", label = "Decorative audio waveform" }: WaveformProps) {
	return (
		<div
			aria-label={label}
			className={cn("flex h-12 items-center gap-[1px] text-accent", className)}
		>
			{bars.map((height, index) => (
				<span
					key={`${height}-${index}`}
					className="block h-[var(--bar-height)] min-h-[4px] w-[2px] origin-center animate-[pulse-bar_2s_ease-in-out_infinite_alternate] bg-current [animation-delay:calc(var(--bar-height)*-15ms)]"
					style={{ "--bar-height": `${height}%` } as CSSProperties}
				/>
			))}
		</div>
	);
}
