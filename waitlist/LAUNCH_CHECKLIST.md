# Assemble Production Launch Checklist

## Tally form

The website cannot override the appearance or accessibility of the cross-origin Tally form. Complete these changes in the Tally editor for form `kd19y6`:

- Rename the email field to `Work email` so it is no longer exposed as `Untitled email field`.
- Change the submit button label from `Submit` to `Join early access`.
- Add an unchecked required checkbox with this copy: `I agree to receive Assemble product news and marketing emails. I can unsubscribe at any time.`
- Add a text block linking to `privacy.html` before submission.
- Match the form colors and typography to the Assemble light and dark surfaces.
- Keep the embedded form's base theme set to light while the current site-side dark-mode filter is enabled. If native Tally dark styling or custom CSS is added later, remove the `.dark .tally-frame` filter from `styles.css`.
- Use Tally Pro to remove `Made with Tally`; official Tally documentation states branding removal is a Pro feature.
- Keep the transparent background, hidden title, left alignment, and dynamic height embed settings.
- Configure an unsubscribe-capable email provider and retain proof of consent.
- Delete prospect data on withdrawal and apply the stated three-year retention schedule.

## Legal identity

Replace every placeholder in the legal pages with verified details:

- Registered company name, legal form, capital, address, SIREN/RCS, and VAT number.
- Publication director, contact email, telephone, and privacy contact.
- Hosting company legal name, address, and telephone.
- Email delivery provider and any relevant international-transfer information.
- Applicable law and competent courts.

## Before paid SaaS launch

- Obtain legal review of the privacy notice, legal notice, cookie notice, and terms.
- Publish SaaS subscription terms or CGV covering pricing, billing, cancellation, service levels, liability, and customer category.
- Add a consent-management platform before loading any non-essential analytics or advertising tracker.
- Document explicit authorization for voice cloning or avatar use and provide clear disclosure to every lead who interacts with an AI agent.

## Static deployment

- Publish the `waitlist` directory as the site root. No build command is required.
- Keep `_headers`, `404.html`, `robots.txt`, `styles.css`, and `app.js` in the published root.
- After choosing the production domain, add canonical URLs and a sitemap using that final domain.
- Test the Tally submission and unsubscribe workflow on the deployed HTTPS domain before announcing the site.
