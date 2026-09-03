export function validateAndNormalizeBaseURL(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid baseURL: not a parseable URL");
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[(.*)\]$/, "$1");
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  if (
    parsed.protocol !== "https:" &&
    !(isLocalhost && parsed.protocol === "http:")
  ) {
    throw new Error(
      "Invalid baseURL: must use https unless using localhost for development",
    );
  }
  if (isLocalhost) {
    if (parsed.username || parsed.password) {
      throw new Error("Invalid baseURL: must not include credentials");
    }
    if (parsed.pathname && parsed.pathname !== "/" && parsed.pathname !== "") {
      throw new Error("Invalid baseURL: must not include a path");
    }
    return parsed.origin.replace(/\/+$/, "");
  }
  const host = parsed.host.toLowerCase();
  const pattern = /^assistant\.[a-z0-9-]+\.corti\.app$/i;
  if (!pattern.test(host)) {
    throw new Error("Invalid baseURL: host must match assistant.xxx.corti.app");
  }
  if (parsed.pathname && parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new Error("Invalid baseURL: must not include a path");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Invalid baseURL: must not include credentials");
  }
  return parsed.origin.replace(/\/+$/, "");
}
