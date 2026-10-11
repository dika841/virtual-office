import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<div className="relative min-h-dvh w-full bg-surface text-ink antialiased select-none">
			<Outlet />
		</div>
	);
}
