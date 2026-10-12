# Vioniche CMS — setup

The CMS at `/admin` edits the same MDX files the blog already builds from
(`content/blog/*.mdx`). Saving and publishing commit those files to GitHub;
Vercel's Git integration deploys the commit like any other push.

```
/admin → sign in → edit → Check → Preview → Publish
       → GitHub commit on main → Vercel builds → article live
```

Nothing is stored anywhere else: no database, no second CMS. A draft is a
committed file with `draft: true`, which the production build skips.

## 1. Admin sign-in

This is a single-admin CMS: one user ID and one password, both defined by the
server's environment. There are no accounts, no database and no email.

Set three environment variables in Vercel (Project → Settings → Environment
Variables, Production) and in `.env.local` for local use:

| Variable | Value |
|---|---|
| `ADMIN_USER_ID` | The admin's user ID, e.g. `remond` |
| `ADMIN_PASSWORD_HASH` | Output of `node scripts/hash-password.mjs` — the hash, never the password |
| `SESSION_SECRET` | 32+ random characters: `openssl rand -base64 48` |

Signing in at `/admin/login`:

- **User ID**: the value of `ADMIN_USER_ID`, exactly as set (spaces around it are ignored).
- **Password**: the password you typed into `hash-password.mjs` to produce `ADMIN_PASSWORD_HASH`.

Changing `SESSION_SECRET` or `ADMIN_USER_ID` signs out every session.

### Changing or resetting the password

Password resets happen on the server, not by email — deliberately, since there
is one admin and nothing to send a reset link to:

1. Run `node scripts/hash-password.mjs`. It asks for the new password twice
   (at least 9 characters) and prints an `ADMIN_PASSWORD_HASH=scrypt:…` line.
   It writes nothing to disk.
2. Replace `ADMIN_PASSWORD_HASH` in `.env.local` and/or in Vercel's
   environment variables with the printed value.
3. Restart `npm run dev`, or redeploy on Vercel, so the new value is loaded.

To also sign out every existing session, change `SESSION_SECRET` at the same time.

## 2. GitHub App

A GitHub App gives the CMS access to this one repository and nothing else,
with short-lived tokens. A personal access token is not used.

1. GitHub → Settings → Developer settings → **GitHub Apps** → **New GitHub App**.
2. Name: e.g. *Vioniche CMS*. Homepage URL: `https://www.vioniche.com`.
3. **Webhook**: untick *Active* (not needed).
4. **Repository permissions**:
   - **Contents: Read and write** — required (read articles, create commits).
   - **Deployments: Read-only** — optional; lets the editor show Vercel's progress.
   - Metadata: Read-only (GitHub sets this automatically).
   Leave everything else at *No access*.
5. *Where can this GitHub App be installed?* → **Only on this account**. Create it.
6. On the app's page note the **App ID**. Under *Private keys* → **Generate a
   private key** — a `.pem` file downloads.
7. **Install App** → your account → **Only select repositories** →
   `remondanthony/portfolio`. After installing, the URL ends in
   `/installations/<number>` — that number is the **installation ID**.

Then set in Vercel (Production):

| Variable | Value |
|---|---|
| `GITHUB_APP_ID` | The App ID |
| `GITHUB_APP_INSTALLATION_ID` | The installation ID |
| `GITHUB_APP_PRIVATE_KEY` | The whole contents of the `.pem` file |
| `GITHUB_REPOSITORY` | `remondanthony/portfolio` |
| `GITHUB_BRANCH` | `main` (the branch Vercel deploys to production) |

Keep the `.pem` file out of the repository. If it leaks, delete the key on the
app's page and generate a new one.

## 3. Branch protection

If `main` requires pull requests or status checks, GitHub will refuse the
CMS's direct commits and the editor will say so. Either allow the app to
bypass the rule, or point `GITHUB_BRANCH` at another branch and merge from it.

## 4. Every save deploys

Vercel builds every commit to `main`, including draft saves. A draft build
publishes nothing — drafts are excluded — but it uses build minutes. To skip
them, set Vercel → Settings → Git → **Ignored Build Step** to:

```
git log -1 --pretty=%s | grep -qE '^(Save draft|Delete draft|Keywords):' && exit 0 || exit 1
```

(Deleting a draft changes nothing public either, and nor does a `Keywords:`
commit — the keyword library is never read by the public site. `Unpublish:` and `Delete
article:` commits do change the site, so they must build.)

## 5. Projects: Vioniche and Born21

The **Project** menu at the top of the CMS switches between the websites it
manages. Each project has its own GitHub repository, and nothing is shared or
copied between them.

| Project | Website | Repository | In this CMS |
|---|---|---|---|
| Vioniche | https://vioniche.com | `remondanthony/portfolio` (`GITHUB_REPOSITORY`) | Articles, media, page SEO, keywords, research, Search Console |
| Born21 | https://born21.com | `remondanthony/Born21` (`BORN21_GITHUB_REPOSITORY`) | Keyword library, clusters, research, CSV import |

Born21's repository was taken from the Born21 site's own checkout
(`git remote -v` → `github.com/remondanthony/Born21.git`). To use it:

1. GitHub → Settings → Applications → your CMS app → **Configure** → add
   `remondanthony/Born21` to *Only select repositories*. (Same app, same
   **Contents: Read and write** permission. Nothing changes for Vioniche.)
2. Optional, in Vercel: `BORN21_GITHUB_REPOSITORY` (default
   `remondanthony/Born21`), `BORN21_GITHUB_BRANCH` (default `main`), and
   `BORN21_GITHUB_APP_INSTALLATION_ID` only if Born21 is reached through a
   different installation of the app.

The dashboard shows **GitHub repository: Connected** or **Access required** for
the active project. It checks with the app's own credentials and never changes
permissions. If Born21's repository can't be reached, Born21 screens say so.
They never fall back to Vioniche's repository.

How it is kept apart:

- The browser only ever sends a project ID (`vioniche` or `born21`). Every
  action checks the session, then checks the ID against the server's list, and
  only then builds the repository from server configuration. An owner,
  repository, branch or path sent by the browser is never used.
- Each project gets its own short-lived installation token, limited to that
  one repository.
- If two projects were ever configured with the same repository, the second
  is switched off rather than writing into the first.
- Born21 may write only `content/seo/keywords.json`, `pages.json` and
  `settings.json` in its own repository. Articles, media, page SEO and Search
  Console are refused for Born21.
- Born21 starts with no SEO data. Its first keyword save creates
  `content/seo/keywords.json` in the Born21 repository. Vioniche's data is
  never copied. If Vercel deploys Born21 from `main`, that commit triggers a
  Born21 build (harmless; the Born21 site doesn't read these files).
- In local development (no GitHub variables), only Vioniche works. It reads
  and writes this checkout; Born21 shows "not connected".

## 6. Google Search Console (Vioniche)

SEO → **Search Console** connects Vioniche to Google Search Console through
Google's official OAuth flow and Search Console API. It doesn't scrape Google
or use CSV exports. The connection belongs to the Vioniche project only;
Born21 has no Search Console in this CMS yet.

### Google Cloud setup

1. https://console.cloud.google.com → create or choose a project.
2. **APIs & Services → Library** → enable **Google Search Console API**.
3. **OAuth consent screen**: user type *External* (or *Internal* on Google
   Workspace). Add the scope `https://www.googleapis.com/auth/webmasters.readonly`.
   While the app is in *Testing*, add your Google account under *Test users*.
   Google expires refresh tokens for apps in Testing after 7 days, so publish
   the consent screen to keep the connection.
4. **Credentials → Create credentials → OAuth client ID → Web application**.
   Under *Authorized redirect URIs* add, exactly:
   - `https://<your production domain>/api/search-console/callback`, the domain
     the CMS is served from (e.g. `https://www.vioniche.com/api/search-console/callback`);
   - for local development, `http://localhost:3001/api/search-console/callback`.
5. Copy the client ID and secret into Vercel (Production):

| Variable | Value |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | The OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | The OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | The redirect URI registered above, character for character |

`SESSION_SECRET` (already set) also protects the stored connection. Rotating it
disconnects Search Console, and you then connect again.

The Google account you connect needs access to the Vioniche property in Search
Console (Settings → Users and permissions). The CMS lists the properties the
account can see. Only a property on vioniche.com that the account is verified
for can be selected.

### What the CMS stores, and where

- **Scope:** `webmasters.readonly` only, which reads Search Console data.
- **Refresh token:** kept in an httpOnly, Secure, SameSite=Strict cookie
  limited to `/admin`, encrypted with AES-256-GCM using a key derived from
  `SESSION_SECRET`. Page scripts can't read it, and it's never sent to React
  code, logged or committed. **It is not stored in the repository, which is
  public.** The connection therefore lives in the browser you connected from;
  on another browser or device, connect again.
- **Access tokens** live only in server memory.
- **Performance data** isn't committed anywhere; your queries and clicks
  would be public in this repository. Each **Sync now** reads it from the API
  and keeps the result in server memory for an hour. Google keeps 16 months
  of history, so nothing is lost.
- **Disconnect** revokes the grant at Google and deletes the cookie.

### Using it

- **Sync now** is the only thing that calls Google. Each sync makes at most
  nine `searchanalytics.query` requests. A repeat within a minute is answered
  from the cache. There is no background polling.
- Reporting periods: last 7 days, last 28 days, last 3 months (90 days), or a
  custom range. Presets end 3 days ago and request final data only, because
  Search Console usually finalises data 2–3 days late. Custom ranges are
  checked on the server.
- Metrics use Search Console's own terms. **Impressions are not search
  volume.** **Average position isn't keyword difficulty**, and a lower number
  is better: 14.2 → 9.8 is shown as an improvement of 4.4 positions. CTR
  changes are shown in percentage points and as a relative change.
- Queries are matched to the keyword library with its own normalisation;
  nothing in the library is changed. *Potential keyword discoveries* lists
  unmatched queries. Only the ones you select are added, as ideas with source
  "Google Search Console" and no figures.
- *Query → page* shows the most-visible and most-clicked page for each query,
  and flags where that differs from the page the keyword is assigned to. A
  query that reaches several pages is shown as "Search Console shows this
  query receiving visibility across multiple pages. Review for possible
  cannibalization." That is evidence to review, not proof. Page assignments
  and metadata are never changed automatically.

## Unpublishing and deleting

Each is one commit, confirmed in a dialog first, available from the article
list and from the editor:

| Action | Commit | What changes |
| --- | --- | --- |
| Publish (list) | `Publish: <title>` | Same checks as the editor's Publish. |
| Unpublish | `Unpublish: <title>` | Only `draft: true` is added. Text, metadata and images stay; the article leaves `/blog`, the sitemap and its URL (404) after the deploy, and can be published again. |
| Delete draft | `Delete draft: <title>` | Removes `content/blog/<slug>.mdx` and every image in `public/blog/<slug>/`. |
| Delete permanently | `Delete article: <title>` | The same, for a published article; its URL returns 404 after the deploy. |

Deleting cannot be undone from the CMS (Git history still has the files).
It is refused when:

- the article changed since the page was loaded (reload and try again);
- a draft-only delete finds the article is now published, or the reverse;
- another article uses an image from this article's folder — a duplicated
  article keeps pointing at the original's images until it gets its own.

Other articles that link to a deleted or unpublished one are listed in the
dialog; those links are not changed automatically.

## Media usage

The Media page marks each image **✓ Featured image**, **✓ Used in article**
(both can apply) or **⚠ Unused**, and filters by usage. An image counts as
used when its path, `/blog/<folder>/<file>`, appears anywhere in an article:
the featured image, a `<Figure>`, a Markdown image or link, or the CTA
override's image. "Unused" only means no article mentions it — the CMS never
deletes images on its own, and has no image delete button. Remove one with an
ordinary commit if it is really not needed.

## SEO and keywords

The workflow: research keywords in Google Keyword Planner (or Search Console,
Ahrefs, Semrush) → enter or import them under **SEO → Keywords** → give each
page or article one primary keyword plus secondary and related ones → write the
SEO title, H1 and content naturally → publish → watch Search Console.

Where the data lives — there is still no database:

| File | Holds | Commit prefix | Affects the public site |
| --- | --- | --- | --- |
| `content/seo/keywords.json` | The keyword library and topic clusters | `Keywords:` | No |
| `content/seo/pages.json` | SEO settings for the code-built pages (home, `/blog`, services, Born21) | `Page SEO:` | Yes — merged into their metadata at build |
| `content/blog/<slug>.mdx` | Each article's own keyword brief and search overrides | `Save draft:` / `Update:` / `SEO:` | Yes |

- **Metrics are optional.** Search volume, difficulty, CPC and competition are
  stored only when the research tool gave them; a Keyword Planner range such as
  "1K – 10K" is kept as a range, never turned into a number.
- **Duplicates.** The same keyword for the same location is one record (case and
  spacing are ignored). The same keyword for another location is a separate
  record.
- **CSV import** (SEO → Import CSV) reads Keyword Planner's "Download keyword
  ideas" export as it is (UTF-16, tab-separated, with its title lines), and any
  CSV with a `Keyword` column plus any of: Search Volume / Avg. monthly
  searches, Competition, CPC, Keyword Difficulty, Search Intent, Location,
  Country, Source, Notes. Keyword Planner's bid ranges and "indexed
  competition" are not mapped to CPC or difficulty — they measure ads, not SEO.
  The import shows a preview first; invalid and duplicate rows are skipped;
  keywords already in the library change only if you tick them, and then only
  the fields the file provides.
- **Cannibalization.** Two pages or articles with the same primary keyword are
  flagged on the SEO overview, in the editors, and when assigning a keyword.
  Saving needs one extra confirmation; nothing is changed or removed for you.
- **Page overrides.** An empty field keeps the page's own value from code. A
  canonical must stay on `https://www.vioniche.com`; `noindex` also drops the
  page from the sitemap. Existing URLs and canonicals never change by themselves.
- **The checklist is guidance.** It never edits content, and it warns when a
  keyword is repeated so often it would read as stuffing.
- **Backward compatible.** Pages and articles without keyword data keep working
  and publishing; they are listed as "Missing SEO data".

## Research providers (SEO → Research providers)

One switcher, four free ways to research — all saving into the same keyword
library, clusters and page assignments. Switching provider changes the
research tools shown, never the keywords. The choice is remembered in
`content/seo/settings.json` (a `Keywords:` commit; it holds no credentials).

| Provider | What actually works |
| --- | --- |
| Google Trends | Builds the official Trends report link (up to 5 terms, any country or region, time range). Reads the report's own **Interest over time** and **Related queries** CSV downloads: chart, average/peak/latest interest, top and rising queries, saved to the library. |
| Google Keyword Planner | Imports Keyword Planner's **Download keyword ideas** CSV (as downloaded: UTF-16 or UTF-8, tab or comma). Preview with counts and per-row problems, choose rows, skip or update keywords already in the library, then one commit. No Google Ads connection. |
| Keyword Ideas | Free keyword *discovery* from Google's suggestions: the CMS builds the seed and its a–z variations (27 searches) as google.com links for the chosen region and language; you open them, paste back the suggestions Google shows, and the CMS cleans them, marks what is already in the library, and saves or exports the ones you pick. Ideas only — no search volume, difficulty or CPC. |
| Manual / CSV | Manual entry and the general CSV import, including Search Console, Ahrefs and Semrush CSV exports. |

- **Google Trends has no open API.** Google's Trends API is an
  application-only alpha, so the CMS never fetches Trends data and never
  scrapes it. Trends scores are relative interest (0–100 within one report) and
  are stored and shown separately from search volume — never as volume.
- **Keyword Planner import.** Columns are matched by name, ignoring case,
  spacing and punctuation (Keyword, Avg. monthly searches, Competition,
  Competition (indexed value), Three month change, YoY change, Top of page bid
  (low/high range), Currency, Location); other columns are ignored. The figures
  go into the keyword's `planner` block: average monthly searches (or Google's
  range, e.g. "1K – 10K"), Google Ads competition and its 0–100 index — not an
  SEO difficulty score — percentage changes, bids and currency. The export has
  no location, so the location is recorded only if you enter one; a keyword
  researched for a different location becomes a separate keyword. Updating an
  existing keyword changes only its Keyword Planner figures, and a figure missing
  from a new export never erases an earlier one. New keywords get the source
  `google-keyword-planner`. The screen offers an example CSV with fictional
  figures.
- **Keyword Ideas never calls Google.** Google's autocomplete endpoint is
  unofficial and Google restricted access to it in 2015, so the CMS does not
  request it (nor any other Google service, and no proxy or browser
  automation). You open the searches in your own browser. New ideas are saved
  with the source `google-autocomplete` and a history entry naming the seed,
  suggestion region and language; they get no location, so a later Keyword
  Planner import merges into them. Ideas already in the library only gain that
  history entry — nothing else on them changes. From the results you can copy
  the chosen ideas for Keyword Planner's "Get search volume and forecasts", open
  up to five in Google Trends, or export them as CSV.
- **Provenance.** A keyword's own figures (typed or imported) carry their
  source; Google Trends data (`trends`: place, range, compared terms, date) and
  Keyword Planner data (`planner`) are kept in their own blocks and never
  overwrite them or each other. Each keyword keeps a short
  research history.
- **Export.** On the Keywords screen, export the selected (or all shown)
  keywords as CSV, with the figures' source, the Trends data and the Keyword
  Planner data in their own columns (Keyword Planner columns are appended at the
  end, so earlier columns keep their positions). Text that a spreadsheet would
  run as a formula is neutralised.
- **No API keys.** Neither provider needs a key or an account.

### Vercel Ignored Build Step — check this

There is no `vercel.json` in the repository, so the Ignored Build Step lives
only in the Vercel dashboard (Project → Settings → Git). Research and provider
switches commit with the `Keywords:` prefix and change nothing on the public
site. If you use the command recommended above it already skips them; if the
setting is empty, each research save triggers a (harmless) build.

## Local development

With the GitHub variables unset, `npm run dev` gives a local CMS that reads and
writes `content/blog/` and `public/blog/` in this checkout, so it can be used
without credentials. This mode is disabled in production. It covers Vioniche
only: this checkout is Vioniche's, so Born21 needs the GitHub App.

`SEARCH_CONSOLE_TEST_API_BASE` exists only for automated tests against a local
mock of Google. It is honoured only for a loopback address. Never set it on a
deployment.

## What the CMS will and won't write

- Only `content/blog/<slug>.mdx`, `public/blog/<slug>/<image>.(jpg|png|webp)`,
  `content/seo/keywords.json`, `content/seo/pages.json` and
  `content/seo/settings.json`, and for Born21 only the three SEO files, in its
  own repository. Any other path is refused before it reaches GitHub or the disk.
- Never Search Console tokens or performance data (see section 6).
- Article bodies are Markdown plus `<Figure />`. `import`, `export`, other
  components, HTML tags and `{expressions}` are refused, because MDX runs them
  as code when the site builds.
- A published article keeps its slug. A draft can be renamed; the old file is
  removed in the same commit.
- If a file changed on GitHub after it was opened in the editor, saving is
  refused instead of overwriting the other change. Unpublish and delete check
  the same way.
- Deleting removes only the article's own file and image folder, found by the
  article's validated slug.
