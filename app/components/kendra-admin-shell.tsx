"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	AudioLines,
	CircleUserRound,
	ExternalLink,
	FileText,
	Globe2,
	HardDrive,
	ListTodo,
	Users,
	type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
	getKendraAdminSectionHref,
	isKendraAdminSection,
	type KendraAdminSection,
} from "@/lib/kendra-admin-sections";
import { cn, labelText, shell } from "./ui";

const tabs: Array<{
	icon: LucideIcon;
	id: KendraAdminSection;
	label: string;
}> = [
	{ icon: AudioLines, id: "audio", label: "Audio library" },
	{ icon: FileText, id: "pages", label: "Website pages" },
	{ icon: HardDrive, id: "storage", label: "Storage" },
	{ icon: Users, id: "members", label: "Members" },
	{ icon: CircleUserRound, id: "account", label: "Account" },
];

function readActiveSection(pathname: string): KendraAdminSection | null {
	const section = pathname.split("/").filter(Boolean)[1];
	return isKendraAdminSection(section) ? section : null;
}

export function KendraAdminShell({
	children,
	tasksHref,
}: {
	children: ReactNode;
	tasksHref: string;
}) {
	const activeSection = readActiveSection(usePathname());

	return (
		<main className="min-h-screen bg-surface">
			<section className={cn(shell, "grid gap-8 py-[clamp(32px,6vw,72px)]")}>
				<header className="grid gap-5 border border-line bg-white p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
					<div className="min-w-0">
						<span className={labelText}>Kendra Studio</span>
						<h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
							Content dashboard
						</h1>
						<p className="mt-3 max-w-2xl text-ink-soft text-sm leading-6">
							Manage voice reels, website copy, media, and collaborators without
							leaving the studio.
						</p>
					</div>
					<Link
						className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white px-5 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-accent hover:text-accent"
						href="/"
						prefetch={false}
					>
						<Globe2 aria-hidden="true" className="size-4" />
						View website
					</Link>
				</header>

				<nav
					aria-label="Admin sections"
					className="flex gap-2 overflow-x-auto border-b border-line pb-3"
				>
					{tabs.map((tab) => {
						const Icon = tab.icon;

						return (
							<Link
								aria-current={activeSection === tab.id ? "page" : undefined}
								className={cn(
									"inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 text-sm font-bold uppercase tracking-[0.12em] transition",
									activeSection === tab.id
										? "border-accent text-accent"
										: "border-transparent text-ink-soft hover:text-ink",
								)}
								href={getKendraAdminSectionHref(tab.id)}
								key={tab.id}
							>
								<Icon aria-hidden="true" className="size-4" />
								{tab.label}
							</Link>
						);
					})}
					<a
						className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-accent/35 bg-accent/5 px-4 text-sm font-bold uppercase tracking-[0.12em] text-accent transition hover:border-accent"
						href={tasksHref}
						rel="noreferrer"
						target="_blank"
					>
						<ListTodo aria-hidden="true" className="size-4" />
						Tasks
						<ExternalLink aria-hidden="true" className="size-3.5" />
					</a>
				</nav>

				<div className="min-w-0" id="admin-section-content">
					{children}
				</div>
			</section>
		</main>
	);
}
