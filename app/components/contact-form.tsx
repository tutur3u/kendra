"use client";

import { site } from "../content";
import { cn, labelText, pillButton } from "./ui";

const projectTypes = [
	"Commercial / Corporate",
	"Animation / Character",
	"Video Game / Interactive",
	"Narration",
	"Other",
];

export function ContactForm() {
	function buildMailto(form: HTMLFormElement) {
		const data = new FormData(form);
		const body = [
			`Name: ${data.get("name") ?? ""}`,
			`Email: ${data.get("email") ?? ""}`,
			`Project type: ${data.get("projectType") ?? projectTypes[0]}`,
			`Timeline / budget notes: ${data.get("timeline") ?? ""}`,
			"",
			data.get("message") ?? "",
		].join("\n");

		return `mailto:${site.email}?subject=${encodeURIComponent(
			`VO inquiry for ${site.name}`,
		)}&body=${encodeURIComponent(body)}`;
	}

	const inputClass = "w-full border-b border-line bg-transparent px-0 py-4 text-ink outline-none transition-all duration-300 placeholder:text-ink/30 focus:border-accent";

	return (
		<form
			action={`mailto:${site.email}`}
			method="post"
			encType="text/plain"
			className="grid grid-cols-2 gap-x-12 gap-y-10 max-[620px]:grid-cols-1"
			onSubmit={(event) => {
				event.preventDefault();
				window.location.href = buildMailto(event.currentTarget);
			}}
		>
			<label className="grid gap-2">
				<span className={labelText}>Name</span>
				<input
					name="name"
					placeholder="Your name"
					autoComplete="name"
					className={inputClass}
				/>
			</label>
			<label className="grid gap-2">
				<span className={labelText}>Email</span>
				<input
					name="email"
					type="email"
					placeholder="you@example.com"
					autoComplete="email"
					className={inputClass}
				/>
			</label>
			<label className="grid gap-2">
				<span className={labelText}>Project type</span>
				<select
					name="projectType"
					defaultValue={projectTypes[0]}
					className={inputClass}
				>
					{projectTypes.map((type) => (
						<option key={type}>{type}</option>
					))}
				</select>
			</label>
			<label className="grid gap-2">
				<span className={labelText}>Timeline / budget</span>
				<input
					name="timeline"
					placeholder="Date, usage, budget notes"
					className={inputClass}
				/>
			</label>
			<label className="col-span-full grid gap-2">
				<span className={labelText}>Message</span>
				<textarea
					name="message"
					placeholder="Tell Kendra about the role, script, usage, specs, and deadline."
					rows={5}
					className={cn(inputClass, "resize-none")}
				/>
			</label>
			<button
				type="submit"
				className={cn(pillButton, "col-span-full mt-4 bg-ink text-white")}
			>
				Generate inquiry
			</button>
		</form>
	);
}
