import * as React from 'react';

import { initHeroGlobe } from './hero-globe';

/**
 * Decorative rotating wireframe globe. Purely a background layer — it carries
 * no meaning, so it's hidden from assistive tech and ignores pointer events.
 *
 * The canvas draws the lines at full strength; the scrim on top is the page
 * background at partial opacity, knocking the whole thing back so it reads as
 * a texture rather than an illustration. Both live here so the veil always
 * travels with the globe and can't accidentally be layered over the gradient.
 *
 * The canvas only animates if an ancestor is hydrated — a `client:*` directive
 * applies at the boundary where Astro mounts React, and nested components can't
 * opt in separately. That's why the page mounts <Hero client:load />.
 */
export function HeroGlobe() {
	React.useEffect(() => initHeroGlobe(), []);

	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0">
			<canvas
				data-hero-globe
				className="absolute inset-0 size-full"
				style={{
					// Wider and later-fading than before: at this size a tight mask
					// clips the diamond's points off, which reads as a crop rather
					// than a form bleeding out of frame.
					maskImage:
						'radial-gradient(135% 130% at 62% 50%, #000 62%, transparent 100%)',
				}}
			/>

			{/* Scrim: --hero-globe-scrim is the page background at 55%. */}
			<div
				className="absolute inset-0"
				style={{ background: 'var(--hero-globe-scrim)' }}
			/>
		</div>
	);
}

export default HeroGlobe;
