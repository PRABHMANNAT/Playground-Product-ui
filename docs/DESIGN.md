# Browserbase homepage design reference

Source: https://www.browserbase.com/
Inspected: 2026-10-25. Live browser screenshots and read-only DOM/computed styles, viewport 866 × 715 CSS pixels. Firecrawl extraction unavailable because account credits were exhausted. This is a homepage sample, not a full site or breakpoint audit. Screenshots were visually inspected in the browser; no screenshot file was saved.

## Visual direction

Editorial grid structure combined with retro computer graphics and precise developer-tool interfaces. White space, hairline blue-gray rules and flat rectangular modules create order. Orange highlights, dithered mountain scenery, and a pixelated vintage desktop computer provide personality. This interpretation is based on inspected pixels.

## Verified typography

Computed font-family aliases identify three families:

| Role | Family | Sample values at inspected viewport |
|---|---|---|
| Section and hero headings | GT Planar (`gtPlanar`) | 21px, weight 500, line-height 22.05–24.15px, tracking -0.21 to -0.42px |
| Body and UI | Plain (`plain`) | 16px, weights 400/500, sample line-heights 19.2–24px |
| CTA buttons | Plain | 16px, weight 500, 16px line-height, 0.16px tracking |
| Technical labels and text links | GT Standard Mono (`gtStandardMono`) | 14px, weight 500, 16.8px line-height; link tracking 0.84px |
| Demo tabs | GT Standard Mono | 12px, weight 400, 12px line-height, 0.48px tracking |

Text-link labels render uppercase with small triangular arrow marks. Heading phrases receive selective orange emphasis. Do not treat these compact viewport sizes as desktop-wide sizing. Font binaries and licensing were not collected.

## Verified palette

Values below were read from computed styles. Semantic names are descriptive, not original variable names.

| Role | Value |
|---|---|
| Main white surface | #FFFFFF |
| Primary text / primary button | #000000 |
| Brand orange / emphasis | #FF4500 |
| Secondary body text | #686562 |
| Pale blue panel / secondary CTA | #E1E9F2 |
| Blue-gray background and rule color | #C5D3E8 |
| Demo control blue | #5A78AF |
| Light demo surface | #F0F4F8 |
| Warm neutral logo tile surface | #F8F7F4 |
| Secondary warm neutral | #F1F0EC |

Hero art expands this palette with black, yellow, orange, green, and pale blue. Those artwork colors were visually observed, not sampled into exact tokens.

## Layout and spacing

- Centered main content with continuous vertical outer rules and horizontal section dividers.
- White header remains visible in sampled scrolled views; brand at left, hamburger navigation at right at the inspected width.
- Centered hero text sits over a pale blue textured landscape image, with an orange rectangular headline highlight and adjacent pill CTAs.
- Customer proof uses a three-column, two-row logo grid in this viewport.
- Product explanations stack large pale blue demo panels above concise descriptions and monospace links.
- Use cases form a two-column illustrated grid in inspected views.
- Sample content sections have approximately 60px vertical and 16px horizontal CSS padding; customer-logo section has 46px top and 60px bottom padding. These values apply only to the inspected viewport.
- Main layout is flat and structured by rules and whitespace. Heavy shadows are not the dominant separator in inspected sections.

## Components

- Primary CTA: black pill, white text, arrow; computed border radius 99px.
- Secondary CTA: pale blue pill, dark text, copy-style icon; computed border radius 99px.
- Feature blocks: square-edged pale panels, minimal decoration, short text below.
- Technical links: uppercase monospace, black, triangular arrow.
- Browser illustrations: simplified window chrome, three dots, tiny URL text, pale blue panels, oversized black cursor arrows and circular interaction targets.
- Demo tabs: flat, square-edged; selected tab blue with white text, unselected tabs white with blue text in inspected computed styles.
- Branding: orange square with a white B and black wordmark.

## Imagery and asset references

The artwork uses two complementary styles: expressive pixelated/dithered scenes and clean schematic browser-interface illustrations. Logos retain recognizable brand treatments. Product imagery makes browser automation tangible through windows, cursors, forms and search results.

| Asset | Observed use | Source |
|---|---|---|
| Hero poster | Pixelated mountain landscape, pale blue texture | https://www.browserbase.com/website-assets/homepage/hero-loopA-designer-mobile-poster.webp |
| Hero video source | Loop-enabled hero video element; playback behavior not independently tested | https://www.browserbase.com/website-assets/homepage/hero-loopA-designer-mobile-720x980.mp4 |
| Desktop computer artwork | Dithered vintage computer with landscape on screen and green/pink accents | https://cdn.sanity.io/images/yd6zslid/production/7a9e5efa5fdbc5e2f6eb0beaace67c9fd2e732e9-1828x826.png |
| Feature illustration asset example | SVG asset from the use-case illustration group | https://cdn.sanity.io/images/yd6zslid/production/1387d9957e8fec87004b2d79e94a94875bf0923e-294x270.svg |

These are asset references, not downloaded files. Several product-demo video elements have autoplay and loop enabled in the DOM. Animation timing and hover behavior were not tested.

## Homepage content sequence

Hero → customer logos → three product/API explanations → browser-as-interface statement and vintage computer artwork → use-case grid → tabbed agent demonstration → setup/code section → production-scale section → footer. Sequence is based on DOM content; visual inspection focused on the hero, customer logos, product panels, vintage computer, and use-case grid.

## Implementation guidance

Preserve the contrast between disciplined layout and playful artwork. Prioritize white surfaces, blue-gray dividing rules, orange highlights, the three-font hierarchy, flat browser diagrams, and pill-shaped top-level CTAs. Use monochrome technical text links for secondary actions. Keep artwork deliberately textured while interface illustrations remain crisp.

If recreating this direction, use licensed copies of the observed fonts or clearly mark substitutes as approximations. Establish a responsive spacing and type scale after inspecting wider and narrower layouts; do not extrapolate desktop styles from this single viewport. Exact breakpoint rules, hover transitions, font-loading success, complete image inventory, and motion/accessibility behavior remain unverified.
