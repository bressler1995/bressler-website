import * as React from 'react';
import { navigate } from 'astro:transitions/client';
import {
	FolderGit2,
	Home,
	Mail,
	Menu,
	Moon,
	NotebookPen,
	Search,
	Sun,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const links = [
	{ href: '/', label: 'Home', icon: Home },
	{ href: '/projects', label: 'Projects', icon: FolderGit2 },
	{ href: '/blog', label: 'Blog', icon: NotebookPen },
	{ href: '/contact', label: 'Contact', icon: Mail },
];

export default function Nav() {
	// Empty until hydration so the server-rendered markup matches; the active
	// link only lights up once we know the real pathname.
	const [path, setPath] = React.useState('');
	const [searchOpen, setSearchOpen] = React.useState(false);
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const [isDark, setIsDark] = React.useState(true);

	React.useEffect(() => {
		const sync = () => {
			setPath(window.location.pathname);
			setMobileOpen(false);
		};
		sync();
		setIsDark(document.documentElement.classList.contains('dark'));
		// Fires after every client-side navigation, including back/forward.
		document.addEventListener('astro:page-load', sync);
		return () => document.removeEventListener('astro:page-load', sync);
	}, []);

	React.useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setSearchOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);

	const toggleTheme = () => {
		const next = !isDark;
		setIsDark(next);
		document.documentElement.classList.toggle('dark', next);
		localStorage.setItem('theme', next ? 'dark' : 'light');
	};

	const go = (href: string) => {
		setSearchOpen(false);
		setMobileOpen(false);
		navigate(href);
	};

	const isActive = (href: string) =>
		href === '/' ? path === '/' : path.startsWith(href);

	return (
		<>
			<header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
				<nav
					aria-label="Main"
					// rounded-xl matches Card — the nav is a surface, so it takes the
					// same radius step as other surfaces rather than a pill shape.
					className="bg-background/70 border-border/60 max-w-page flex w-full items-center gap-2 rounded-xl border p-2 shadow-lg backdrop-blur-md"
				>
					<a
						href="/"
						className="font-heading text-label hover:bg-accent ml-1 rounded-lg px-3 py-1.5 tracking-tight transition-colors"
					>
						BR
					</a>

					{/* Desktop links */}
					<ul className="hidden items-center gap-1 md:flex">
						{links.map(({ href, label }) => (
							<li key={href}>
								<a
									href={href}
									aria-current={isActive(href) ? 'page' : undefined}
									className={cn(
										// Nav links are controls, not prose — they take the
										// prominent face like the buttons beside them.
										'font-heading text-body-sm rounded-lg px-3 py-1.5 transition-colors',
										// Active page reads like a primary button; hover uses
										// the secondary pair. Same tokens as Button, so nav
										// states stay consistent with the rest of the system.
										isActive(href)
											? 'text-label bg-primary text-primary-foreground hover:bg-primary/80'
											: 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
									)}
								>
									{label}
								</a>
							</li>
						))}
					</ul>

					<div className="ml-auto flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Search"
							onClick={() => setSearchOpen(true)}
						>
							<Search />
						</Button>

						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Toggle theme"
							onClick={toggleTheme}
						>
							{isDark ? <Sun /> : <Moon />}
						</Button>

						{/* Default size per the standard: this is a primary call to
						    action, not dense chrome like the icon buttons beside it. */}
						<Button onClick={() => go('/contact')}>
							Hire me
						</Button>

						{/* Mobile menu */}
						<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Open menu"
									className="md:hidden"
								>
									<Menu />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-64">
								<SheetHeader>
									<SheetTitle>Menu</SheetTitle>
								</SheetHeader>
								<ul className="flex flex-col gap-1 px-4">
									{links.map(({ href, label, icon: Icon }) => (
										<li key={href}>
											<a
												href={href}
												className={cn(
													'font-heading text-body-sm flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
													isActive(href)
														? 'text-label bg-primary text-primary-foreground hover:bg-primary/80'
														: 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
												)}
											>
												<Icon className="size-4" />
												{label}
											</a>
										</li>
									))}
								</ul>
							</SheetContent>
						</Sheet>
					</div>
				</nav>
			</header>

			<CommandDialog
				open={searchOpen}
				onOpenChange={setSearchOpen}
				title="Search"
				description="Jump to a page"
			>
				<CommandInput placeholder="Search pages…" />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Pages">
						{links.map(({ href, label, icon: Icon }) => (
							<CommandItem key={href} value={label} onSelect={() => go(href)}>
								<Icon className="size-4" />
								{label}
							</CommandItem>
						))}
						<CommandItem
							value="Design system"
							onSelect={() => go('/design-system')}
						>
							Design system
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}
