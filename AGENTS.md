# Virtual Office — Repository Guidelines & Design Taste

Full-stack TypeScript monorepo managed with **moon** and **pnpm workspaces**:
- `apps/api`: Edge Hono API + Durable Objects (Presence Hub) + Upstash Redis running on Cloudflare Workers.
- `apps/web`: React 19 + Vite + TanStack Router & Query + PixiJS 8 (2D Canvas) + Tailwind CSS v4.
- `packages/database`: Drizzle ORM + Neon Serverless PostgreSQL.
- `packages/schemas`: Zod contracts for ephemeral presence and attendance workflows.

---

## 1. Product & Architecture Core (Brief)
1. **Privacy-first & Ephemeral by Design**:
   - Avatar coordinates (`x`, `y`) and live states (`idle | working | focus | break`) are stored **strictly in Upstash Redis** with 60s TTL and WebSocket state in Durable Objects.
   - Coordinates are **never** logged or saved into PostgreSQL.
2. **Persistent Neon PostgreSQL**:
   - Stores only account & official session data: `users`, `workspaces`, `workspace_members`, `attendance_logs`, `daily_reports`.
3. **Performance & Battery Throttling**:
   - **Canvas Ticker Throttling**: PixiJS `ticker.stop()` must fire immediately when `document.hidden === true`.
   - **Adaptive Heartbeat Rate**: WebSocket position broadcast runs at 20Hz (50ms) when tab is active; throttles down to 0.03Hz (heartbeat every 30s) when hidden or minimized.

---

## 2. Anti-AI Slop Frontend Guidelines (Taste Skill Rules)

### Zero Em-Dashes (`—`)
The `—` character is banned across all UI text, labels, documentation, and commits. Use a period, colon, or regular hyphen (`-`).

### Typography & Colors
- **No Inter default**: Use `Geist Variable` and `Geist Mono Variable`.
- **No generic AI-purple glows**: Stick to curated dark graphite bases (`#0b0f19`, `slate-950`) with singular purposeful accents (emerald for active, indigo for focus, amber for break).
- **Single theme lock**: Dark palette throughout; no random light sections sandwiched in between.

### Haptic Micro-Aesthetics
- **Nested Bezel (Doppelrand)**: Critical floating panels use an outer shell with hairline border (`border-slate-700/60`, `bg-slate-900/85 backdrop-blur-xl`) and an inner active core.
- **Island Pill Dock**: Floating pill navbars detached from edges, rounded-full with spring tactile feedback (`active:scale-[0.98]`).
- **No Hand-Rolled SVG icons**: Use `@phosphor-icons/react` with consistent weights (`regular` or `bold`).
- **Hero & Canvas Viewport**: Always use `min-h-[100dvh]` rather than `h-screen` to prevent mobile address bar jumping.

---

## 3. Tooling & Moon Commands
- `moon run :check`: Biome linter and format verification.
- `moon run :format`: Automatically format files with Biome.
- `moon run :build`: Type-check and build all apps and packages.
- `moon run :test`: Execute Vitest test suites.
- `pnpm dev`: Run services concurrently.
