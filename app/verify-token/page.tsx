import { Suspense } from "react";
import { VerifyTokenClient } from "../components/verify-token-client";

function VerifyTokenFallback() {
	return (
		<>
			<div className="grid h-12 w-12 place-items-center border border-white/20 bg-white/10">
				<span className="h-5 w-5 animate-spin rounded-full border border-white/30 border-t-white" />
			</div>
			<h1 className="mt-5 font-serif text-3xl italic text-white">Connecting Kendra</h1>
			<p className="mt-3 text-sm leading-6 text-white/64">
				Finishing centralized Tuturuuu authentication.
			</p>
		</>
	);
}

export default function VerifyTokenPage() {
	return (
		<main className="grid min-h-screen place-items-center bg-ink px-6 text-white">
			<section className="w-full max-w-md border border-white/12 bg-white/[0.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
				<Suspense fallback={<VerifyTokenFallback />}>
					<VerifyTokenClient />
				</Suspense>
			</section>
		</main>
	);
}
