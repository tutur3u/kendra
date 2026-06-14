import { getKendraApiBaseUrl, getKendraWorkspaceId } from "./kendra-config";

export type KendraWorkspaceMemberRole = {
	id: string;
	name: string;
};

export type KendraWorkspaceMember = {
	avatarUrl: string | null;
	createdAt: string | null;
	directBoardGuest: boolean;
	displayName: string | null;
	email: string | null;
	id: string;
	isCreator: boolean;
	pending: boolean;
	roles: KendraWorkspaceMemberRole[];
	workspaceMemberType: string | null;
};

export type KendraMembersPayload = {
	invitedCount: number;
	items: KendraWorkspaceMember[];
	joinedCount: number;
	total: number;
};

export type KendraMembersState =
	| { data: KendraMembersPayload; status: "ready" }
	| { message: string; status: "unavailable" };

const unavailableMessage = "Members are not available right now.";

function readString(value: unknown) {
	return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown) {
	return typeof value === "boolean" ? value : false;
}

function readRoles(value: unknown): KendraWorkspaceMemberRole[] {
	if (!Array.isArray(value)) return [];

	return value
		.map((role) => {
			if (!role || typeof role !== "object") return null;

			const record = role as Record<string, unknown>;
			const id = readString(record.id);
			const name = readString(record.name);

			return id && name ? { id, name } : null;
		})
		.filter((role): role is KendraWorkspaceMemberRole => role !== null);
}

function normalizeMember(value: unknown): KendraWorkspaceMember | null {
	if (!value || typeof value !== "object") return null;

	const member = value as Record<string, unknown>;
	const id = readString(member.id);

	if (!id) return null;

	return {
		avatarUrl: readString(member.avatar_url),
		createdAt: readString(member.created_at),
		directBoardGuest: readBoolean(member.direct_board_guest),
		displayName: readString(member.display_name),
		email: readString(member.email),
		id,
		isCreator: readBoolean(member.is_creator),
		pending: readBoolean(member.pending),
		roles: readRoles(member.roles),
		workspaceMemberType: readString(member.workspace_member_type),
	};
}

function createPayload(items: KendraWorkspaceMember[]): KendraMembersPayload {
	return {
		invitedCount: items.filter((member) => member.pending).length,
		items,
		joinedCount: items.filter((member) => !member.pending).length,
		total: items.length,
	};
}

export async function getKendraMembers(
	accessToken: string,
): Promise<KendraMembersState> {
	try {
		const apiBaseUrl = getKendraApiBaseUrl().replace(/\/+$/, "");
		const workspaceId = getKendraWorkspaceId();
		const response = await fetch(
			`${apiBaseUrl}/workspaces/${encodeURIComponent(
				workspaceId,
			)}/external-projects/members/enhanced`,
			{
				cache: "no-store",
				headers: {
					Accept: "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);

		if (!response.ok) {
			return {
				message: unavailableMessage,
				status: "unavailable",
			};
		}

		const payload = (await response.json().catch(() => null)) as unknown;

		if (!Array.isArray(payload)) {
			return {
				message: unavailableMessage,
				status: "unavailable",
			};
		}

		return {
			data: createPayload(
				payload
					.map(normalizeMember)
					.filter((member): member is KendraWorkspaceMember => member !== null),
			),
			status: "ready",
		};
	} catch {
		return {
			message: unavailableMessage,
			status: "unavailable",
		};
	}
}
