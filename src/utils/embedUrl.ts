export function buildEmbeddedUrl(normalizedBaseURL: string): string {
  return `${normalizedBaseURL}/embedded`;
}

export function isRealEmbeddedLoad(src: string, normalizedBaseURL: string): boolean {
  if (!src || src.startsWith('about:')) {
    return false;
  }
  try {
    const srcUrl = new URL(src, window.location.href);
    const baseUrl = new URL(normalizedBaseURL);
    // Require exact origin match
    if (srcUrl.origin !== baseUrl.origin) {
      return false;
    }
    // Accept /embedded with optional trailing slash; allow query/hash
    const normalizedPath = srcUrl.pathname.replace(/\/+$/, '');
    return normalizedPath === '/embedded';
  } catch {
    return false;
  }
}


