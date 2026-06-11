import type {
	KendraReelMutationProgress,
} from "./kendra-admin-reels";
import type { KendraAdminReel } from "./kendra-admin-reel-model";
import { getKendraAdminErrorPayload } from "./kendra-admin-route-errors";

type MutationResult = {
	reel: KendraAdminReel | null;
	reels: KendraAdminReel[];
};

type StreamEvent =
	| (KendraReelMutationProgress & { type: "progress" })
	| {
			label: string;
			percent: 100;
			reel: KendraAdminReel | null;
			reels: KendraAdminReel[];
			step: "done";
			type: "result";
	  }
	| {
			code?: string;
			details?: unknown;
			error: string;
			label?: string;
			percent: number;
			status: number;
			step?: string;
			type: "error";
	  };

const encoder = new TextEncoder();

function encodeEvent(event: StreamEvent) {
	return encoder.encode(`${JSON.stringify(event)}\n`);
}

export function createKendraReelMutationStream({
	fallback,
	run,
}: {
	fallback: string;
	run: (
		onProgress: (progress: KendraReelMutationProgress) => void,
	) => Promise<MutationResult>;
}) {
	let latestProgress: KendraReelMutationProgress | null = null;

	const stream = new ReadableStream({
		async start(controller) {
			const send = (event: StreamEvent) => controller.enqueue(encodeEvent(event));

			try {
				const result = await run((progress) => {
					latestProgress = progress;
					send({ ...progress, type: "progress" });
				});

				send({
					label: "Saved",
					percent: 100,
					reel: result.reel,
					reels: result.reels,
					step: "done",
					type: "result",
				});
			} catch (error) {
				const payload = getKendraAdminErrorPayload(error, fallback, {
					label: latestProgress?.label,
					step: latestProgress?.step,
				});

				send({
					...(payload.code ? { code: payload.code } : {}),
					...(payload.details !== undefined ? { details: payload.details } : {}),
					error: payload.error,
					...(payload.label ? { label: payload.label } : {}),
					percent: latestProgress?.percent ?? 100,
					status: payload.status,
					...(payload.step ? { step: payload.step } : {}),
					type: "error",
				});
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "application/x-ndjson; charset=utf-8",
		},
	});
}
