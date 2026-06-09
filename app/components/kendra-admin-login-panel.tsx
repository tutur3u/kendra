import Link from "next/link";
import Image from "next/image";
import { cn, labelText, shell } from "./ui";

const TUTURUUU_LOGO_URL = "https://tuturuuu.com/media/logos/transparent.png";

export function KendraAdminLoginPanel({ loginHref }: { loginHref: string }) {
	return (
		<main className="min-h-screen bg-surface">
			<section className={cn(shell, "grid gap-8 py-[clamp(32px,6vw,72px)]")}>
				<header className="border-b border-line pb-6">
					<h1 className="text-3xl font-semibold text-ink">Admin Dashboard</h1>
				</header>

				<section className="border border-line bg-white p-6 sm:p-8">
					<span className={labelText}>Admin access</span>
					<div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_auto] lg:items-end">
						<div className="max-w-2xl">
							<div className="flex items-center gap-3">
								<span className="grid size-14 place-items-center border border-line bg-surface p-2">
									<Image
										alt="Tuturuuu logo"
										className="h-auto w-10"
										height={40}
										src={TUTURUUU_LOGO_URL}
										unoptimized
										width={40}
									/>
								</span>
								<span className="text-sm font-bold uppercase tracking-[0.18em] text-ink-soft">
									Tuturuuu
								</span>
							</div>
							<h2 className="mt-5 text-3xl font-semibold text-ink">
								Login with Tuturuuu
							</h2>
							<p className="mt-3 text-ink-soft text-sm">
								Use your Tuturuuu account to open the admin dashboard.
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
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
					</div>
				</section>
			</section>
		</main>
	);
}
