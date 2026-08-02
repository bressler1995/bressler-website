import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The standard page section: exactly one viewport tall, and a scroll-snap stop.
 * Every non-collection page should be built out of these so scrolling behaves
 * identically everywhere.
 *
 * Content taller than the viewport is safe — the CSS scroll-snap spec requires
 * browsers to allow free scrolling within a snap area larger than the viewport,
 * so a long section won't trap the user; it just scrolls normally until the
 * next section takes over.
 *
 * Usable from `.astro` pages (children render as static HTML) and from other
 * React components. `background` takes a node rather than a slot so React
 * callers can compose it — Astro can't pass elements across the boundary.
 */
export interface SectionProps extends React.ComponentProps<'section'> {
	/**
	 * `center` vertically centres content (good for hero / short sections).
	 * `start` pins it to the top (use when content is likely to fill or exceed
	 * the viewport, e.g. long card grids).
	 */
	align?: 'center' | 'start';
	/** Full-bleed decorative layer, rendered outside the max-width wrapper. */
	background?: React.ReactNode;
	/**
	 * Which of the three section surfaces to paint. `base` matches the page, so
	 * consecutive sections can alternate to read as distinct bands. The colour
	 * spans the full bleed, not just the content column.
	 */
	surface?: 'base' | 'alt' | 'slate';
}

// The utilities carry token overrides as well as a background — see global.css.
const surfaces = {
	base: 'surface-base',
	alt: 'surface-alt',
	slate: 'surface-slate',
} as const;

export function Section({
	align = 'center',
	background,
	surface = 'base',
	className,
	children,
	...props
}: SectionProps) {
	return (
		<section
			data-section
			className={cn(
				// `relative` anchors anything passed as `background`.
				'relative flex min-h-dvh w-full snap-start flex-col',
				// Top padding clears the floating nav; sections snap to their own
				// top, so this doubles as scroll offset for anchor links.
				'px-6 pt-28 pb-16',
				align === 'center' ? 'justify-center' : 'justify-start',
				surfaces[surface],
				className
			)}
			{...props}
		>
			{background}

			<div className="max-w-page relative mx-auto w-full">{children}</div>
		</section>
	);
}

export default Section;
