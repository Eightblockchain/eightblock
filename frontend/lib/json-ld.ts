/** Serialises structured data for an inline script; `<` is escaped so text cannot close the tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
