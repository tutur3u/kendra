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
