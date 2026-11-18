# RamyaChobi Website Two — deployment and isolation checklist

This repository is a separate code copy of `apurbabhaiya/Apurba-Roy`. The original repository was not changed. The copied Vercel configuration no longer redirects the admin route to the old website.

## Verified code checks
- Install: `npm ci`
- TypeScript: `npm run lint`
- Production frontend build: `npm run build`
- GitHub Actions: `Validate RamyaChobi`

## Publish as a NEW Vercel project
1. In Vercel, select **Add New → Project**, then **Import Git Repository**.
2. Choose `apurbabhaiya/RamyaChobi-website-two`, NOT `Apurba-Roy`.
3. Use the **Vite** framework preset, build command `npm run build`, output directory `dist`, install command `npm ci`.
4. Configure environment variables (see `.env.example`) for Production, Preview and Development as appropriate.
5. Deploy and test the homepage plus direct-navigation routes such as `/packages`, `/portfolio`, `/booking` and `/delivery-admin`.
6. Configure a distinct Vercel domain/project. Do not transfer the old domain until the new site is fully tested.

## VERY IMPORTANT: the backend is NOT isolated yet
The copied code contains fallback URLs/keys for the **original Supabase project**. Without new Supabase environment variables, the copied app may read or modify the SAME database as the original website.

For a completely independent site:
1. Create a new Supabase project.
2. Apply the required migrations in `supabase/migrations/` in the correct chronological order and deploy required Supabase Edge Functions.
3. Create dedicated storage buckets and configure database security policies/RLS and auth providers.
4. In the NEW Vercel project only, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the NEW Supabase project.
5. Configure server-side `SUPABASE_SERVICE_ROLE_KEY` and Google Drive OAuth/refresh token credentials in Vercel environment settings **only**; never commit secrets.
6. Update OAuth redirect URLs and allowed frontend domains for the new Vercel deployment.
7. Test admin login, booking, portfolio upload, client galleries, photo selection, payment review, and authorized original downloads with non-production test data.

## Known follow-up
- Static TypeScript/build checks passing does not prove every runtime feature works.
- The imported app can still have security and runtime issues; production validation requires separate backends and end-to-end checks.
- Dependency audits should be reviewed before accepting customer data or payment details.
- Face search and Drive delivery should be verified independently; handoff notes describe prior implementation limitations.
