import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections for posts and projects.
 *
 * Bodies live in MDX rather than a data module so presentation stays out of the
 * content: the templates can be restyled, or replaced entirely, without any of
 * these files changing. The schemas are the contract between the two — a post
 * missing a title fails the build rather than rendering blank.
 */

const blog = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		/** Coerced so frontmatter can stay as a plain YYYY-MM-DD string. */
		date: z.coerce.date(),
		blurb: z.string(),
		/** Drafts are kept out of listings, routes and search. */
		draft: z.boolean().default(false),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		blurb: z.string(),
		tags: z.array(z.string()).default([]),
		/** Manual ordering — projects aren't chronological like posts. */
		order: z.number().default(0),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog, projects };
