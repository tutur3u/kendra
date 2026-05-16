import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Home Studio",
	description:
		"Kendra Braun's Source-Connect ready Alberta home studio specs, microphone, treatment, live direction, and travel availability.",
};

export default function HomeStudioLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
