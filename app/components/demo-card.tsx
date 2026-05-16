import type { demos } from "../content";
import { bodyText, cn, labelText } from "./ui";
import { Waveform } from "./waveform";

type Demo = (typeof demos)[number];

export function DemoCard({ demo, featured = false }: { demo: Demo; featured?: boolean }) {
	const hasYouTube = "youtubeId" in demo && demo.youtubeId;
	const hasAudio = "audioSrc" in demo && demo.audioSrc;

	return (
		<article
			className={cn(
				"group relative border-line bg-white p-8 md:p-12 transition-all duration-500 hover:bg-surface",
				featured && "col-span-1",
			)}
		>
			<div className="flex flex-col gap-8 h-full">
				<div className="flex justify-between items-start">
					<span className={labelText}>{demo.type}</span>
					{hasAudio && (
						<div className="flex items-center gap-4">
							<Waveform className="h-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block hidden" />
						</div>
					)}
				</div>
				
				<div className="flex flex-col gap-4">
					<h3 className="font-serif text-[clamp(2rem,4vw,3.5rem)] leading-[0.9] text-ink italic tracking-tight">
						{demo.title}
					</h3>
					<p className={cn(bodyText, "max-w-[420px]")}>
						{demo.description}
					</p>
				</div>

				<div className="mt-auto pt-8">
					{hasYouTube ? (
						<div className="relative isolate aspect-video bg-ink">
							<iframe
								title={`YouTube video, ${demo.title}`}
								src={`https://www.youtube.com/embed/${demo.youtubeId}`}
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
								allowFullScreen
								className="absolute inset-0 h-full w-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
							/>
						</div>
					) : hasAudio ? (
						<div className="flex flex-col gap-4">
							<audio className="w-full custom-audio" controls preload="metadata" src={demo.audioSrc}>
								<track kind="captions" />
							</audio>
						</div>
					) : (
						<div
							className="flex items-end justify-between border-t border-line pt-8"
							aria-label={`${demo.title} ${demo.status}`}
						>
							<strong className="font-serif text-[clamp(1.5rem,3vw,2.5rem)] italic text-ink/20">
								{demo.status}
							</strong>
							<div className="h-px flex-1 mx-8 bg-line" />
							<span className={labelText}>Coming Soon</span>
						</div>
					)}
				</div>
			</div>
		</article>
	);
}
