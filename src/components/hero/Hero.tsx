import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import HeroGlobe from './HeroGlobe';
import HeroGradient from './HeroGradient';
import Section from '@/components/Section';

import './hero.css';

export function Hero() {
	return (
		<Section
			id="hero"
			className="overflow-hidden"
			background={
				/*
				 * Order matters. The globe paints first and carries its own background
				 * scrim, so it gets veiled without touching anything else. The gradient
				 * paints last, over the veil — otherwise the scrim would wash out the
				 * colour wash too, which is not what it's for.
				 */
				<>
					<HeroGlobe />
					<HeroGradient />
				</>
			}
		>
			<Badge variant="secondary" className="w-fit">
				Available for work
			</Badge>

			<h1 className="text-display title-rule-lg mt-6 text-balance">Brian Ressler</h1>

			<p className="text-body-lg text-muted-foreground mt-4 max-w-xl text-pretty">
				Software engineer building fast, accessible web applications. Placeholder
				copy — swap this for a real positioning statement.
			</p>

			{/*
			 * Links styled with `buttonVariants` rather than <Button asChild>. Radix's
			 * Slot needs a single React element child to merge props onto; going
			 * through buttonVariants keeps these as plain anchors, which is what a
			 * navigation link should be.
			 */}
			<div className="mt-8 flex flex-wrap gap-3">
				<a href="/projects" className={buttonVariants({ size: 'lg' })}>
					View projects
				</a>
				<a
					href="#skills"
					className={buttonVariants({ size: 'lg', variant: 'secondary' })}
				>
					Skills
				</a>
			</div>
		</Section>
	);
}

export default Hero;
