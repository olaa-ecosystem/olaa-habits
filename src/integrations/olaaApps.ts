/**
 * Links to the other Olaa apps. Apps never touch each other's data (platform DEPENDENCY_MAP):
 * Habits opens Language and Olaa Note by URL and reads Language events through Firestore.
 */
const env = import.meta.env;

function withSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export const LANGUAGE_URL = withSlash(
  env.VITE_OLAA_LANGUAGE_URL || 'https://olaa-language.web.app/',
);
export const TAKENOTE_URL = withSlash(
  env.VITE_OLAA_TAKENOTE_URL || 'https://olaa-takenote.web.app/',
);

/**
 * Accept a link to Olaa Note (a notebook like `…/#/nb/<id>/1`, or the app itself). Other
 * addresses are refused, so a habit cannot hold a link to an unknown site.
 */
export function normalizeNoteLink(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const base = new URL(TAKENOTE_URL);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;
  if (url.origin !== base.origin && url.hostname !== 'localhost') return null;
  return url.toString();
}

/** The notebook link if it is an Olaa Note notebook, else the app's home. */
export function noteHref(link: string | null): string {
  return (link && normalizeNoteLink(link)) || TAKENOTE_URL;
}
