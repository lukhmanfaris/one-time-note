export function getAuthCookieName(environment: string): string {
  return environment === "production" ? "__Host-access_token" : "access_token";
}

export function getRefreshCookieName(environment: string): string {
  return environment === "production" ? "__Host-refresh_token" : "refresh_token";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getAuthCookiePattern(environment: string): RegExp {
  return new RegExp(`${escapeRegExp(getAuthCookieName(environment))}=([^;]+)`);
}

export function getRefreshCookiePattern(environment: string): RegExp {
  return new RegExp(`${escapeRegExp(getRefreshCookieName(environment))}=([^;]+)`);
}
