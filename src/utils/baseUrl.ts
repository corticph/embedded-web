export function validateAndNormalizeBaseURL(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid baseURL: not a parseable URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Invalid baseURL: must use https');
  }
  const host = parsed.host.toLowerCase();
  const pattern = /^assistant\.[a-z0-9-]+\.corti\.app$/i;
  if (!pattern.test(host)) {
    throw new Error('Invalid baseURL: host must match assistant.xxx.corti.app');
  }
  if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new Error('Invalid baseURL: must not include a path');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Invalid baseURL: must not include credentials');
  }
  return parsed.origin.replace(/\/+$/, '');
}


