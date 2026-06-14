"use client";

import { useMemo, useState } from "react";
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
	const [saving, setSaving] = useState(false);
	const hasChanges = useMemo(
		() => JSON.stringify(draft) !== JSON.stringify(lastSaved),
		[draft, lastSaved],
	);

	const updateSite = (field: SiteField, value: string) => {
		setDraft((current) => ({
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
		setDraft((current) => {
			const items = [...current[field]];
			items[index] = value;
			return { ...current, [field]: items };
		});
	};

	const addStringListItem = (field: StringListField) => {
		setDraft((current) => ({
			...current,
			[field]: [...current[field], stringListDefaults[field]],
		}));
	};

	const moveStringListItem = (
		field: StringListField,
		index: number,
		direction: -1 | 1,
	) => {
		setDraft((current) => ({
			...current,
			[field]: moveItem(current[field], index, direction),
		}));
	};

	const removeStringListItem = (field: StringListField, index: number) => {
		setDraft((current) => ({
			...current,
			[field]: current[field].filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const updateClientLogo = (
		index: number,
		field: ClientLogoField,
		value: string,
	) => {
		setDraft((current) => ({
			...current,
			clientLogos: current.clientLogos.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	const addClientLogo = () => {
		setDraft((current) => ({
			...current,
			clientLogos: [...current.clientLogos, { image: "/images/client-logo.png", name: "New Client" }],
		}));
	};

	const moveClientLogo = (index: number, direction: -1 | 1) => {
		setDraft((current) => ({
			...current,
			clientLogos: moveItem(current.clientLogos, index, direction),
		}));
	};

	const removeClientLogo = (index: number) => {
		setDraft((current) => ({
			...current,
			clientLogos: current.clientLogos.filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const updateStudioSpec = (
		index: number,
		field: StudioSpecField,
		value: string,
	) => {
		setDraft((current) => ({
			...current,
			studioSpecs: current.studioSpecs.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	const addStudioSpec = () => {
		setDraft((current) => ({
			...current,
			studioSpecs: [...current.studioSpecs, { label: "New spec", value: "" }],
		}));
	};

	const moveStudioSpec = (index: number, direction: -1 | 1) => {
		setDraft((current) => ({
			...current,
			studioSpecs: moveItem(current.studioSpecs, index, direction),
		}));
	};

	const removeStudioSpec = (index: number) => {
		setDraft((current) => ({
			...current,
			studioSpecs: current.studioSpecs.filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const updateExperienceGroupTitle = (groupIndex: number, value: string) => {
		setDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex ? { ...group, title: value } : group,
			),
		}));
	};

	const addExperienceGroup = () => {
		setDraft((current) => ({
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
		setDraft((current) => ({
			...current,
			experienceGroups: moveItem(current.experienceGroups, index, direction),
		}));
	};

	const removeExperienceGroup = (index: number) => {
		setDraft((current) => ({
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
		setDraft((current) => ({
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
		setDraft((current) => ({
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
		setDraft((current) => ({
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
		setDraft((current) => ({
			...current,
			experienceGroups: current.experienceGroups.map((group, index) =>
				index === groupIndex
					? { ...group, items: moveItem(group.items, itemIndex, direction) }
					: group,
			),
		}));
	};

	const removeExperienceItem = (groupIndex: number, itemIndex: number) => {
		setDraft((current) => ({
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
	};

	const saveContent = async () => {
		setSaving(true);
		setFieldErrors({});

		try {
			const response = await adminFetch("/api/admin/site-content", {
				body: JSON.stringify({ content: draft }),
				headers: { "Content-Type": "application/json" },
				method: "PUT",
			});
			const payload = (await response.json().catch(() => ({}))) as SiteContentMutationResponse;

			if (!response.ok || !payload.content) {
				setFieldErrors(payload.errors ?? {});
				toast.error(readPayloadError(payload, "We could not save page content."));
				return;
			}

			setDraft(cloneContent(payload.content));
			setLastSaved(cloneContent(payload.content));
			onSaved?.(payload.content);
			toast.success("Saved page content.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "We could not save page content.",
			);
		} finally {
			setSaving(false);
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
						className={primaryButton}
						disabled={saving || !hasChanges}
						onClick={() => void saveContent()}
						type="button"
					>
						{saving ? "Saving" : "Save pages"}
					</button>
				</div>
			</div>

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
					setDraft((current) => ({ ...current, contactIntro: value }))
				}
				onMoveStudioSpec={moveStudioSpec}
				onRemoveStudioSpec={removeStudioSpec}
				onUpdateStudioSpec={updateStudioSpec}
			/>
		</section>
	);
}
