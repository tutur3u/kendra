import type { KendraEditableSiteContent } from "./kendra-admin-site-content-model";

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

function normalizeImageReference(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function collectKendraSiteImageReferences(
  content: KendraEditableSiteContent,
) {
  const references = new Set<string>();
  const add = (value: string | null | undefined) => {
    const normalized = normalizeImageReference(value);
    if (normalized) references.add(normalized);
  };

  add(content.site.heroImage);
  add(content.site.clientProofImage);

  for (const logo of content.clientLogos) {
    add(logo.image);
  }

  for (const group of content.experienceGroups) {
    for (const item of group.items) {
      add(
        typeof item.visual?.image === "string" ? item.visual.image : undefined,
      );
    }
  }

  return references;
}

export type KendraPendingSiteImageRemoval = {
  fieldKey: string;
  value: string;
};

export function getUnusedKendraSiteImageRemovals(
  content: KendraEditableSiteContent,
  removals: KendraPendingSiteImageRemoval[],
) {
  const references = collectKendraSiteImageReferences(content);

  return removals.filter((item, index, items) => {
    const normalized = normalizeImageReference(item.value);

    return (
      Boolean(normalized) &&
      !references.has(normalized) &&
      items.findIndex(
        (candidate) =>
          normalizeImageReference(candidate.value) === normalized,
      ) === index
    );
  });
}

export type KendraSiteImageAssetReference =
  | {
      assetId: string;
      kind: "asset";
      workspaceId: string;
    }
  | {
      kind: "cross-workspace";
      workspaceId: string;
    }
  | {
      kind: "none";
    };

export function parseKendraSiteImageAssetReference(
  value: string,
  {
    apiBaseUrl,
    workspaceId,
  }: {
    apiBaseUrl: string;
    workspaceId: string;
  },
): KendraSiteImageAssetReference {
  const normalized = normalizeImageReference(value);
  if (!normalized) return { kind: "none" };

  let pathname = "";

  try {
    if (normalized.startsWith("/")) {
      pathname = new URL(normalized, "https://kendra.local").pathname;
    } else {
      const parsed = new URL(normalized);
      const apiBase = new URL(apiBaseUrl);

      if (parsed.origin !== apiBase.origin) {
        return { kind: "none" };
      }

      pathname = parsed.pathname;
    }
  } catch {
    return { kind: "none" };
  }

  const match = pathname.match(
    /^\/api\/v1\/workspaces\/([^/]+)\/external-projects\/assets\/([^/]+)\/?$/u,
  );

  if (!match) {
    return { kind: "none" };
  }

  const referencedWorkspaceId = decodeURIComponent(match[1] ?? "");
  const assetId = decodeURIComponent(match[2] ?? "");

  if (!referencedWorkspaceId || !assetId) {
    return { kind: "none" };
  }

  if (referencedWorkspaceId !== workspaceId) {
    return { kind: "cross-workspace", workspaceId: referencedWorkspaceId };
  }

  return { assetId, kind: "asset", workspaceId: referencedWorkspaceId };
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
