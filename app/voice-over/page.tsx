import type { Metadata } from "next";
import { VoiceOverClient } from "../components/voice-over-client";
import { getKendraContent } from "@/lib/kendra-delivery";

export const metadata: Metadata = {
	title: "Voice Over",
	description:
		"Listen to Kendra Braun voice-over reels, studio capability, download links, and booking information.",
};

export default async function VoiceOverPage() {
	const content = await getKendraContent();

	return <VoiceOverClient content={content} />;
}
