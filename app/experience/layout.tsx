import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Experience",
	description:
		"Kendra Braun voice acting credits, commercial and corporate clients, character work, training, and resume.",
};

export default function ExperienceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
