# Assemble Waitlist Design System

## Product character

Assemble is an AI talent search and outreach agent. It turns an idea into ideal personas, finds the right cofounder, employee, specialist, or complete team, manages outreach and replies, qualifies interest through a voice agent, and moves the strongest matches into a meeting. The site should feel ambitious, precise, and human: editorial enough to be memorable, technical enough to feel credible, and restrained enough to keep early access central.

## Visual direction

- Mix oversized editorial display type with compact, neutral sans-serif UI text.
- Use black, soft white, and one acid-yellow accent. Avoid gradients and generic AI-purple styling.
- Build the hero around a kinetic connection-map motif: names or initials connected by fine lines, with one highlighted match.
- Combine editorial cover energy with the precision of a premium AI product site without copying a reference layout.
- Keep corners at 6px or less. Use hairline borders and square technical labels.
- Use subtle motion only: drifting nodes, line reveals, and a soft pulse around the recommended match.

## Color tokens

Light mode:
- Canvas: #F4F3EE
- Surface: #FFFFFF
- Text: #111111
- Muted text: #65655F
- Border: rgba(17, 17, 17, 0.18)
- Accent: #E8FF3D

Dark mode:
- Canvas: #101010
- Surface: #171717
- Text: #F5F4EF
- Muted text: #A7A69F
- Border: rgba(245, 244, 239, 0.18)
- Accent: #E8FF3D

## Typography

- Display: an editorial serif such as Cormorant Garamond or Instrument Serif.
- UI/body: Inter or a similarly neutral grotesk.
- Labels: uppercase sans serif, 11-12px, letter spacing 0.08em.
- Do not use viewport-scaled font sizes; use responsive breakpoints and clamp only for bounded display sizing.

## Page structure

1. Compact top navigation with Assemble wordmark, status label, and icon-only theme toggle.
2. First viewport hero with a strong literal promise, short supporting copy, and the embedded Tally form.
3. Full-bleed network visualization integrated behind and around the hero content, not placed in a card.
4. Outcomes band covering cofounders, key hires, and complete teams.
5. Seven-stage workflow from idea understanding through voice qualification and meeting handoff.
6. Production footer linking Privacy & GDPR, Legal notice, Terms, and Cookies.

## Interaction requirements

- Functional light/dark toggle with system preference as the initial default and local preference persistence.
- Tally embed URL: https://tally.so/embed/kd19y6?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1
- Load Tally's embed script and keep the iframe responsive.
- Preserve keyboard focus styles and sufficient contrast in both themes.
- Mobile layout must show the product, headline, and form call-to-action in the first viewport, with no overlap.
