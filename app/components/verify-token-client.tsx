"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type VerificationState = "failed" | "loading" | "success";

type VerificationResponse = {
	error?: string;
	userId?: string;
	valid?: boolean;
};

function sanitizeNextPath(
	rawValue: string | null | undefined,
	requestOrigin = "http://localhost",
	fallbackPath = "/admin",
) {
	if (!rawValue?.trim() || rawValue.startsWith("//")) {
		return fallbackPath;
	}

	try {
		const parsed = new URL(rawValue, requestOrigin);

		if (parsed.origin !== requestOrigin) {
			return fallbackPath;
		}

		return `${parsed.pathname}${parsed.search}`;
	} catch {
		return fallbackPath;
	}
}

export function VerifyTokenClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [state, setState] = useState<VerificationState>("loading");
	const nextPath = useMemo(
		() =>
			sanitizeNextPath(
				searchParams.get("nextUrl"),
				typeof window === "undefined" ? "http://localhost" : window.location.origin,
				"/admin",
			),
		[searchParams],
	);

	useEffect(() => {
		let cancelled = false;

		async function verifyToken() {
			const token = searchParams.get("token");

			if (!token) {
				router.replace(nextPath);
				router.refresh();
				return;
			}

			try {
				const response = await fetch("/api/auth/verify-app-token", {
					body: JSON.stringify({ token }),
					headers: {
						"Content-Type": "application/json",
					},
					method: "POST",
				});
				const data = (await response.json().catch(() => null)) as VerificationResponse | null;

				if (!response.ok || !data?.valid || !data.userId) {
					throw new Error(data?.error || "Token verification failed.");
				}

				if (cancelled) {
					return;
				}

				setState("success");
				router.replace(nextPath);
				router.refresh();
			} catch (verificationError) {
				if (cancelled) {
					return;
				}

				setError(
					verificationError instanceof Error
						? verificationError.message
						: "Token verification failed.",
				);
				setState("failed");
			}
		}

		void verifyToken();

		return () => {
			cancelled = true;
		};
	}, [nextPath, router, searchParams]);

	if (state === "failed") {
		return (
			<>
				<div className="grid h-12 w-12 place-items-center border border-red-300/40 bg-red-500/10 text-red-200">
					!
				</div>
				<h1 className="mt-5 font-serif text-3xl italic text-white">Authentication failed</h1>
				<p className="mt-3 text-sm leading-6 text-white/64">{error}</p>
				<Link
					className="mt-6 inline-flex min-h-11 items-center justify-center border border-white bg-white px-5 text-sm font-bold uppercase tracking-[0.12em] text-ink transition hover:bg-transparent hover:text-white"
					href="/admin/login?next=library"
				>
					Sign in again
				</Link>
			</>
		);
	}

	return (
		<>
			<div className="grid h-12 w-12 place-items-center border border-white/20 bg-white/10">
				<span className="h-5 w-5 animate-spin rounded-full border border-white/30 border-t-white" />
			</div>
			<h1 className="mt-5 font-serif text-3xl italic text-white">
				{state === "success" ? "Connected" : "Connecting Kendra"}
			</h1>
			<p className="mt-3 text-sm leading-6 text-white/64">
				Finishing centralized Tuturuuu authentication.
			</p>
		</>
	);
}
