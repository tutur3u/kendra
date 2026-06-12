"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshKendraAdminSession } from "./kendra-admin-session-client";
import { labelText } from "./ui";

export function KendraAdminSessionRestorer({ loginHref }: { loginHref: string }) {
	const router = useRouter();
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function restoreSession() {
			const payload = await refreshKendraAdminSession();

			if (cancelled) return;

			if (payload?.valid) {
				router.refresh();
				return;
			}

			setFailed(true);
		}

		void restoreSession();

		return () => {
			cancelled = true;
		};
	}, [router]);

	return (
		<main className="grid min-h-[calc(100vh-96px)] place-items-center bg-surface px-5 py-12">
			<section className="w-full max-w-[420px] border border-line bg-white p-6 text-center shadow-[0_18px_56px_rgba(10,10,10,0.06)] sm:p-8">
				<span className={labelText}>Admin access</span>
				<h1 className="mt-3 text-3xl font-semibold text-ink">
					{failed ? "Login expired" : "Restoring session"}
				</h1>
				<p className="mx-auto mt-3 max-w-[300px] text-ink-soft text-sm">
					{failed
						? "Your Tuturuuu session could not be refreshed. Login again to continue managing reels."
						: "Refreshing your admin access before opening the dashboard."}
				</p>
				{failed ? (
					<Link
						className="mt-6 inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent"
						href={loginHref}
					>
						Login with Tuturuuu
					</Link>
				) : (
					<div className="mx-auto mt-6 grid w-full max-w-[220px] gap-2" aria-hidden="true">
						<span className="h-2 animate-pulse bg-line" />
						<span className="h-2 animate-pulse bg-line [animation-delay:120ms]" />
						<span className="h-2 animate-pulse bg-line [animation-delay:240ms]" />
					</div>
				)}
			</section>
		</main>
	);
}
