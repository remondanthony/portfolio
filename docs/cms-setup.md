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
   (at least 12 characters) and prints an `ADMIN_PASSWORD_HASH=scrypt:…` line.
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
git log -1 --pretty=%s | grep -q '^Save draft:' && exit 0 || exit 1
```

## Local development

With the GitHub variables unset, `npm run dev` gives a local CMS that reads and
writes `content/blog/` and `public/blog/` in this checkout, so it can be used
without credentials. This mode is disabled in production.

## What the CMS will and won't write

- Only `content/blog/<slug>.mdx` and `public/blog/<slug>/<image>.(jpg|png|webp)`.
  Any other path is refused before it reaches GitHub or the disk.
- Article bodies are Markdown plus `<Figure />`. `import`, `export`, other
  components, HTML tags and `{expressions}` are refused, because MDX runs them
  as code when the site builds.
- A published article keeps its slug. A draft can be renamed; the old file is
  removed in the same commit.
- If a file changed on GitHub after it was opened in the editor, saving is
  refused instead of overwriting the other change.
