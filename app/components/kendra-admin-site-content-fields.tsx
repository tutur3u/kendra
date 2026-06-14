"use client";

import type { KendraEditableSiteContent } from "@/lib/kendra-admin-site-content-model";
import { FieldError } from "./kendra-admin-reel-form-fields";
import { cn, labelText } from "./ui";

export type StringListField =
	| "availability"
	| "bio"
	| "notableClients"
	| "performanceModes";

type SiteContentMutationResponse = {
	content?: KendraEditableSiteContent;
	error?: string;
	errors?: Record<string, string>;
};

export const primaryButton =
	"min-h-10 border border-ink bg-ink px-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
	"min-h-10 border border-line bg-white px-4 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";
const dangerButton =
	"min-h-10 border border-coral/30 bg-white px-4 text-sm font-bold uppercase tracking-[0.1em] text-coral transition hover:bg-coral hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

const stringListLabels: Record<StringListField, string> = {
	availability: "Availability line",
	bio: "Bio paragraph",
	notableClients: "Client name",
	performanceModes: "Performance mode",
};

export const stringListDefaults: Record<StringListField, string> = {
	availability: "Available for remote sessions.",
	bio: "Add a new bio paragraph.",
	notableClients: "New Client",
	performanceModes: "New performance mode",
};

export function cloneContent(content: KendraEditableSiteContent) {
	return JSON.parse(JSON.stringify(content)) as KendraEditableSiteContent;
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
	const nextIndex = index + direction;
	if (nextIndex < 0 || nextIndex >= items.length) return items;

	const next = [...items];
	const [item] = next.splice(index, 1);
	if (item === undefined) return items;
	next.splice(nextIndex, 0, item);
	return next;
}

export function getError(errors: Record<string, string>, path: string) {
	return errors[path];
}

export function readPayloadError(
	payload: SiteContentMutationResponse,
	fallback: string,
) {
	return payload.error ?? Object.values(payload.errors ?? {})[0] ?? fallback;
}

export function TextInput({
	error,
	label,
	onChange,
	placeholder,
	value,
}: {
	error?: string;
	label: string;
	onChange: (value: string) => void;
	placeholder?: string;
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
				onChange={(event) => onChange(event.currentTarget.value)}
				placeholder={placeholder}
				value={value}
			/>
			<FieldError message={error} />
		</label>
	);
}

export function TextAreaInput({
	error,
	label,
	onChange,
	rows = 4,
	value,
}: {
	error?: string;
	label: string;
	onChange: (value: string) => void;
	rows?: number;
	value: string;
}) {
	return (
		<label className="grid gap-2">
			<span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<textarea
				className={cn(
					"min-h-28 resize-y border bg-white px-3 py-3 text-sm leading-relaxed text-ink outline-none transition focus:border-accent",
					error ? "border-coral" : "border-line",
				)}
				onChange={(event) => onChange(event.currentTarget.value)}
				rows={rows}
				value={value}
			/>
			<FieldError message={error} />
		</label>
	);
}

export function RowActions({
	disableDown,
	disableUp,
	onMoveDown,
	onMoveUp,
	onRemove,
}: {
	disableDown: boolean;
	disableUp: boolean;
	onMoveDown: () => void;
	onMoveUp: () => void;
	onRemove: () => void;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			<button
				className={secondaryButton}
				disabled={disableUp}
				onClick={onMoveUp}
				type="button"
			>
				Move up
			</button>
			<button
				className={secondaryButton}
				disabled={disableDown}
				onClick={onMoveDown}
				type="button"
			>
				Move down
			</button>
			<button className={dangerButton} onClick={onRemove} type="button">
				Remove
			</button>
		</div>
	);
}

export function SectionHeader({
	actionLabel,
	onAction,
	title,
}: {
	actionLabel: string;
	onAction: () => void;
	title: string;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
			<h3 className={labelText}>{title}</h3>
			<button className={secondaryButton} onClick={onAction} type="button">
				{actionLabel}
			</button>
		</div>
	);
}

export function StringListEditor({
	errors,
	field,
	items,
	onAdd,
	onMove,
	onRemove,
	onUpdate,
	textArea,
}: {
	errors: Record<string, string>;
	field: StringListField;
	items: string[];
	onAdd: () => void;
	onMove: (index: number, direction: -1 | 1) => void;
	onRemove: (index: number) => void;
	onUpdate: (index: number, value: string) => void;
	textArea?: boolean;
}) {
	const label = stringListLabels[field];

	return (
		<div className="grid gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0">
			<SectionHeader
				actionLabel={`Add ${label.toLowerCase()}`}
				onAction={onAdd}
				title={`${label}s`}
			/>
			{items.map((item, index) => (
				<div
					className="grid gap-3 border border-line bg-surface p-4"
					key={`${field}-${index}`}
				>
					{textArea ? (
						<TextAreaInput
							error={getError(errors, `${field}.${index}`)}
							label={`${label} ${index + 1}`}
							onChange={(value) => onUpdate(index, value)}
							value={item}
						/>
					) : (
						<TextInput
							error={getError(errors, `${field}.${index}`)}
							label={`${label} ${index + 1}`}
							onChange={(value) => onUpdate(index, value)}
							value={item}
						/>
					)}
					<RowActions
						disableDown={index === items.length - 1}
						disableUp={index === 0}
						onMoveDown={() => onMove(index, 1)}
						onMoveUp={() => onMove(index, -1)}
						onRemove={() => onRemove(index)}
					/>
				</div>
			))}
			{items.length === 0 ? (
				<p className="border border-dashed border-line bg-surface p-4 text-ink-soft text-sm">
					No {label.toLowerCase()}s yet.
				</p>
			) : null}
		</div>
	);
}
