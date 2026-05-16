import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Contact",
	description:
		"Contact Kendra Braun for voiceover bookings, quotes, Source-Connect sessions, Alberta studio work, and remote VO projects.",
};

export default function ContactLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
