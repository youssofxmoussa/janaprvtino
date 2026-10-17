<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Access rules (roles, course access, session epoch, rate limit) live as pure functions in src/lib/access.ts and are enforced in auth.middleware.ts; why: one tested source of truth for every server check.
- Admin actions are logged as individual JSON files under audit/ in the private data bucket via audit.server.ts; why: no database, and per-file writes avoid overwrite races.
- Admin input sheets use the shared Radix Dialog primitives; why: consistent themed surfaces, focus trapping, Escape dismissal and focus restoration.
- Subject artwork is mapped through a browser-safe module of bundled WebP imports; why: reuse cohesive generated illustrations across course and section cards.
