import * as React from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { searchEntries, type SearchEntry } from '@/lib/search';

/**
 * Full results for /search. Same index and ranking as the spotlight, without
 * the cap — this is where "see all results" lands, so it has to be a superset
 * of what the dialog was showing.
 *
 * The query is seeded from ?q= and kept in the URL as it changes, so a search
 * can be linked, bookmarked and reloaded. History is replaced rather than
 * pushed: typing eight characters should not cost eight presses of Back.
 */
export function SearchResults({ index }: { index: SearchEntry[] }) {
	const [query, setQuery] = React.useState('');

	// Read the initial query after mount rather than during render — this
	// component is prerendered to static HTML, where there is no location.
	React.useEffect(() => {
		const q = new URLSearchParams(window.location.search).get('q') ?? '';
		setQuery(q);
	}, []);

	React.useEffect(() => {
		const url = new URL(window.location.href);
		const trimmed = query.trim();
		if (trimmed) url.searchParams.set('q', trimmed);
		else url.searchParams.delete('q');
		window.history.replaceState({}, '', url);
	}, [query]);

	const results = searchEntries(index, query);

	return (
		<>
			<div className="relative mt-8 max-w-xl">
				<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					autoFocus
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search pages, posts and projects…"
					aria-label="Search"
					className="pl-9"
				/>
			</div>

			<p className="text-muted-foreground text-body-sm mt-4" aria-live="polite">
				{query.trim()
					? `${results.length} ${results.length === 1 ? 'result' : 'results'} for “${query.trim()}”`
					: `${results.length} pages, posts and projects`}
			</p>

			{results.length === 0 ? (
				<p className="text-muted-foreground mt-8">
					Nothing matched. Try a shorter or more general term.
				</p>
			) : (
				<ul className="mt-6 flex flex-col gap-2">
					{results.map((entry) => (
						<li key={entry.href + entry.title}>
							<a
								href={entry.href}
								className="group focus-visible:ring-ring/85 dark:focus-visible:ring-ring/50 hover:border-primary/50 border-border/60 block rounded-xl border p-4 outline-none transition-colors focus-visible:ring-[4px]"
							>
								<span className="flex flex-wrap items-center gap-2">
									<span className="text-h4 group-hover:text-primary transition-colors">
										{entry.title}
									</span>
									<Badge variant="secondary">{entry.section}</Badge>
								</span>
								<span className="text-muted-foreground text-body-sm mt-1 block">
									{entry.description}
								</span>
							</a>
						</li>
					))}
				</ul>
			)}
		</>
	);
}

export default SearchResults;
