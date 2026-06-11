"use client";

import type { KendraAdminReelStatus } from "@/lib/kendra-admin-reel-model";
import { KendraAdminReelAudioField } from "./kendra-admin-reel-audio-field";
import {
	FormSection,
	ReadOnlyField,
	SelectField,
	TextAreaField,
	TextField,
	ToggleRow,
} from "./kendra-admin-reel-form-fields";

export type ReelDraft = {
	category: string;
	downloadLabel: string;
	duration: string;
	featured: boolean;
	removeAudio: boolean;
	scriptNotes: string;
	slug: string;
	status: KendraAdminReelStatus;
	style: string;
	subtitle: string;
	summary: string;
	title: string;
};

const statusOptions: Array<{ label: string; value: KendraAdminReelStatus }> = [
	{ label: "Draft", value: "draft" },
	{ label: "Published", value: "published" },
	{ label: "Archived", value: "archived" },
	{ label: "Scheduled", value: "scheduled" },
];

export function ReelBasicsSection({
	draft,
	featuredInputId,
	fieldErrors,
	onChange,
}: {
	draft: ReelDraft;
	featuredInputId: string;
	fieldErrors: Record<string, string>;
	onChange: (name: keyof ReelDraft, value: string | boolean) => void;
}) {
	return (
		<FormSection
			defaultOpen
			description="Name the reel and decide whether visitors can see it."
			kicker="Step 1"
			title="Basics"
		>
			<div className="grid gap-4 md:grid-cols-2">
				<TextField
					error={fieldErrors.title}
					label="Reel name"
					name="title"
					onChange={onChange}
					required
					value={draft.title}
				/>
				<TextField
					label="Category"
					name="category"
					onChange={onChange}
					value={draft.category}
				/>
				<SelectField
					error={fieldErrors.status}
					label="Website visibility"
					name="status"
					onChange={(_, value) => onChange("status", value as KendraAdminReelStatus)}
					options={statusOptions}
					value={draft.status}
				/>
				<ToggleRow
					checked={draft.featured}
					description="Pin it near the top of the website list."
					id={featuredInputId}
					label="Feature this reel"
					onChange={(checked) => onChange("featured", checked)}
				/>
			</div>
		</FormSection>
	);
}

export function ReelAudioSection({
	audioFileLabel,
	audioUrl,
	currentAudioLabel,
	duration,
	error,
	hasCurrentAudio,
	onAudioChange,
	onRemoveAudioChange,
	removeAudio,
}: {
	audioFileLabel: string;
	audioUrl?: string | null;
	currentAudioLabel?: string | null;
	duration: string;
	error?: string;
	hasCurrentAudio: boolean;
	onAudioChange: (file: File | null) => void;
	onRemoveAudioChange: (checked: boolean) => void;
	removeAudio: boolean;
}) {
	return (
		<FormSection
			defaultOpen
			description="Upload the file. The length is detected for you."
			kicker="Step 2"
			title="Audio"
		>
			<div className="grid gap-4 md:grid-cols-[1fr_13rem]">
				<KendraAdminReelAudioField
					audioFileLabel={audioFileLabel}
					audioUrl={audioUrl}
					currentAudioLabel={currentAudioLabel}
					error={error}
					hasCurrentAudio={hasCurrentAudio}
					onAudioChange={onAudioChange}
					onRemoveAudioChange={onRemoveAudioChange}
					removeAudio={removeAudio}
				/>
				<ReadOnlyField
					help="This updates after you choose an audio file."
					label="Duration"
					placeholder="Auto"
					value={duration}
				/>
			</div>
		</FormSection>
	);
}

export function ReelPublicDetailsSection({
	draft,
	onChange,
}: {
	draft: ReelDraft;
	onChange: (name: keyof ReelDraft, value: string) => void;
}) {
	return (
		<FormSection
			description="Add the short customer-facing copy for the website."
			kicker="Step 3"
			title="Public details"
		>
			<TextAreaField
				label="Short description"
				name="summary"
				onChange={onChange}
				value={draft.summary}
			/>
			<TextAreaField
				label="Notes"
				name="scriptNotes"
				onChange={onChange}
				rows={5}
				value={draft.scriptNotes}
			/>
		</FormSection>
	);
}

export function ReelAdvancedSection({
	draft,
	fieldErrors,
	onChange,
	onSlugChange,
}: {
	draft: ReelDraft;
	fieldErrors: Record<string, string>;
	onChange: (name: keyof ReelDraft, value: string) => void;
	onSlugChange: (name: "slug", value: string) => void;
}) {
	return (
		<FormSection
			description="Only change these when a link or display label needs to be exact."
			title="Advanced options"
		>
			<div className="grid gap-4 md:grid-cols-2">
				<TextField
					error={fieldErrors.slug}
					label="Website link"
					name="slug"
					onChange={onSlugChange}
					required
					value={draft.slug}
				/>
				<TextField
					label="Voice style"
					name="style"
					onChange={onChange}
					value={draft.style}
				/>
				<TextField
					label="Type"
					name="subtitle"
					onChange={onChange}
					value={draft.subtitle}
				/>
				<TextField
					label="Download button text"
					name="downloadLabel"
					onChange={onChange}
					value={draft.downloadLabel}
				/>
			</div>
		</FormSection>
	);
}
