import { Badge } from '@/components/ui/badge';
import Section from '@/components/Section';

const steps = [
	{
		n: '01',
		title: 'Understand',
		body: 'Placeholder copy. What the problem actually is, before any code exists.',
	},
	{
		n: '02',
		title: 'Build',
		body: 'Placeholder copy. Small, verifiable increments over big-bang rewrites.',
	},
	{
		n: '03',
		title: 'Measure',
		body: 'Placeholder copy. Decisions backed by numbers rather than impressions.',
	},
];

/**
 * Sits between Hero and Skills on the alternate surface, so consecutive
 * full-height sections read as distinct bands rather than one continuous page.
 */
export function Approach() {
	return (
		<Section id="approach" surface="alt">
			<Badge variant="secondary" className="w-fit">
				How I work
			</Badge>

			<h2 className="text-h2 title-rule mt-6">Approach</h2>
			<p className="text-muted-foreground text-body-lg mt-4 max-w-xl text-pretty">
				Placeholder copy — replace with a real statement of method.
			</p>

			<ol className="mt-10 grid gap-8 sm:grid-cols-3">
				{steps.map((step) => (
					<li key={step.n}>
						<span className="text-caption text-muted-foreground font-mono">
							{step.n}
						</span>
						<h3 className="text-h3 mt-2">{step.title}</h3>
						<p className="text-muted-foreground text-body-sm mt-2">{step.body}</p>
					</li>
				))}
			</ol>
		</Section>
	);
}

export default Approach;
