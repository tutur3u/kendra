import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { SmoothScroll } from "./components/smooth-scroll";
import { site } from "./content";
import { getKendraAppBaseUrl } from "@/lib/kendra-config";

const bodyClassName = "relative isolate min-h-full overflow-x-hidden bg-white font-sans text-ink selection:bg-accent selection:text-white";

function SiteHeaderFallback() {
	return (
		<div
			aria-hidden="true"
			className="h-16 border-line border-b bg-white sm:h-20"
		/>
	);
}

export const metadata: Metadata = {
	metadataBase: new URL(getKendraAppBaseUrl()),
	title: {
		default: site.title,
		template: `%s | ${site.name}`,
	},
	description:
		"Remote and international voice actor Kendra Braun for commercials, animation, ADR, video games, narration, and Source-Connect Standard equipped home studio sessions.",
	openGraph: {
		title: site.title,
		description: "Remote & International Voice Actor based in Alberta, Canada.",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full scroll-smooth bg-background text-foreground">
			<body className={bodyClassName}>
				<SmoothScroll>
					<Suspense fallback={<SiteHeaderFallback />}>
						<SiteHeader />
					</Suspense>
					{children}
					<SiteFooter />
				</SmoothScroll>
				<Toaster richColors position="bottom-right" />
				<Analytics />
			</body>
		</html>
	);
}
