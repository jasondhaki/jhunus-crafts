/**
 * Serializes a value for embedding in a `<script type="application/ld+json">`
 * tag. Plain `JSON.stringify` is not safe here: if a field (product title,
 * description, ...) ever contained the literal substring `</script>`, the
 * HTML parser would close the script tag early and treat whatever follows
 * as real markup — a classic JSON-LD XSS vector. Escaping every `<` as
 * its unicode form keeps the JSON semantically identical while making
 * that impossible.
 */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
