"use client";

import type { KendraEditableSiteContent } from "@/lib/kendra-admin-site-content-model";
import { FormSection } from "./kendra-admin-reel-form-fields";
import {
  SiteImageField,
  type SiteImageUploadRequest,
  type SiteImageUploadState,
} from "./kendra-admin-site-image-field";
import {
  getError,
  RowActions,
  SectionHeader,
  StringListEditor,
  TextAreaInput,
  TextInput,
  type StringListField,
} from "./kendra-admin-site-content-fields";

type Direction = -1 | 1;
type SiteField = keyof KendraEditableSiteContent["site"];
type ClientLogoField = keyof KendraEditableSiteContent["clientLogos"][number];
type StudioSpecField = keyof KendraEditableSiteContent["studioSpecs"][number];
type ExperienceGroup = KendraEditableSiteContent["experienceGroups"][number];
type ExperienceItem = ExperienceGroup["items"][number];
type ExperienceItemField = "project" | "role";
type ExperienceVisualField =
  | "image"
  | "imagePosition"
  | "imageSize"
  | "label"
  | "tone";

type StringListActions = {
  addStringListItem: (field: StringListField) => void;
  moveStringListItem: (
    field: StringListField,
    index: number,
    direction: Direction,
  ) => void;
  removeStringListItem: (field: StringListField, index: number) => void;
  updateStringList: (
    field: StringListField,
    index: number,
    value: string,
  ) => void;
};

export function ProfileAndLinksSection({
  content,
  fieldErrors,
  imageUploads,
  onUploadSiteImage,
  updateSite,
}: {
  content: KendraEditableSiteContent;
  fieldErrors: Record<string, string>;
  imageUploads: Record<string, SiteImageUploadState>;
  onUploadSiteImage: (request: SiteImageUploadRequest) => void;
  updateSite: (field: SiteField, value: string) => void;
}) {
  return (
    <>
      <FormSection
        defaultOpen
        description="Main identity shown across public pages and browser metadata."
        kicker="Profile"
        title="Identity"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            error={getError(fieldErrors, "site.name")}
            label="Name"
            onChange={(value) => updateSite("name", value)}
            value={content.site.name}
          />
          <TextInput
            error={getError(fieldErrors, "site.title")}
            label="Browser title"
            onChange={(value) => updateSite("title", value)}
            value={content.site.title}
          />
          <TextInput
            error={getError(fieldErrors, "site.tagline")}
            label="Tagline"
            onChange={(value) => updateSite("tagline", value)}
            value={content.site.tagline}
          />
          <TextInput
            error={getError(fieldErrors, "site.location")}
            label="Location"
            onChange={(value) => updateSite("location", value)}
            value={content.site.location}
          />
          <TextInput
            error={getError(fieldErrors, "site.email")}
            label="Email"
            onChange={(value) => updateSite("email", value)}
            value={content.site.email}
          />
        </div>
      </FormSection>
      <FormSection
        description="External links used for resume and rate guidance."
        kicker="Links"
        title="Resume and rates"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            error={getError(fieldErrors, "site.resumeUrl")}
            label="Resume URL"
            onChange={(value) => updateSite("resumeUrl", value)}
            value={content.site.resumeUrl}
          />
          <TextInput
            error={getError(fieldErrors, "site.gvaaUrl")}
            label="GVAA URL"
            onChange={(value) => updateSite("gvaaUrl", value)}
            value={content.site.gvaaUrl}
          />
        </div>
      </FormSection>
      <FormSection
        description="Replace public images without editing storage URLs."
        kicker="Images"
        title="Public images"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <SiteImageField
            error={getError(fieldErrors, "site.heroImage")}
            fieldKey="site.heroImage"
            label="Hero image"
            onUpload={onUploadSiteImage}
            onUploaded={(value) => updateSite("heroImage", value)}
            previewAlt={content.site.heroImageAlt}
            uploadState={imageUploads["site.heroImage"]}
            value={content.site.heroImage}
          />
          <SiteImageField
            error={getError(fieldErrors, "site.clientProofImage")}
            fieldKey="site.clientProofImage"
            label="Client proof image"
            onUpload={onUploadSiteImage}
            onUploaded={(value) => updateSite("clientProofImage", value)}
            uploadState={imageUploads["site.clientProofImage"]}
            value={content.site.clientProofImage}
          />
          <TextInput
            error={getError(fieldErrors, "site.heroImageAlt")}
            label="Hero image alt text"
            onChange={(value) => updateSite("heroImageAlt", value)}
            value={content.site.heroImageAlt}
          />
        </div>
      </FormSection>
    </>
  );
}

export function HomePageContentSection({
  content,
  fieldErrors,
  listActions,
}: {
  content: KendraEditableSiteContent;
  fieldErrors: Record<string, string>;
  listActions: StringListActions;
}) {
  return (
    <FormSection
      description="Home page biography and performance modes."
      kicker="Home"
      title="Home page"
    >
      <StringListEditor
        errors={fieldErrors}
        field="bio"
        items={content.bio}
        onAdd={() => listActions.addStringListItem("bio")}
        onMove={(index, direction) =>
          listActions.moveStringListItem("bio", index, direction)
        }
        onRemove={(index) => listActions.removeStringListItem("bio", index)}
        onUpdate={(index, value) =>
          listActions.updateStringList("bio", index, value)
        }
        textArea
      />
      <StringListEditor
        errors={fieldErrors}
        field="performanceModes"
        items={content.performanceModes}
        onAdd={() => listActions.addStringListItem("performanceModes")}
        onMove={(index, direction) =>
          listActions.moveStringListItem("performanceModes", index, direction)
        }
        onRemove={(index) =>
          listActions.removeStringListItem("performanceModes", index)
        }
        onUpdate={(index, value) =>
          listActions.updateStringList("performanceModes", index, value)
        }
      />
    </FormSection>
  );
}

export function ClientsContentSection({
  content,
  fieldErrors,
  imageUploads,
  listActions,
  onAddClientLogo,
  onMoveClientLogo,
  onRemoveClientLogo,
  onUpdateClientLogo,
  onUploadSiteImage,
}: {
  content: KendraEditableSiteContent;
  fieldErrors: Record<string, string>;
  imageUploads: Record<string, SiteImageUploadState>;
  listActions: StringListActions;
  onAddClientLogo: () => void;
  onMoveClientLogo: (index: number, direction: Direction) => void;
  onRemoveClientLogo: (index: number) => void;
  onUpdateClientLogo: (
    index: number,
    field: ClientLogoField,
    value: string,
  ) => void;
  onUploadSiteImage: (request: SiteImageUploadRequest) => void;
}) {
  return (
    <FormSection
      description="Client names and logo paths shown on the public site."
      kicker="Clients"
      title="Clients"
    >
      <StringListEditor
        errors={fieldErrors}
        field="notableClients"
        items={content.notableClients}
        onAdd={() => listActions.addStringListItem("notableClients")}
        onMove={(index, direction) =>
          listActions.moveStringListItem("notableClients", index, direction)
        }
        onRemove={(index) =>
          listActions.removeStringListItem("notableClients", index)
        }
        onUpdate={(index, value) =>
          listActions.updateStringList("notableClients", index, value)
        }
      />
      <div className="grid gap-4 border-t border-line pt-4">
        <SectionHeader
          actionLabel="Add logo"
          onAction={onAddClientLogo}
          title="Client logos"
        />
        {content.clientLogos.map((logo, index) => (
          <div
            className="grid gap-3 border border-line bg-surface p-4"
            key={`${logo.name}-${index}`}
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <TextInput
                error={getError(fieldErrors, `clientLogos.${index}.name`)}
                label="Client name"
                onChange={(value) => onUpdateClientLogo(index, "name", value)}
                value={logo.name}
              />
              <SiteImageField
                error={getError(fieldErrors, `clientLogos.${index}.image`)}
                fieldKey={`clientLogos.${index}.image`}
                label="Logo image"
                onUpload={onUploadSiteImage}
                onUploaded={(value) =>
                  onUpdateClientLogo(index, "image", value)
                }
                previewAlt={`${logo.name} logo`}
                uploadState={imageUploads[`clientLogos.${index}.image`]}
                value={logo.image}
              />
            </div>
            <RowActions
              disableDown={index === content.clientLogos.length - 1}
              disableUp={index === 0}
              onMoveDown={() => onMoveClientLogo(index, 1)}
              onMoveUp={() => onMoveClientLogo(index, -1)}
              onRemove={() => onRemoveClientLogo(index)}
            />
          </div>
        ))}
      </div>
    </FormSection>
  );
}

function visualValue(item: ExperienceItem, field: ExperienceVisualField) {
  const value = item.visual?.[field];
  return typeof value === "string" ? value : "";
}

export function ExperienceContentSection({
  content,
  fieldErrors,
  imageUploads,
  onAddExperienceGroup,
  onAddExperienceItem,
  onMoveExperienceGroup,
  onMoveExperienceItem,
  onRemoveExperienceGroup,
  onRemoveExperienceItem,
  onUpdateExperienceGroupTitle,
  onUpdateExperienceItem,
  onUpdateExperienceVisual,
  onUploadSiteImage,
}: {
  content: KendraEditableSiteContent;
  fieldErrors: Record<string, string>;
  imageUploads: Record<string, SiteImageUploadState>;
  onAddExperienceGroup: () => void;
  onAddExperienceItem: (groupIndex: number) => void;
  onMoveExperienceGroup: (index: number, direction: Direction) => void;
  onMoveExperienceItem: (
    groupIndex: number,
    itemIndex: number,
    direction: Direction,
  ) => void;
  onRemoveExperienceGroup: (index: number) => void;
  onRemoveExperienceItem: (groupIndex: number, itemIndex: number) => void;
  onUpdateExperienceGroupTitle: (groupIndex: number, value: string) => void;
  onUpdateExperienceItem: (
    groupIndex: number,
    itemIndex: number,
    field: ExperienceItemField,
    value: string,
  ) => void;
  onUpdateExperienceVisual: (
    groupIndex: number,
    itemIndex: number,
    field: ExperienceVisualField,
    value: string,
  ) => void;
  onUploadSiteImage: (request: SiteImageUploadRequest) => void;
}) {
  return (
    <FormSection
      description="Resume link plus grouped experience and training credits."
      kicker="Experience"
      title="Experience page"
    >
      <SectionHeader
        actionLabel="Add section"
        onAction={onAddExperienceGroup}
        title="Experience sections"
      />
      <div className="grid gap-5">
        {content.experienceGroups.map((group, groupIndex) => (
          <div
            className="grid gap-4 border border-line bg-surface p-4"
            key={`${group.title}-${groupIndex}`}
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <TextInput
                error={getError(
                  fieldErrors,
                  `experienceGroups.${groupIndex}.title`,
                )}
                label="Section title"
                onChange={(value) =>
                  onUpdateExperienceGroupTitle(groupIndex, value)
                }
                value={group.title}
              />
              <RowActions
                disableDown={groupIndex === content.experienceGroups.length - 1}
                disableUp={groupIndex === 0}
                onMoveDown={() => onMoveExperienceGroup(groupIndex, 1)}
                onMoveUp={() => onMoveExperienceGroup(groupIndex, -1)}
                onRemove={() => onRemoveExperienceGroup(groupIndex)}
              />
            </div>
            <ExperienceCreditList
              fieldErrors={fieldErrors}
              group={group}
              groupIndex={groupIndex}
              imageUploads={imageUploads}
              onAddExperienceItem={onAddExperienceItem}
              onMoveExperienceItem={onMoveExperienceItem}
              onRemoveExperienceItem={onRemoveExperienceItem}
              onUpdateExperienceItem={onUpdateExperienceItem}
              onUpdateExperienceVisual={onUpdateExperienceVisual}
              onUploadSiteImage={onUploadSiteImage}
            />
          </div>
        ))}
      </div>
    </FormSection>
  );
}

function ExperienceCreditList({
  fieldErrors,
  group,
  groupIndex,
  imageUploads,
  onAddExperienceItem,
  onMoveExperienceItem,
  onRemoveExperienceItem,
  onUpdateExperienceItem,
  onUpdateExperienceVisual,
  onUploadSiteImage,
}: {
  fieldErrors: Record<string, string>;
  group: ExperienceGroup;
  groupIndex: number;
  imageUploads: Record<string, SiteImageUploadState>;
  onAddExperienceItem: (groupIndex: number) => void;
  onMoveExperienceItem: (
    groupIndex: number,
    itemIndex: number,
    direction: Direction,
  ) => void;
  onRemoveExperienceItem: (groupIndex: number, itemIndex: number) => void;
  onUpdateExperienceItem: (
    groupIndex: number,
    itemIndex: number,
    field: ExperienceItemField,
    value: string,
  ) => void;
  onUpdateExperienceVisual: (
    groupIndex: number,
    itemIndex: number,
    field: ExperienceVisualField,
    value: string,
  ) => void;
  onUploadSiteImage: (request: SiteImageUploadRequest) => void;
}) {
  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <SectionHeader
        actionLabel="Add credit"
        onAction={() => onAddExperienceItem(groupIndex)}
        title="Credits"
      />
      {group.items.map((item, itemIndex) => {
        const base = `experienceGroups.${groupIndex}.items.${itemIndex}`;

        return (
          <div
            className="grid gap-3 border border-line bg-white p-4"
            key={`${item.project}-${itemIndex}`}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                error={getError(fieldErrors, `${base}.project`)}
                label="Project"
                onChange={(value) =>
                  onUpdateExperienceItem(
                    groupIndex,
                    itemIndex,
                    "project",
                    value,
                  )
                }
                value={item.project}
              />
              <TextInput
                error={getError(fieldErrors, `${base}.role`)}
                label="Role"
                onChange={(value) =>
                  onUpdateExperienceItem(groupIndex, itemIndex, "role", value)
                }
                value={item.role}
              />
              <SiteImageField
                error={getError(fieldErrors, `${base}.visual.image`)}
                fieldKey={`${base}.visual.image`}
                label="Visual image"
                onUpload={onUploadSiteImage}
                onUploaded={(value) =>
                  onUpdateExperienceVisual(
                    groupIndex,
                    itemIndex,
                    "image",
                    value,
                  )
                }
                previewAlt={`${item.project} visual`}
                uploadState={imageUploads[`${base}.visual.image`]}
                value={visualValue(item, "image")}
              />
              {(
                [
                  ["label", "Visual label"],
                  ["tone", "Visual tone"],
                  ["imageSize", "Image size"],
                  ["imagePosition", "Image position"],
                ] satisfies Array<[ExperienceVisualField, string]>
              ).map(([field, label]) => (
                <TextInput
                  key={field}
                  label={label}
                  onChange={(value) =>
                    onUpdateExperienceVisual(
                      groupIndex,
                      itemIndex,
                      field,
                      value,
                    )
                  }
                  value={visualValue(item, field)}
                />
              ))}
            </div>
            <RowActions
              disableDown={itemIndex === group.items.length - 1}
              disableUp={itemIndex === 0}
              onMoveDown={() => onMoveExperienceItem(groupIndex, itemIndex, 1)}
              onMoveUp={() => onMoveExperienceItem(groupIndex, itemIndex, -1)}
              onRemove={() => onRemoveExperienceItem(groupIndex, itemIndex)}
            />
          </div>
        );
      })}
    </div>
  );
}

export function StudioContactSection({
  content,
  fieldErrors,
  listActions,
  onAddStudioSpec,
  onContactIntroChange,
  onMoveStudioSpec,
  onRemoveStudioSpec,
  onUpdateStudioSpec,
}: {
  content: KendraEditableSiteContent;
  fieldErrors: Record<string, string>;
  listActions: StringListActions;
  onAddStudioSpec: () => void;
  onContactIntroChange: (value: string) => void;
  onMoveStudioSpec: (index: number, direction: Direction) => void;
  onRemoveStudioSpec: (index: number) => void;
  onUpdateStudioSpec: (
    index: number,
    field: StudioSpecField,
    value: string,
  ) => void;
}) {
  return (
    <FormSection
      description="Home Studio, Contact, and booking-process copy."
      kicker="Studio"
      title="Studio and contact"
    >
      <div className="grid gap-4">
        <SectionHeader
          actionLabel="Add spec"
          onAction={onAddStudioSpec}
          title="Studio specs"
        />
        {content.studioSpecs.map((spec, index) => (
          <div
            className="grid gap-3 border border-line bg-surface p-4"
            key={`${spec.label}-${index}`}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                error={getError(fieldErrors, `studioSpecs.${index}.label`)}
                label="Spec label"
                onChange={(value) => onUpdateStudioSpec(index, "label", value)}
                value={spec.label}
              />
              <TextInput
                error={getError(fieldErrors, `studioSpecs.${index}.value`)}
                label="Spec value"
                onChange={(value) => onUpdateStudioSpec(index, "value", value)}
                value={spec.value}
              />
            </div>
            <RowActions
              disableDown={index === content.studioSpecs.length - 1}
              disableUp={index === 0}
              onMoveDown={() => onMoveStudioSpec(index, 1)}
              onMoveUp={() => onMoveStudioSpec(index, -1)}
              onRemove={() => onRemoveStudioSpec(index)}
            />
          </div>
        ))}
      </div>
      <StringListEditor
        errors={fieldErrors}
        field="availability"
        items={content.availability}
        onAdd={() => listActions.addStringListItem("availability")}
        onMove={(index, direction) =>
          listActions.moveStringListItem("availability", index, direction)
        }
        onRemove={(index) =>
          listActions.removeStringListItem("availability", index)
        }
        onUpdate={(index, value) =>
          listActions.updateStringList("availability", index, value)
        }
      />
      <TextAreaInput
        error={getError(fieldErrors, "contactIntro")}
        label="Contact intro"
        onChange={onContactIntroChange}
        rows={5}
        value={content.contactIntro}
      />
    </FormSection>
  );
}
