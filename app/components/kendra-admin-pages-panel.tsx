"use client";

import { useCallback, useEffect, useState } from "react";
import type { KendraEditableSiteContent } from "@/lib/kendra-admin-site-content-model";
import { adminFetch } from "./kendra-admin-session-client";
import { KendraAdminSiteContentForm } from "./kendra-admin-site-content-form";
import { labelText } from "./ui";

type SiteContentResponse = {
	content?: KendraEditableSiteContent;
	error?: string;
};

function isSiteContentPayload(value: unknown): value is KendraEditableSiteContent {
	return Boolean(value && typeof value === "object");
}

function PagesLoadingPanel() {
	return (
		<section className="border border-line bg-white p-6">
			<span className={labelText}>Pages</span>
			<div className="mt-4 flex items-center gap-3 text-ink-soft text-sm">
				<span
					aria-hidden="true"
					className="h-5 w-5 animate-[slow-spin_700ms_linear_infinite] rounded-full border-2 border-accent/25 border-t-accent"
				/>
				<span>Loading page editor...</span>
			</div>
		</section>
	);
}

export function KendraAdminPagesPanel() {
	const [content, setContent] = useState<KendraEditableSiteContent | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState<string | null>(null);

	const loadContent = useCallback(async () => {
		setLoading(true);
		setMessage(null);

		try {
			const response = await adminFetch("/api/admin/site-content", {
				cache: "no-store",
			});
			const payload = (await response
				.json()
				.catch(() => null)) as SiteContentResponse | null;

			if (!response.ok || !isSiteContentPayload(payload?.content)) {
				setMessage(payload?.error ?? "Page content is not available right now.");
				return;
			}

			setContent(payload.content);
		} catch {
			setMessage("Page content is not available right now.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadContent();
	}, [loadContent]);

	if (loading && !content) {
		return <PagesLoadingPanel />;
	}

	if (!content) {
		return (
			<section className="border border-line bg-white p-6">
				<span className={labelText}>Pages</span>
				<h2 className="mt-3 text-3xl font-semibold text-ink">
					Page editor is unavailable
				</h2>
				<p className="mt-3 max-w-2xl text-ink-soft text-sm">
					{message ?? "Page content is not available right now."}
				</p>
				<button
					className="mt-5 min-h-11 border border-ink bg-ink px-6 font-bold text-white text-sm uppercase tracking-[0.1em] transition hover:bg-accent disabled:opacity-50"
					disabled={loading}
					onClick={() => void loadContent()}
					type="button"
				>
					Retry
				</button>
			</section>
		);
	}

	return (
		<KendraAdminSiteContentForm
			initialContent={content}
			onSaved={(savedContent) => setContent(savedContent)}
		/>
	);
}
