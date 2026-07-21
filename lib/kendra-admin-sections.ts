export const KENDRA_ADMIN_SECTIONS = [
	"audio",
	"pages",
	"storage",
	"members",
	"account",
] as const;

export type KendraAdminSection = (typeof KENDRA_ADMIN_SECTIONS)[number];

export function isKendraAdminSection(
	value: string | null | undefined,
): value is KendraAdminSection {
	return KENDRA_ADMIN_SECTIONS.includes(value as KendraAdminSection);
}

export function getKendraAdminSectionHref(section: KendraAdminSection) {
	return `/admin/${section}`;
}
