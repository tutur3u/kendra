import { HomeClient } from "./components/home-client";
import { getKendraContent } from "@/lib/kendra-delivery";

export default async function Home() {
	const content = await getKendraContent();

	return <HomeClient content={content} />;
}
