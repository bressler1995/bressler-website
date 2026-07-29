# bressler-website

Portfolio site built with [Astro](https://astro.build), MDX, Tailwind CSS v4, and
[shadcn/ui](https://ui.shadcn.com).

## Commands

| Command                  | Action                                       |
| :----------------------- | :------------------------------------------- |
| `npm install`            | Install dependencies                          |
| `npm run dev`            | Dev server at `localhost:4321`                |
| `npm run build`          | Build to `./dist/`                            |
| `npm run preview`        | Preview the production build locally          |
| `npm run check`          | Typecheck `.astro` / `.ts` / `.tsx` files     |
| `npx shadcn@latest add <component>` | Add a shadcn/ui component          |

## Notes

- React components (including everything in `src/components/ui/`) take
  `className`, not `class`. Plain HTML elements in `.astro` files take `class`.
- shadcn components render statically by default. Add a
  [`client:*` directive](https://docs.astro.build/en/reference/directives-reference/#client-directives)
  only when a component needs to be interactive in the browser.
- Dark mode is wired to the `.dark` class on a parent element; no theme toggle is
  set up yet.
