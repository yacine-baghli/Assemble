# Deploying Assemble

This website is a static deployment. It does not require a build step.

## Hosting configuration

- Project root: the `waitlist` directory
- Build command: leave empty
- Publish/output directory: `.`
- Entry file: `index.html`

The repository includes:

- `_headers` for security and cache headers on hosts that support this format, including Cloudflare Pages and Netlify.
- `404.html` for the not-found route.
- `robots.txt` allowing normal indexing.

## Post-deployment checks

1. Open the production HTTPS URL in light and dark mode.
2. Submit a non-production test address through Tally and confirm receipt.
3. Open every footer link and a nonexistent URL.
4. Verify that the domain serves `styles.css`, `app.js`, and the Tally iframe without browser-console errors.
5. Replace legal placeholders before treating the deployment as a legally complete public launch.

## Domain follow-up

Once the final domain is known, add canonical metadata and a sitemap using that exact origin. These are intentionally omitted now to avoid publishing incorrect URLs.
