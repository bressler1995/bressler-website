import * as React from 'react';
import { ArrowRight, FileText, FolderGit2, Search } from 'lucide-react';

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from '@/components/ui/command';
import {
	SPOTLIGHT_LIMIT,
	searchEntries,
	type SearchEntry,
	type SearchSection,
} from '@/lib/search';

const sectionIcon: Record<SearchSection, React.ComponentType<{ className?: string }>> = {
	Pages: Search,
	Blog: FileText,
	Projects: FolderGit2,
};

/** Section render order, so groups don't reshuffle as scores change. */
const SECTION_ORDER: SearchSection[] = ['Pages', 'Blog', 'Projects'];

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Navigation is the parent's job — it also closes the mobile sheet. */
	onNavigate: (href: string) => void;
	/** Built at build time from the content collections and passed down. */
	index: SearchEntry[];
};

/**
 * Spotlight search. Shows the top matches across the whole site and hands off
 * to /search for the rest.
 *
 * Ranking comes from lib/search rather than cmdk's built-in filter, so the
 * dialog and the full results page agree on what matches and in what order —
 * "see all results" has to be a superset of what's already on screen, not a
 * different search that happens to run on the same query.
 */
export function SearchDialog({ open, onOpenChange, onNavigate, index }: Props) {
	const [query, setQuery] = React.useState('');

	// One extra result is fetched beyond the limit purely to answer "is there
	// more?" without counting the entire index on every keystroke.
	const probed = React.useMemo(
		() => searchEntries(index, query, SPOTLIGHT_LIMIT + 1),
		[index, query]
	);
	const results = probed.slice(0, SPOTLIGHT_LIMIT);
	const hasMore = probed.length > SPOTLIGHT_LIMIT;

	const grouped = React.useMemo(() => {
		const map = new Map<SearchSection, SearchEntry[]>();
		for (const entry of results) {
			const list = map.get(entry.section);
			if (list) list.push(entry);
			else map.set(entry.section, [entry]);
		}
		return SECTION_ORDER.filter((s) => map.has(s)).map(
			(s) => [s, map.get(s)!] as const
		);
	}, [results]);

	// Reset between openings so the panel doesn't reopen holding a stale query.
	React.useEffect(() => {
		if (!open) setQuery('');
	}, [open]);

	const seeAll = () => {
		const q = query.trim();
		onNavigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
	};

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Search"
			description="Search pages, posts and projects"
			commandProps={{ shouldFilter: false }}
		>
			<CommandInput
				placeholder="Search pages, posts and projects…"
				value={query}
				onValueChange={setQuery}
			/>
			{/* Taller than the default max-h-72, which fitted about five rows and
			    left the "see all" row below a hidden scrollbar with nothing
			    hinting at it. The dialog sits at top-1/3, so 50vh is the most it
			    can take and still end above the fold on short viewports. */}
			<CommandList className="max-h-[50vh]">
				<CommandEmpty>No results for “{query}”.</CommandEmpty>

				{grouped.map(([section, entries]) => {
					const Icon = sectionIcon[section];
					return (
						<CommandGroup key={section} heading={section}>
							{entries.map((entry) => (
								<CommandItem
									// Titles repeat across sections, and cmdk treats value as
									// an identity — the href keeps each row distinct.
									key={entry.href + entry.title}
									value={entry.href + entry.title}
									onSelect={() => onNavigate(entry.href)}
								>
									<Icon className="size-4 shrink-0 opacity-60" />
									<span className="flex min-w-0 flex-col">
										<span className="truncate">{entry.title}</span>
										<span className="text-muted-foreground truncate text-xs">
											{entry.description}
										</span>
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					);
				})}

				{(hasMore || query.trim()) && (
					<>
						<CommandSeparator />
						<CommandGroup>
							<CommandItem value="see-all-results" onSelect={seeAll}>
								<ArrowRight className="size-4 shrink-0 opacity-60" />
								{query.trim() ? (
									<span>
										See all results for “<strong>{query.trim()}</strong>”
									</span>
								) : (
									<span>Browse everything</span>
								)}
								<CommandShortcut>↵</CommandShortcut>
							</CommandItem>
						</CommandGroup>
					</>
				)}
			</CommandList>
		</CommandDialog>
	);
}

export default SearchDialog;
