export const MAX_SITE_IMAGE_FILE_BYTES = 12 * 1024 * 1024;

const validImageExtensionPattern = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

export function isKendraSiteImageFieldKey(value: string) {
  return (
    value === "site.heroImage" ||
    value === "site.clientProofImage" ||
    /^clientLogos\.\d+\.image$/.test(value) ||
    /^experienceGroups\.\d+\.items\.\d+\.visual\.image$/.test(value)
  );
}

export function isKendraSiteImageFileDescriptor({
  contentType,
  filename,
}: {
  contentType?: string | null;
  filename: string;
}) {
  const type = contentType?.toLowerCase().trim() ?? "";
  return type.startsWith("image/") || validImageExtensionPattern.test(filename);
}

export function readKendraSiteImageSize(value: unknown) {
  const size = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(size) && size > 0 ? size : null;
}

function safeFilenameSegment(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return normalized || fallback;
}

function getFilenameExtension(filename: string) {
  const match = filename.match(/(\.[a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "";
}

export function prepareKendraSiteImageFilename(
  fieldKey: string,
  filename: string,
) {
  const fieldSegment = safeFilenameSegment(
    fieldKey.replace(/\./g, "-"),
    "image",
  );
  const extension = getFilenameExtension(filename);
  const base = safeFilenameSegment(
    extension ? filename.slice(0, -extension.length) : filename,
    "upload",
  );

  return `${fieldSegment}-${base}${extension}`;
}
