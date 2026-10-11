import { defineConfig } from "drizzle-kit";

try {
	process.loadEnvFile?.("../../.env");
} catch {
	// Root .env not found or already loaded into environment
}

export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url:
			process.env.DATABASE_URL ??
			"postgres://postgres:postgres@db.localtest.me:5434/virtual_office",
	},
});
