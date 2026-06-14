import { HomeStudioClient } from "../components/home-studio-client";
import { getKendraContent } from "@/lib/kendra-delivery";

export default async function HomeStudioPage() {
	const content = await getKendraContent();

	return <HomeStudioClient content={content} />;
}
