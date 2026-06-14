import { ContactClient } from "../components/contact-client";
import { getKendraContent } from "@/lib/kendra-delivery";

export default async function ContactPage() {
	const content = await getKendraContent();

	return <ContactClient content={content} />;
}
