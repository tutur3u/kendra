"use client";

import { useId, useRef } from "react";
import { FieldError } from "./kendra-admin-reel-form-fields";
import { secondaryButton } from "./kendra-admin-site-content-fields";
import { cn } from "./ui";

export type SiteImageUploadState = {
  error?: string;
  label: string;
  previewUrl?: string;
  status: "idle" | "preparing" | "uploading" | "finalizing" | "ready" | "error";
};

export type SiteImageUploadRequest = {
  fieldKey: string;
  file: File;
  label: string;
  onUploaded: (value: string) => void;
};

function getStatusText(state?: SiteImageUploadState) {
  if (!state) return null;

  if (state.status === "preparing") return "Preparing upload";
  if (state.status === "uploading") return "Uploading image";
  if (state.status === "finalizing") return "Saving image";
  if (state.status === "ready") return "Image ready";
  if (state.status === "error") return state.error ?? "Image upload failed.";
  return null;
}

export function SiteImageField({
  error,
  fieldKey,
  label,
  onUpload,
  onUploaded,
  previewAlt,
  uploadState,
  value,
}: {
  error?: string;
  fieldKey: string;
  label: string;
  onUpload: (request: SiteImageUploadRequest) => void;
  onUploaded: (value: string) => void;
  previewAlt?: string;
  uploadState?: SiteImageUploadState;
  value: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy =
    uploadState?.status === "preparing" ||
    uploadState?.status === "uploading" ||
    uploadState?.status === "finalizing";
  const previewSrc = uploadState?.previewUrl || value;
  const statusText = getStatusText(uploadState);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft"
          htmlFor={inputId}
        >
          {label}
        </label>
        <button
          className={secondaryButton}
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isBusy ? "Replacing" : "Replace image"}
        </button>
      </div>
      <div
        className={cn(
          "grid gap-3 border bg-white p-3",
          error || uploadState?.status === "error"
            ? "border-coral"
            : "border-line",
        )}
      >
        <div className="relative aspect-[16/9] overflow-hidden border border-line bg-surface">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- Admin previews must support temporary blob URLs before upload finalization.
            <img
              alt={previewAlt || `${label} preview`}
              className="h-full w-full object-contain"
              src={previewSrc}
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-ink-soft text-sm">
              No image selected.
            </div>
          )}
          {isBusy ? (
            <div className="absolute inset-0 grid place-items-center bg-white/70">
              <span
                aria-hidden="true"
                className="h-6 w-6 animate-[slow-spin_700ms_linear_infinite] rounded-full border-2 border-accent/25 border-t-accent"
              />
            </div>
          ) : null}
        </div>
        <div className="grid gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-soft">
            Current image
          </span>
          <code className="break-all border border-line bg-surface px-2 py-2 text-ink-soft text-xs">
            {value || "No image path saved yet."}
          </code>
        </div>
        {statusText ? (
          <p
            aria-live="polite"
            className={cn(
              "text-sm",
              uploadState?.status === "error" ? "text-coral" : "text-ink-soft",
            )}
          >
            {statusText}
          </p>
        ) : null}
      </div>
      <input
        accept="image/*"
        className="sr-only"
        id={inputId}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";

          if (!file) return;

          onUpload({
            fieldKey,
            file,
            label,
            onUploaded,
          });
        }}
        ref={inputRef}
        type="file"
      />
      <FieldError message={error} />
    </div>
  );
}
