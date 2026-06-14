import { ExperienceClient } from "../components/experience-client";
import { getKendraContent } from "@/lib/kendra-delivery";

export default async function ExperiencePage() {
	const content = await getKendraContent();

	return <ExperienceClient content={content} />;
}
