import { router } from "expo-router";

// Define known routes and patterns that exist in the app.
// This avoids attempting to navigate to non-existent screens.
const STATIC_ROUTES = new Set<string>([
  "/",
  "/orders",
  "/wallet",
  "/profile",
  "/profile/notification",
  "/profile/document",
  "/profile/change-password",
  "/profile/privacy-policy",
  "/profile/help-support",
  "/payment/methods",
]);

const DYNAMIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/orders\/[A-Za-z0-9_-]+$/, // /orders/:id
  /^\/transactions\/[A-Za-z0-9_-]+$/, // /transactions/:id
];

export function routeExists(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (STATIC_ROUTES.has(normalized)) return true;
  return DYNAMIC_ROUTE_PATTERNS.some((rx) => rx.test(normalized));
}

export function safeNavigate(path?: string | null): boolean {
  if (!path) return false;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!routeExists(normalized)) return false;
  try {
    router.push(normalized as any);
    return true;
  } catch {
    return false;
  }
}

export default { safeNavigate, routeExists };
