# Paper Plane

A minimal, Notion-style writing space built on [BlockNote](https://www.blocknotejs.org/). Write posts or travel plans and share each one by link. People you send a link to see only that post; the list of posts is yours.

## Run it locally

You need **Node.js 20.19+ or 22.12+**.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

- **You're the owner by default**: you see your post list, the round **Write** button, and Edit / Delete / View as visitor.
- **See the visitor view**: add `?visitor` to the address.
  - `http://localhost:5173/?visitor` shows the note visitors get from the main link.
  - `http://localhost:5173/?visitor#p-grzuew0b9` shows one post the way a friend sees it.
- **Your posts** live in `data/store.json`. Publishing, editing and deleting rewrite that file (through a small API in `vite.config.js`). It's plain JSON, so you can read it, back it up, or put it in git.
- **Drafts** autosave in your browser's localStorage as you type and only reach `data/store.json` when you press **Publish**.
- **Images** you add are resized and stored inside the post as data URLs. That's fine for now; a real file store is listed under next steps.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload and the local posts API |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves `dist/` locally, with the posts API, to check a build |
| `npm run build:claude` | Builds the single-file page used on claude.ai into `dist-claude/` (optional, see below) |

## How it's put together

```
index.html                  Vite entry page
vite.config.js              React plugin + the local posts API (GET/PUT /api/store)
data/store.json             Your posts (local mode)
src/
  main.jsx                  Picks a backend and renders the app
  App.jsx                   Views (list, read, edit), visitor rules, saving
  components/
    Library.jsx             Owner's post list
    Reader.jsx              One post, read-only
    Editor.jsx              BlockNote editor, draft autosave, publish/delete
    Visitor.jsx             View-as-visitor button and bar, visitor landing
    ui.jsx                  Logo, back link, toast, confirm bar, Write button
  backend/
    index.js                The storage interface (read this first)
    local.js                Local mode: talks to /api/store
    claude-page.js          The claude.ai page: saves by republishing itself
    page-shell.js           Exact wrapper the claude.ai page needs
  lib/                      Draft storage, text helpers, image resizing, dark mode
  styles/
    app.css                 All styling: Notion's sizes and colors, light and dark
    fonts.css, fonts/       Inter, the font BlockNote ships with
scripts/
  build-claude-page.mjs     Single-file build for claude.ai
```

### Storage interface

The UI never talks to storage directly. It uses a backend object (see `src/backend/index.js`):

```js
loadStore()          // -> { site, docs: Post[] }
getAccess()          // -> { canEdit, upload(file) -> url }
saveStore(store)     // -> { ok } or { ok: false, message }
shareUrl(store, id)  // -> the link to send for one post
```

A post is `{ id, title, blocks, createdAt, updatedAt }`, where `blocks` is BlockNote's document JSON (`editor.document`). To move to a real database, write a new backend with these four functions and return it from `pickBackend()`.

### Look and feel

- All sizes follow Notion's scale: 40px titles, 30/24/20px headings, 16px text, 14px UI, 12px small notes, 708px column.
- Colors are CSS variables at the top of `src/styles/app.css`, with a dark set under `prefers-color-scheme: dark`. Change them there.

## Next steps: login and a database on Vercel

Vercel hosts the app; the database and login come from a service. Supabase covers login, a Postgres database and image storage in one place.

1. **Create a Supabase project** and a `posts` table:

   ```sql
   create table posts (
     id text primary key,
     owner uuid not null references auth.users default auth.uid(),
     title text not null,
     blocks jsonb not null,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );
   alter table posts enable row level security;

   -- Anyone with a post's link can read that post (they need its id).
   create policy "read by id" on posts for select using (true);
   -- Only the owner can write.
   create policy "owner writes" on posts for all
     using (auth.uid() = owner) with check (auth.uid() = owner);
   ```

   Note: the read policy above lets anyone who calls the API list all posts. To keep the list private for real, serve single posts through a Vercel function (or a Postgres function) that looks one post up by id, and remove public `select`.

2. **Add login** with Supabase Auth (email magic link is simplest), so only you get `canEdit: true`.
3. **Write `src/backend/supabase.js`** with the four functions above. Saving per post (`upsert` one row, `delete` one row) is better than saving the whole store; add `savePost` / `deletePost` to the interface when you do this.
4. **Images**: upload to Supabase Storage in `upload(file)` and return the public URL.
5. **Deploy**: import the repo in Vercel. Build command `npm run build`, output directory `dist`. Add your Supabase URL and anon key as environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

Until then, `/api/store` only exists in `npm run dev` and `npm run preview`, so a Vercel deploy of this code would load but couldn't save.

## The claude.ai page (optional)

The same source also builds the page you've been using on claude.ai, where posts are stored inside the page itself and saving republishes it. `npm run build:claude` writes `dist-claude/paper-plane.html` from `data/store.json`. Publishing that file replaces the posts on the live page with the ones in `data/store.json`, so pull your latest posts into that file first.

## Versions

Dependencies are pinned to exact versions: BlockNote 0.55.0, React 19.1.1, Mantine 8.3.11, Vite 8.3.1. Upgrade the three BlockNote packages together; `@blocknote/core`, `@blocknote/react` and `@blocknote/mantine` must share a version.
