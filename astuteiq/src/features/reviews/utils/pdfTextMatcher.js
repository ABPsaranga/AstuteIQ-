/**
 * Maps findings to simulated highlight positions on PDF pages.
 * In production, this would use pdf.js text layer to match excerpts.
 */
export function mapFindingsToHighlights(findings) {
    const highlights = [];
    findings.forEach((finding) => {
        finding.pages.forEach((page, idx) => {
            // Spread highlights so they don't stack
            const offset = idx * 15;
            highlights.push({
                page,
                top: 15 + offset + Math.random() * 10,
                left: 5,
                width: 90,
                height: 8,
                finding,
            });
        });
    });
    return highlights;
}
/**
 * Groups highlights by page number for the PDF viewer.
 */
export function groupHighlightsByPage(highlights) {
    const map = new Map();
    for (const h of highlights) {
        const existing = map.get(h.page) ?? [];
        map.set(h.page, [...existing, h]);
    }
    return map;
}
