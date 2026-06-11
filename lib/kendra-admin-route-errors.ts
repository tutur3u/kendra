import { NextResponse } from "next/server";

type ErrorLike = {
	code?: unknown;
	debugDetails?: unknown;
	details?: unknown;
	message?: unknown;
	statusCode?: unknown;
};

type KendraAdminErrorContext = {
	details?: unknown;
	label?: string;
	step?: string;
};

const REDACTED = "[redacted]";
const SECRET_KEY_PATTERN =
	/(authorization|cookie|secret|token|apikey|api_key|accesskey|access_key|signedurl|signed_url|signature)/i;

export class KendraAdminDownstreamError extends Error {
	readonly code?: string;
	readonly details?: unknown;
	readonly statusCode: number;

	constructor(
		message: string,
		{
			code,
			details,
			statusCode,
		}: { code?: string; details?: unknown; statusCode: number },
	) {
		super(message);
		this.name = "KendraAdminDownstreamError";
		this.code = code;
		this.details = details;
		this.statusCode = statusCode;
	}
}

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

function redactDebugString(value: string) {
	if (/^https?:\/\//i.test(value) && /([?&](token|signature|x-amz|x-goog)|signed)/i.test(value)) {
		return REDACTED;
	}

	return value.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`);
}

export function sanitizeKendraAdminDebugDetails(value: unknown): unknown {
	if (typeof value === "string") {
		return redactDebugString(value);
	}

	if (typeof value !== "object" || value === null) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => sanitizeKendraAdminDebugDetails(item));
	}

	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).map(([key, item]) => [
			key,
			SECRET_KEY_PATTERN.test(key)
				? REDACTED
				: sanitizeKendraAdminDebugDetails(item),
		]),
	);
}

function readErrorLike(error: unknown): ErrorLike {
	return error && typeof error === "object" ? (error as ErrorLike) : {};
}

export function getKendraAdminErrorPayload(
	error: unknown,
	fallback = "Reel request failed",
	context: KendraAdminErrorContext = {},
) {
	const errorLike = readErrorLike(error);
	const rawMessage =
		typeof errorLike.message === "string" && errorLike.message.trim()
			? errorLike.message.trim()
			: fallback;
	const status = isValidHttpErrorStatus(errorLike.statusCode)
		? errorLike.statusCode
		: readStatusFromMessage(rawMessage) ?? 500;
	const details = sanitizeKendraAdminDebugDetails(
		context.details ?? errorLike.debugDetails ?? errorLike.details,
	);

	return {
		...(typeof errorLike.code === "string" ? { code: errorLike.code } : {}),
		...(details !== undefined ? { details } : {}),
		error: readJsonMessage(rawMessage) ?? rawMessage,
		...(context.label ? { label: context.label } : {}),
		status,
		...(context.step ? { step: context.step } : {}),
	};
}

export function createKendraAdminErrorResponse(
	error: unknown,
	fallback = "Reel request failed",
	context: KendraAdminErrorContext = {},
) {
	const payload = getKendraAdminErrorPayload(error, fallback, context);
	const body = {
		...(payload.code ? { code: payload.code } : {}),
		...(payload.details !== undefined ? { details: payload.details } : {}),
		error: payload.error,
		...(payload.label ? { label: payload.label } : {}),
		...(payload.step ? { step: payload.step } : {}),
	};

	return NextResponse.json(body, { status: payload.status });
}
