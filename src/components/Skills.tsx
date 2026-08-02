import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import Section from '@/components/Section';

const groups = [
	{
		title: 'Frontend',
		skills: ['TypeScript', 'React', 'Astro', 'Tailwind CSS', 'Vite'],
	},
	{
		title: 'Backend',
		skills: ['Node.js', 'PostgreSQL', 'REST', 'GraphQL', 'Redis'],
	},
	{
		title: 'Tooling',
		skills: ['Git', 'Docker', 'CI/CD', 'Vitest', 'Playwright'],
	},
];

export function Skills() {
	return (
		<Section id="skills">
			<h2 className="text-h2">Skills</h2>
			<p className="text-muted-foreground mt-2">
				Placeholder groupings — edit freely.
			</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{groups.map((group) => (
					<Card key={group.title}>
						<CardHeader>
							<CardTitle>{group.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="flex flex-wrap gap-2">
								{group.skills.map((skill) => (
									<li key={skill}>
										<Badge variant="secondary">{skill}</Badge>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				))}
			</div>
		</Section>
	);
}

export default Skills;
