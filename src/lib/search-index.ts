import { getCollection } from 'astro:content';

import type { SearchEntry } from '@/lib/search';

/**
 * Builds the search index from the content collections.
 *
 * Server-only — it imports `astro:content`, so it must never be pulled into a
 * client bundle. Pages call this and pass the result into the React islands as
 * a prop, which also means the index is computed once at build time rather
 * than reassembled in every visitor's browser.
 */

const pages: SearchEntry[] = [
	{
		title: 'Home',
		href: '/',
		section: 'Pages',
		description: 'Software engineer building fast, accessible web applications.',
		keywords: ['start', 'index', 'landing', 'hero'],
	},
	{
		title: 'Projects',
		href: '/projects',
		section: 'Pages',
		description: 'Selected work and the things behind it.',
		keywords: ['work', 'portfolio', 'case studies'],
	},
	{
		title: 'Blog',
		href: '/blog',
		section: 'Pages',
		description: 'Writing on engineering and design.',
		keywords: ['writing', 'posts', 'articles'],
	},
	{
		title: 'Contact',
		href: '/contact',
		section: 'Pages',
		description: 'Get in touch about work or collaboration.',
		keywords: ['email', 'hire', 'get in touch', 'reach out'],
	},
	{
		title: 'Design system',
		href: '/design-system',
		section: 'Pages',
		description: 'Colour, type, spacing and component reference.',
		keywords: ['tokens', 'palette', 'typography', 'components', 'styleguide'],
	},
];

export async function buildSearchIndex(): Promise<SearchEntry[]> {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	const projects = await getCollection('projects', ({ data }) => !data.draft);

	const postEntries: SearchEntry[] = posts
		.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
		.map((post) => ({
			title: post.data.title,
			href: `/blog/${post.id}`,
			section: 'Blog',
			description: post.data.blurb,
			keywords: [post.data.date.toISOString().slice(0, 10)],
		}));

	const projectEntries: SearchEntry[] = projects
		.sort((a, b) => a.data.order - b.data.order)
		.map((project) => ({
			title: project.data.title,
			href: `/projects/${project.id}`,
			section: 'Projects',
			description: project.data.blurb,
			keywords: project.data.tags,
		}));

	return [...pages, ...postEntries, ...projectEntries];
}
