# RARE SUPPLiyER

Online resale storefront. Shop current inventory.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Authentication (Supabase)

Customer accounts use **Supabase Auth**. Passwords never enter our database. Do not put a service-role key in this app.

### 1. Create a free Supabase project

1. Open [https://supabase.com](https://supabase.com) and create a project.
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` / public key

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

Set:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env` and `.env.local` are gitignored. Never commit real keys.

This is a Next.js app, so the public variables must be named `NEXT_PUBLIC_*` (not `VITE_*`).

### 3. Auth settings in Supabase

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000` (or `http://localhost:3001` if that port is used)
- Redirect URLs, add:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3001/auth/callback`
  - `http://localhost:3001/auth/confirm`

**Authentication → Providers → Email**

- Enable email signup
- Enable **Confirm email**
- Password requirements: keep the provider defaults (minimum 6 characters)

### 4. Database + Row Level Security

In the Supabase SQL Editor, run:

`supabase/schema.sql`

That creates:

- `profiles` (no passwords)
- `wishlists`
- `carts` (ready for later device sync)
- `orders` (read-only placeholder)
- RLS so a customer can only access their own rows
- A trigger that creates a profile when someone signs up

### 5. Run and test

```bash
npm run dev
```

1. Open `/signup` and create an account.
2. Confirm the email.
3. Sign in at `/login`.
4. Open `/account`. Refresh the page — you should stay signed in.
5. Sign out from **Settings**.
6. Request a reset from `/forgot-password`, open the email, set a new password, sign in again.
7. Visit `/account` while logged out — you should be sent to `/login` and returned after signing in.

Guests can still browse, search, filter, and use the cart without an account.

## Admin access

Staff access comes from `profiles.role` in Supabase, not from a special password in `.env`.

1. Sign up on the site with the owner email.
2. In the Supabase **SQL Editor**, paste the entire contents of `supabase/promote-admin.sql` and click **Run**.
3. Confirm the result row shows `role = admin` and `is_active = true`.
4. Sign out, sign back in, then open `/admin`.

That script also installs `ensure_owner_admin()`, which restores the owner account to admin on every sign-in so access does not drop after a refresh.

## Deploy on Vercel

1. Push this repo to GitHub (keep `.env.local` uncommitted).
2. Import the project in [Vercel](https://vercel.com/new). Framework preset: **Next.js**.
3. Add environment variables (Production, Preview, and Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` — your live URL, for example `https://your-app.vercel.app`
4. Deploy.
5. In **Supabase → Authentication → URL Configuration**:
   - Site URL: the same value as `NEXT_PUBLIC_SITE_URL`
   - Redirect URLs, add:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/auth/confirm`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/confirm`

Do not add a Supabase service-role key to Vercel.

## Adding Your Assets

Keep the existing logo at `public/assets/logo.png`.

| Folder | Use |
| --- | --- |
| `public/assets/logo.png` | Brand logo (do not replace with a generated mark) |
| `public/assets/brand/` | Extra brand graphics |
| `public/assets/promo/` | Promotional graphics |
| `public/assets/products/{SKU}/` | Product photos (`01.jpg`, `02.jpg`, condition shots) |

Then point each product’s `images` array in `src/data/products.ts` at those files.

Editable store copy lives in `src/content/site.ts`.

## Adding Products

Edit `src/data/products.ts` using the schema in `src/lib/types.ts`.

Admin (local catalog tools): `/admin/login`

## Architecture

```
src/
├── app/           # Pages
├── components/    # UI
├── content/       # Editable site copy
├── context/       # Auth, cart, wishlist, catalog
├── data/          # Seed inventory
└── lib/           # Types, Supabase, filters
```

## Future Integration

- Products: `src/data/products.ts` → API
- Cart: local now; `public.carts` is ready for later sync
- Checkout / payments / shipping: not connected yet
- Orders: `public.orders` is readable by the customer only
