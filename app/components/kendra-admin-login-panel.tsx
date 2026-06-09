import Link from "next/link";
import Image from "next/image";
import { labelText } from "./ui";

const TUTURUUU_LOGO_URL = "/media/logos/tuturuuu.png";

export function KendraAdminLoginPanel({ loginHref }: { loginHref: string }) {
	return (
		<main className="grid min-h-[calc(100vh-96px)] place-items-center bg-surface px-5 py-12">
			<section className="w-full max-w-[420px] border border-line bg-white p-6 text-center shadow-[0_18px_56px_rgba(10,10,10,0.06)] sm:p-8">
				<Image
					alt="Tuturuuu logo"
					className="mx-auto h-auto w-16"
					height={64}
					priority
					src={TUTURUUU_LOGO_URL}
					width={64}
				/>
				<span className={`${labelText} mt-5 block`}>Admin access</span>
				<h1 className="mt-3 text-3xl font-semibold text-ink">
					Login with Tuturuuu
				</h1>
				<p className="mx-auto mt-3 max-w-[280px] text-ink-soft text-sm">
					Use your Tuturuuu account to open the admin dashboard.
				</p>
				<div className="mt-6 grid gap-3">
					<a
						className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-accent"
						href={loginHref}
					>
						Login with Tuturuuu
					</a>
					<Link
						className="inline-flex min-h-11 items-center justify-center border border-line bg-white px-6 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent"
						href="/"
					>
						Back to site
					</Link>
				</div>
			</section>
		</main>
	);
}
