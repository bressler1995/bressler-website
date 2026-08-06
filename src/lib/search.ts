/**
 * Search types and ranking.
 *
 * Deliberately pure and free of Astro imports: this runs inside React islands
 * in the browser, where `astro:content` doesn't exist. The index is built at
 * build time by `search-index.ts` and handed in as a prop.
 *
 * Shared between the spotlight dialog and the /search page. The dialog shows
 * the top few and offers "see all"; if the two used different matching, that
 * link would lead somewhere that didn't contain what the user was already
 * looking at. One function, one ranking, one set of results.
 */

export type SearchSection = 'Pages' | 'Blog' | 'Projects';

export type SearchEntry = {
	title: string;
	href: string;
	section: SearchSection;
	description: string;
	/** Extra terms that should match but don't appear in the title or blurb. */
	keywords?: string[];
};

/** How many results the spotlight shows before deferring to the full page. */
export const SPOTLIGHT_LIMIT = 10;

/**
 * Scores one entry against one already-lowercased term. 0 means no match,
 * which excludes the entry entirely — every term has to hit something.
 *
 * The tiers matter more than their absolute values: a title match should
 * always outrank a description match, so that typing "blog" puts the Blog page
 * above the posts whose blurbs happen to mention it.
 */
function scoreTerm(entry: SearchEntry, term: string): number {
	const title = entry.title.toLowerCase();
	if (title === term) return 100;
	if (title.startsWith(term)) return 80;
	if (title.includes(term)) return 60;

	if (entry.keywords?.some((k) => k.toLowerCase().includes(term))) return 40;
	if (entry.description.toLowerCase().includes(term)) return 20;
	if (entry.section.toLowerCase().includes(term)) return 10;
	return 0;
}

/**
 * Ranked matches for a query. An empty query returns the whole index in its
 * natural order, which is what the spotlight wants on open — pages first,
 * rather than an empty panel.
 */
export function searchEntries(
	index: SearchEntry[],
	query: string,
	limit?: number
): SearchEntry[] {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

	let results: SearchEntry[];
	if (terms.length === 0) {
		results = index;
	} else {
		const scored: { entry: SearchEntry; score: number }[] = [];
		for (const entry of index) {
			let total = 0;
			// Every term must match something, so "design tokens" doesn't return
			// everything that merely mentions design.
			const matchedAll = terms.every((term) => {
				const s = scoreTerm(entry, term);
				total += s;
				return s > 0;
			});
			if (matchedAll) scored.push({ entry, score: total });
		}
		// Stable within a score band: sort() is stable in modern engines, so
		// equal-scoring entries keep index order rather than shuffling per keystroke.
		scored.sort((a, b) => b.score - a.score);
		results = scored.map((s) => s.entry);
	}

	return limit === undefined ? results : results.slice(0, limit);
}
