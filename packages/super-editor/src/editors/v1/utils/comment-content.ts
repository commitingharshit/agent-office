/**
 * Strips HTML tags from a comment text string using simple regex replacement.
 *
 * This is only intended for normalizing comment content that was already authored
 * within the editor. It is NOT a security sanitizer and must not be used to
 * neutralize untrusted or user-supplied HTML.
 */
export function stripHtmlToText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCommentJsonFromText(text: string): unknown[] {
  const normalized = stripHtmlToText(text);

  return [
    {
      type: 'paragraph',
      content: [
        {
          type: 'run',
          content: [
            {
              type: 'text',
              text: normalized,
            },
          ],
        },
      ],
    },
  ];
}
