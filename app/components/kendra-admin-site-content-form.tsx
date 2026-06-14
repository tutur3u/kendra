"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { KendraEditableSiteContent } from "@/lib/kendra-admin-site-content-model";
import { adminFetch } from "./kendra-admin-session-client";
import {
	cloneContent,
	moveItem,
	primaryButton,
	readPayloadError,
	secondaryButton,
	stringListDefaults,
	type StringListField,
} from "./kendra-admin-site-content-fields";
import {
	ClientsContentSection,
	ExperienceContentSection,
	HomePageContentSection,
	ProfileAndLinksSection,
	StudioContactSection,
} from "./kendra-admin-site-content-sections";
import { labelText } from "./ui";

type SiteField = keyof KendraEditableSiteContent["site"];
type ClientLogo = KendraEditableSiteContent["clientLogos"][number];
type ClientLogoField = keyof ClientLogo;
type StudioSpec = KendraEditableSiteContent["studioSpecs"][number];
type StudioSpecField = keyof StudioSpec;
type ExperienceItemField = "project" | "role";
type ExperienceVisualField =
	| "image"
	| "imagePosition"
	| "imageSize"
	| "label"
	| "tone";

type SiteContentMutationResponse = {
	content?: KendraEditableSiteContent;
	error?: string;
	errors?: Record<string, string>;
};

export function KendraAdminSiteContentForm({
	initialContent,
	onSaved,
}: {
	initialContent: KendraEditableSiteContent;
	onSaved?: (content: KendraEditableSiteContent) => void;
}) {
	const [draft, setDraft] = useState(() => cloneContent(initialContent));
	const [lastSaved, setLastSaved] = useState(() => cloneContent(initialContent));
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [hasChanges, setHasChanges] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveStep, setSaveStep] = useState<string | null>(null);

	const updateDraft = (
		updater: (current: KendraEditableSiteContent) => KendraEditableSiteContent,
	) => {
		setHasChanges(true);
		setDraft(updater);
	};

	const updateSite = (field: SiteField, value: string) => {
		updateDraft((current) => ({
			...current,
			site: {
				...current.site,
				[field]: value,
			},
		}));
	};

	const updateStringList = (
		field: StringListField,
		index: number,
		value: string,
	) => {
		updateDraft((current) => {
			const items = [...current[field]];
			items[index] = value;
			return { ...current, [field]: items };
		});
	};

	const addStringListItem = (field: StringListField) => {
		updateDraft((current) => ({
			...current,
			[field]: [...current[field], stringListDefaults[field]],
		}));
	};

	const moveStringListItem = (
		field: StringListField,
		index: number,
		direction: -1 | 1,
	) => {
		updateDraft((current) => ({
			...current,
			[field]: moveItem(current[field], index, direction),
		}));
	};

	const removeStringListItem = (field: StringListField, index: number) => {
		updateDraft((current) => ({
			...current,
			[field]: current[field].filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const updateClientLogo = (
		index: number,
		field: ClientLogoField,
		value: string,
	) => {
		updateDraft((current) => ({
			...current,
			clientLogos: current.clientLogos.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	const addClientLogo = () => {
		updateDraft((current) => ({
			...current,
			clientLogos: [...current.clientLogos, { image: "/images/client-logo.png", name: "New Client" }],
		}));
	};

	const moveClientLogo = (index: number, direction: -1 | 1) => {
		updateDraft((current) => ({
			...current,
			clientLogos: moveItem(current.clientLogos, index, direction),
		}));
	};

	const removeClientLogo = (index: number) => {
		updateDraft((current) => ({
			...current,
			clientLogos: current.clientLogos.filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const updateStudioSpec = (
		index: number,
		field: StudioSpecField,
		value: string,
	) => {
		updateDraft((current) => ({
			...current,
			studioSpecs: current.studioSpecs.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	const addStudioSpec = () => {
		updateDraft((current) => ({
			...current,
			studioSpecs: [...current.studioSpecs, { label: "New spec", value: "" }],
		}));
	};

	const moveStudioSpec = (index: number, direction: -1 | 1) => {
		updateDraft((current) => ({
			...current,
			studioSpecs: moveItem(current.studioSpecs, index, direction),
		}));
	};

	const removeStudioSpec = (index: number) => {
		updateDraft((current) => ({
			...current,
			studioSpecs: current.studioSpecs.filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const updateExperienceGroupTitle = (groupIndex: number, value: string) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex ? { ...group, title: value } : group,
			),
		}));
	};

	const addExperienceGroup = () => {
		updateDraft((current) => ({
			...current,
			experienceGroups: [
				...current.experienceGroups,
				{
					items: [{ project: "New Project", role: "Role", visual: { label: "New Project", tone: "studio" } }],
					title: "New Experience Section",
				},
			],
		}));
	};

	const moveExperienceGroup = (index: number, direction: -1 | 1) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: moveItem(current.experienceGroups, index, direction),
		}));
	};

	const removeExperienceGroup = (index: number) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.filter(
				(_, itemIndex) => itemIndex !== index,
			),
		}));
	};

	const updateExperienceItem = (
		groupIndex: number,
		itemIndex: number,
		field: ExperienceItemField,
		value: string,
	) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex
					? {
							...group,
							items: group.items.map((item, currentItemIndex) =>
								currentItemIndex === itemIndex
									? { ...item, [field]: value }
									: item,
							),
						}
					: group,
			),
		}));
	};

	const updateExperienceVisual = (
		groupIndex: number,
		itemIndex: number,
		field: ExperienceVisualField,
		value: string,
	) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex
					? {
							...group,
							items: group.items.map((item, currentItemIndex) =>
								currentItemIndex === itemIndex
									? {
											...item,
											visual: {
												...(item.visual ?? {}),
												[field]: value,
											},
										}
									: item,
							),
						}
					: group,
			),
		}));
	};

	const addExperienceItem = (groupIndex: number) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex
					? {
							...group,
							items: [
								...group.items,
								{
									project: "New Project",
									role: "Role",
									visual: { label: "New Project", tone: "studio" },
								},
							],
						}
					: group,
			),
		}));
	};

	const moveExperienceItem = (
		groupIndex: number,
		itemIndex: number,
		direction: -1 | 1,
	) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex
					? { ...group, items: moveItem(group.items, itemIndex, direction) }
					: group,
			),
		}));
	};

	const removeExperienceItem = (groupIndex: number, itemIndex: number) => {
		updateDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex
					? {
							...group,
							items: group.items.filter(
								(_, currentItemIndex) => currentItemIndex !== itemIndex,
							),
						}
					: group,
			),
		}));
	};

	const resetDraft = () => {
		setDraft(cloneContent(lastSaved));
		setFieldErrors({});
		setHasChanges(false);
		setSaveStep(null);
	};

	const saveContent = async () => {
		setSaving(true);
		setSaveStep("Preparing changes");
		setFieldErrors({});

		try {
			setSaveStep("Saving to dashboard");
			const response = await adminFetch("/api/admin/site-content", {
				body: JSON.stringify({ content: draft }),
				headers: { "Content-Type": "application/json" },
				method: "PUT",
			});
			setSaveStep("Reading saved content");
			const payload = (await response.json().catch(() => ({}))) as SiteContentMutationResponse;

			if (!response.ok || !payload.content) {
				setFieldErrors(payload.errors ?? {});
				toast.error(readPayloadError(payload, "We could not save page content."));
				return;
			}

			setSaveStep("Refreshing editor");
			setDraft(cloneContent(payload.content));
			setLastSaved(cloneContent(payload.content));
			setHasChanges(false);
			onSaved?.(payload.content);
			toast.success("Saved page content.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "We could not save page content.",
			);
		} finally {
			setSaving(false);
			setSaveStep(null);
		}
	};

	const listActions = {
		addStringListItem,
		moveStringListItem,
		removeStringListItem,
		updateStringList,
	};

	return (
		<section className="grid gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-white p-5">
				<div>
					<span className={labelText}>Pages</span>
					<h2 className="mt-2 text-xl font-semibold text-ink">
						Website content
					</h2>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						className={secondaryButton}
						disabled={saving || !hasChanges}
						onClick={resetDraft}
						type="button"
					>
						Cancel changes
					</button>
					<button
						aria-busy={saving}
						className={primaryButton}
						disabled={saving || !hasChanges}
						onClick={() => void saveContent()}
						type="button"
					>
						{saving ? "Saving" : "Save pages"}
					</button>
				</div>
			</div>
			{saving && saveStep ? <SaveProgress step={saveStep} /> : null}

			<ProfileAndLinksSection
				content={draft}
				fieldErrors={fieldErrors}
				updateSite={updateSite}
			/>
			<HomePageContentSection
				content={draft}
				fieldErrors={fieldErrors}
				listActions={listActions}
			/>
			<ClientsContentSection
				content={draft}
				fieldErrors={fieldErrors}
				listActions={listActions}
				onAddClientLogo={addClientLogo}
				onMoveClientLogo={moveClientLogo}
				onRemoveClientLogo={removeClientLogo}
				onUpdateClientLogo={updateClientLogo}
			/>
			<ExperienceContentSection
				content={draft}
				fieldErrors={fieldErrors}
				onAddExperienceGroup={addExperienceGroup}
				onAddExperienceItem={addExperienceItem}
				onMoveExperienceGroup={moveExperienceGroup}
				onMoveExperienceItem={moveExperienceItem}
				onRemoveExperienceGroup={removeExperienceGroup}
				onRemoveExperienceItem={removeExperienceItem}
				onUpdateExperienceGroupTitle={updateExperienceGroupTitle}
				onUpdateExperienceItem={updateExperienceItem}
				onUpdateExperienceVisual={updateExperienceVisual}
			/>
			<StudioContactSection
				content={draft}
				fieldErrors={fieldErrors}
				listActions={listActions}
				onAddStudioSpec={addStudioSpec}
				onContactIntroChange={(value) =>
					updateDraft((current) => ({ ...current, contactIntro: value }))
				}
				onMoveStudioSpec={moveStudioSpec}
				onRemoveStudioSpec={removeStudioSpec}
				onUpdateStudioSpec={updateStudioSpec}
			/>
		</section>
	);
}

function SaveProgress({ step }: { step: string }) {
	return (
		<div
			aria-live="polite"
			className="flex items-center gap-3 border border-accent/20 bg-white p-4 text-sm text-ink shadow-[0_16px_44px_rgba(10,10,10,0.04)]"
		>
			<span
				aria-hidden="true"
				className="h-5 w-5 shrink-0 animate-[slow-spin_700ms_linear_infinite] rounded-full border-2 border-accent/25 border-t-accent"
			/>
			<span>
				<span className="font-bold uppercase tracking-[0.12em] text-accent">
					Current step
				</span>
				<span className="ml-2 font-medium text-ink">{step}</span>
			</span>
		</div>
	);
}
