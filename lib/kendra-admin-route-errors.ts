import { NextResponse } from "next/server";

type ErrorLike = {
	message?: unknown;
	statusCode?: unknown;
};

function isValidHttpErrorStatus(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value >= 400 &&
		value <= 599
	);
}

function readStatusFromMessage(message: string) {
	const match = message.match(/(?:^HTTP |\()([45]\d\d)(?::|\))/);
	const status = match?.[1] ? Number(match[1]) : null;

	return isValidHttpErrorStatus(status) ? status : null;
}

function readJsonMessage(message: string) {
	const start = message.indexOf("{");
	if (start === -1) return null;

	try {
		const payload = JSON.parse(message.slice(start)) as {
			error?: unknown;
			message?: unknown;
		};
		return typeof payload.message === "string"
			? payload.message
			: typeof payload.error === "string"
				? payload.error
				: null;
	} catch {
		return null;
	}
}

function readErrorLike(error: unknown): ErrorLike {
	return error && typeof error === "object" ? (error as ErrorLike) : {};
}

export function getKendraAdminErrorPayload(
	error: unknown,
	fallback = "Reel request failed",
) {
	const errorLike = readErrorLike(error);
	const rawMessage =
		typeof errorLike.message === "string" && errorLike.message.trim()
			? errorLike.message.trim()
			: fallback;
	const status = isValidHttpErrorStatus(errorLike.statusCode)
		? errorLike.statusCode
		: readStatusFromMessage(rawMessage) ?? 500;

	return {
		error: readJsonMessage(rawMessage) ?? rawMessage,
		status,
	};
}

export function createKendraAdminErrorResponse(
	error: unknown,
	fallback = "Reel request failed",
) {
	const payload = getKendraAdminErrorPayload(error, fallback);

	return NextResponse.json({ error: payload.error }, { status: payload.status });
}
