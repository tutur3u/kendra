"use client";

import { useState, type ReactNode } from "react";
import { cn } from "./ui";

export function FieldError({ message }: { message?: string }) {
	if (!message) return null;
	return <p className="mt-1 text-coral text-xs">{message}</p>;
}

export function TextField<TName extends string>({
	error,
	label,
	name,
	onChange,
	placeholder,
	required,
	value,
}: {
	error?: string;
	label: string;
	name: TName;
	onChange: (name: TName, value: string) => void;
	placeholder?: string;
	required?: boolean;
	value: string;
}) {
	return (
		<label className="grid gap-2">
			<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<input
				className={cn(
					"min-h-11 border bg-white px-3 text-sm text-ink outline-none transition focus:border-accent",
					error ? "border-coral" : "border-line",
				)}
				name={name}
				onChange={(event) => onChange(name, event.currentTarget.value)}
				placeholder={placeholder}
				required={required}
				value={value}
			/>
			<FieldError message={error} />
		</label>
	);
}

export function TextAreaField<TName extends string>({
	label,
	name,
	onChange,
	placeholder,
	rows = 4,
	value,
}: {
	label: string;
	name: TName;
	onChange: (name: TName, value: string) => void;
	placeholder?: string;
	rows?: number;
	value: string;
}) {
	return (
		<label className="grid gap-2">
			<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<textarea
				className="min-h-28 resize-y border border-line bg-white px-3 py-3 text-sm leading-relaxed text-ink outline-none transition focus:border-accent"
				name={name}
				onChange={(event) => onChange(name, event.currentTarget.value)}
				placeholder={placeholder}
				rows={rows}
				value={value}
			/>
		</label>
	);
}

export function SelectField<TName extends string>({
	error,
	label,
	name,
	onChange,
	options,
	value,
}: {
	error?: string;
	label: string;
	name: TName;
	onChange: (name: TName, value: string) => void;
	options: Array<{ label: string; value: string }>;
	value: string;
}) {
	return (
		<label className="grid gap-2">
			<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<select
				className={cn(
					"min-h-11 border bg-white px-3 text-sm text-ink outline-none transition focus:border-accent",
					error ? "border-coral" : "border-line",
				)}
				onChange={(event) => onChange(name, event.currentTarget.value)}
				value={value}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<FieldError message={error} />
		</label>
	);
}

export function ReadOnlyField({
	help,
	label,
	placeholder,
	value,
}: {
	help?: string;
	label: string;
	placeholder?: string;
	value: string;
}) {
	return (
		<label className="grid gap-2">
			<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<input
				className="min-h-11 cursor-not-allowed border border-line bg-mist px-3 text-sm text-ink-soft outline-none"
				disabled
				placeholder={placeholder}
				value={value}
			/>
			{help ? <span className="text-ink-soft text-xs">{help}</span> : null}
		</label>
	);
}

export function ToggleRow({
	checked,
	description,
	id,
	label,
	onChange,
}: {
	checked: boolean;
	description?: string;
	id: string;
	label: string;
	onChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4 border border-line bg-surface px-4 py-3 text-sm text-ink">
			<span>
				<label className="block font-semibold" htmlFor={id}>
					{label}
				</label>
				{description ? (
					<span className="text-ink-soft text-xs">{description}</span>
				) : null}
			</span>
			<input
				checked={checked}
				className="size-5 accent-current"
				id={id}
				onChange={(event) => onChange(event.currentTarget.checked)}
				type="checkbox"
			/>
		</div>
	);
}

export function FormSection({
	children,
	defaultOpen,
	description,
	kicker,
	title,
}: {
	children: ReactNode;
	defaultOpen?: boolean;
	description?: string;
	kicker?: string;
	title: string;
}) {
	const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));

	return (
		<section className="border border-line bg-white shadow-[0_16px_44px_rgba(10,10,10,0.04)]">
			<button
				aria-expanded={isOpen}
				className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-surface"
				onClick={() => setIsOpen((value) => !value)}
				type="button"
			>
				<span>
					{kicker ? (
						<span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent">
							{kicker}
						</span>
					) : null}
					<span className="block text-sm font-semibold text-ink">{title}</span>
					{description ? (
						<span className="mt-1 block text-ink-soft text-xs">{description}</span>
					) : null}
				</span>
				<span
					className={cn(
						"mt-1 text-ink-soft text-sm transition",
						isOpen && "rotate-45",
					)}
					aria-hidden="true"
				>
					+
				</span>
			</button>
			{isOpen ? <div className="grid gap-4 border-t border-line p-4">{children}</div> : null}
		</section>
	);
}
