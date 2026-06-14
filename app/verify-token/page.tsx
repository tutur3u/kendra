import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sanitizeKendraNextPath } from "@/lib/kendra-config";

function getRequestOrigin(headersList: Headers) {
	const host = headersList.get("x-forwarded-host") ?? headersList.get("host");

	if (!host) {
		return "http://localhost";
	}

	const protocol =
		headersList.get("x-forwarded-proto") ??
		(host.startsWith("localhost") || host.startsWith("127.0.0.1")
			? "http"
			: "https");

	return `${protocol}://${host}`;
}

function getCallbackPath({
	nextUrl,
	token,
}: {
	nextUrl: string;
	token: string;
}) {
	const params = new URLSearchParams();
	params.set("token", token);
	params.set("nextUrl", nextUrl);
	return `/api/auth/verify-app-token?${params.toString()}`;
}

function VerifyTokenFailure({ error }: { error: string }) {
	return (
		<>
			<div className="grid h-12 w-12 place-items-center border border-red-300/40 bg-red-500/10 text-red-200">
				!
			</div>
			<h1 className="mt-5 font-serif text-3xl italic text-white">
				Authentication failed
			</h1>
			<p className="mt-3 text-sm leading-6 text-white/64">{error}</p>
			<Link
				className="mt-6 inline-flex min-h-11 items-center justify-center border border-white bg-white px-5 text-sm font-bold uppercase tracking-[0.12em] text-ink transition hover:bg-transparent hover:text-white"
				href="/admin/login?next=dashboard"
			>
				Sign in again
			</Link>
		</>
	);
}

export default async function VerifyTokenPage({
	searchParams,
}: {
	searchParams: Promise<{
		error?: string;
		nextUrl?: string;
		status?: string;
		token?: string;
	}>;
}) {
	const params = await searchParams;
	const origin = getRequestOrigin(await headers());
	const nextPath = sanitizeKendraNextPath(params.nextUrl, origin, "/admin");
	const token = params.token?.trim();

	if (token) {
		redirect(getCallbackPath({ nextUrl: nextPath, token }));
	}

	if (!params.error) {
		redirect(nextPath);
	}

	return (
		<main className="grid min-h-screen place-items-center bg-ink px-6 text-white">
			<section className="w-full max-w-md border border-white/12 bg-white/[0.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
				<VerifyTokenFailure error={params.error} />
			</section>
		</main>
	);
}
