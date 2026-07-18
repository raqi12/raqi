export const CONTENT_PAGE_SLUGS = ['privacy', 'instructions'] as const;

export type ContentPageSlug = (typeof CONTENT_PAGE_SLUGS)[number];

export function isContentPageSlug(value: string): value is ContentPageSlug {
  return (CONTENT_PAGE_SLUGS as readonly string[]).includes(value);
}
