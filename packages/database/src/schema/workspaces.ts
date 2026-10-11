import {
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId, ID_PREFIX } from "../ids.ts";
import { users } from "./users.ts";

export const workspaces = pgTable("workspaces", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId(ID_PREFIX.workspace)),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	ownerId: text("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const workspaceRole = pgEnum("workspace_role", [
	"owner",
	"admin",
	"member",
]);

export const workspaceMembers = pgTable(
	"workspace_members",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId(ID_PREFIX.member)),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: workspaceRole("role").notNull().default("member"),
		/** Desk id from the tilemap. Clock-in pathfinds the avatar here. */
		assignedDeskId: text("assigned_desk_id"),
	},
	(table) => [
		uniqueIndex("workspace_members_workspace_user_idx").on(
			table.workspaceId,
			table.userId,
		),
	],
);

export type TWorkspace = typeof workspaces.$inferSelect;
export type TWorkspaceMember = typeof workspaceMembers.$inferSelect;
