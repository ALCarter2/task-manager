/**
 * Strips all HTML except <strong>, <em>, and <u> from a task title.
 * Also normalises browser-generated <b> and <i> to their semantic equivalents.
 * Safe to pass to dangerouslySetInnerHTML.
 */
export function sanitizeTitle(html: string): string {
  return html
    .replace(/<b(\s[^>]*)?>/gi, '<strong>')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<i(\s[^>]*)?>/gi, '<em>')
    .replace(/<\/i>/gi, '</em>')
    .replace(/<(?!\/?(?:strong|em|u)\b)[^>]*>/gi, '')
    .trim();
}

/** Strip all HTML to get plain text (for empty-check, aria-label, etc.) */
export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}
