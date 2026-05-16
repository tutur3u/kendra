export function cn(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export const shell =
	"mx-auto w-[calc(100%_-_48px)] max-w-[1240px] max-[920px]:w-[calc(100%_-_32px)]";

export const bodyText =
	"text-ink-soft text-[clamp(1rem,1.4vw,1.15rem)] font-light leading-[1.7] tracking-tight";

export const displayHeading =
	"text-balance font-serif font-[400] leading-[0.88] tracking-[-0.03em] text-ink italic text-[clamp(3.5rem,10vw,10rem)]";

export const sectionHeading =
	"text-balance font-serif text-[clamp(2.2rem,6vw,5.5rem)] font-[400] leading-[0.9] tracking-[-0.02em] text-ink";

export const labelText =
	"text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent";

export const pillButton =
	"inline-flex min-h-11 items-center justify-center border border-ink px-8 py-2 text-[0.85rem] font-medium uppercase tracking-[0.1em] transition duration-300 hover:bg-ink hover:text-white focus-visible:outline-[1px] focus-visible:outline-offset-[4px] focus-visible:outline-ink";

export const panel =
	"relative overflow-hidden rounded-3xl border border-line bg-white/75 shadow-[0_18px_48px_rgba(23,26,23,0.07)]";

export const gradientRail =
	"before:absolute before:inset-x-0 before:top-0 before:h-1 before:origin-left before:scale-x-0 before:bg-gradient-to-r before:from-green before:via-sun before:to-coral before:transition before:duration-300 hover:before:scale-x-100";
