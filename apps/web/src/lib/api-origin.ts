/** Empty in dev (Vite proxy), the deployed API origin in production. */
export const getApiOrigin = (): string =>
	import.meta.env.VITE_API_URL || window.location.origin;
