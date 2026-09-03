# Ars Electronica Festival 2026 UI/UX principles

## Contents

1. Design character
2. Experience priorities
3. Visual language
4. Navigation and orientation
5. Page patterns
6. Responsive behavior
7. Accessibility and inclusion
8. Anti-patterns
9. Review checklist
10. Provenance

## 1. Design character

Combine institutional clarity with public-festival energy. The experience should feel editorial, civic, contemporary, and culturally confident—not corporate, luxurious, or conventionally “futuristic.”

Use a two-layer identity:

- **Ars Electronica frame:** calm, direct, predominantly black and white, typographically disciplined, and clearly connected to the parent institution.
- **Festival or sub-event expression:** saturated color, bold typographic statements, documentary media, and a more energetic rhythm.

Favor directness over decoration. Large type, flat color, photography, strong cropping, and generous space do the expressive work. Let the sub-event introduce one distinctive idea while remaining visibly part of the festival.

## 2. Experience priorities

Design every page to answer these questions quickly:

1. What is this?
2. When and where does it happen?
3. Why is it relevant?
4. What can I explore or do next?

Support two visitor modes:

- **Discovery:** understand the theme, atmosphere, artists, and cultural proposition.
- **Planning:** find program items, dates, locations, access information, and tickets with minimal friction.

Keep evocative storytelling and practical information distinct but adjacent. Do not make visitors pass through a manifesto to reach logistics.

## 3. Visual language

### Color

Use warm festival orange `#E73E07` as the main identity field for the 2026 theme. It works best as a large, flat plane with white or near-black type, not as a small decorative accent scattered everywhere.

Use the festival's secondary colors by role:

- green `#00A885` for program and discovery;
- magenta `#D51A5E` for places and movement through the city;
- plum `#AB439A` for services, context, or reflective passages;
- salmon `#F36C7A` for tickets and high-intent actions.

Use near-black `#1D1E1F`, white `#FFFFFF`, soft gray `#EDEDED`, mid gray `#777777`, and light borders `#DCDCDC` for the institutional frame and long-form content.

Treat color as architecture: full-width bands, navigation zones, section identities, and major callouts. Avoid gradients and arbitrary tints. Keep a page dominated by one identity color plus neutrals; introduce the secondary palette only when it conveys structure.

Always pair color with a text label, symbol, or position. Verify contrast for the actual type size and weight; deepen a color or change the text color when needed.

### Typography

Use **IBM Plex Sans** as the defining typeface. Let its regular, medium, semibold, bold, and italic voices create hierarchy without adding another display family.

Build identity through contrast within one family:

- set manifesto phrases in uppercase with deliberate line breaks;
- alternate bold and regular weights to create cadence;
- use large, plain-spoken headings with tight conceptual phrasing;
- keep body copy calm, comfortably spaced, and easy to scan;
- use captions consistently and visibly for artworks, artists, venues, and photographers.

Use `//` sparingly as a textual separator where it strengthens the festival voice. Avoid faux-terminal treatments, excessive monospacing, or generic sci-fi typography.

#### Festival theme mark

The festival theme must always be written as `NEGOTIATING HUMANITY`. When it
appears inside paragraph or body text, italicize the complete two-word phrase:
*NEGOTIATING HUMANITY*. Label-style uses such as headers and navigation remain
roman. Do not depend on visual text transformation alone; the underlying text
must also be uppercase so copying, indexing, and assistive output preserve the
canonical spelling. `Future Begins` is a separate title and remains roman
unless another context explicitly requires emphasis.

### Composition and rhythm

Use three spatial modes:

- **Reading width:** a focused editorial column for prose.
- **Wide width:** photography, paired media, schedules, and structured content.
- **Full bleed:** identity heroes, atmospheric media, quotes, and color fields.

Prefer asymmetrical two-column compositions in which media occupies roughly two thirds and text one third. Alternate the media side between sections to create rhythm. On long pages, punctuate content with generous vertical breathing room and occasional full-width color fields.

Keep edges crisp. Use square, 3:2, and 16:9 crops as a deliberate system. Favor thin rules and flat surfaces over rounded cards, floating panels, shadows, or glass effects.

Use rectangular actions with plain labels and either a solid field or a thin outline. Their authority should come from placement and contrast, not ornament.

### Imagery

Prioritize documentary festival photography: people encountering art, installations in use, performances, urban venues, and the relationship between bodies and technology. Images should feel observed and specific, not like stock photography.

Use bold crops and consistent aspect ratios within a group. Pair images to suggest dialogue or contrast. Give credits the same care as other content metadata.

Use abstract or generated imagery only when it expresses the sub-event's own curatorial idea. Do not imitate “AI art” tropes, neon cyberpunk, chrome objects, or anonymous digital texture.

## 4. Navigation and orientation

Maintain a quiet white institutional header with clear Ars Electronica affiliation, language choice, search when justified by content volume, and access to the wider ecosystem. Keep it visually compact and separate from event storytelling.

Place the local festival or sub-event navigation directly below it. Keep the top-level choices few, task-oriented, and stable. For a festival-scale experience, the observed model is:

- Program
- Locations
- Services
- Tickets

On wide screens, present these destinations as a compact, centered strip of equal segments rather than another full institutional header. For a smaller sub-event, preserve the intent rather than all four labels. A useful local set might be Program, Artists, Visit, and About. Keep the highest-intent action visually distinct.

Make local navigation persistent when pages are long or planning-heavy. Show the current section clearly. Use a full-screen white menu for the wider Ars Electronica ecosystem rather than mixing global and local links in one crowded row. Organize that menu as a typographic multi-column index and mark the current ecosystem area with one quiet neutral field.

On small screens, prioritize recognition and thumb reach. Shorten labels only when meaning remains clear, and expose all essential destinations without horizontal guesswork.

## 5. Page patterns

### Landing page

Open with a large identity field that states the sub-event name, its relationship to Ars Electronica 2026, date, and place. Follow it with a compact practical introduction and one primary action.

Build the body from alternating media-and-text stories, one full-width thematic statement, a milestone or “what happens when” section, and a clear route into the program. End with practical updates or newsletter content only when useful.

### Editorial or theme page

Use an atmospheric full-width hero with a concise title. Darken photography only enough to support white type, place the title near the lower center, and keep the image credit visible. Follow with a strong thesis, then a focused reading column. Break long passages with pull quotes, full-width media, or paired images. Preserve intellectual depth without producing an unbroken wall of text.

### Program page

Lead with date and place before interpretation. Give filters and browsing controls clear priority once real program data is available. Make day, time, title, location, format, language, and availability scannable in that order of need.

Group content by a mental model visitors understand: day, location hub, or format. Avoid asking users to decode internal curatorial structures. Preserve selections and make the empty state useful.

### Location page

Start with a city-level overview and explain how the sub-event relates to the festival hubs. Use a stable color-and-symbol identity for each hub or venue group, then combine short orientation text, address/access facts, and documentary venue imagery.

The observed hub language is intentionally elementary and memorable: plum square for OK QUARTER, orange circle for MED CAMPUS, and green triangle for DANUBE TRIANGLE. Reuse these only when referring to the official hubs; invent an equally simple but distinct set for sub-event-specific zones.

Make the transition from “what is here?” to “how do I get there?” effortless. Keep accessibility, transport, opening times, and ticket requirements close to the venue description.

### Event detail page

Put title, date/time, venue, format, participants, language, and admission near the top. Follow with the curatorial description and credits. Keep the action—save, reserve, buy, or add to plan—visible without overpowering the cultural content.

## 6. Responsive behavior

Recompose rather than shrink. On narrow screens:

- bring the section heading before its media;
- stack media and text in the order that best supports comprehension;
- keep identity typography bold but prevent awkward orphaned words;
- preserve generous spacing while shortening excessively tall visual passages;
- turn paired imagery into a deliberate sequence;
- keep planning actions and local navigation easy to reach;
- avoid carousels when a simple vertical list communicates the same content better.

Use mobile-specific crops for identity artwork when the wide composition loses meaning.

## 7. Accessibility and inclusion

Aim for WCAG AA as a baseline. Preserve visible focus, keyboard access, reduced-motion preferences, meaningful headings, useful alt text, and readable captions.

Do not inherit accessibility weaknesses from the reference site. Check every saturated color pairing, especially white text on green, orange, salmon, or magenta. Never encode a hub, status, or category by color alone.

Support German and English without assuming equal string length. Keep language switching predictable and retain the equivalent page and user context whenever possible.

Separate essential information from motion. Animated festival footage may add atmosphere, but the page must communicate fully when it is paused, unavailable, or reduced.

## 8. Anti-patterns

Avoid:

- generic SaaS dashboards and card grids;
- rounded “pill” interfaces as the dominant motif;
- soft gradients, glassmorphism, glow, and decorative shadows;
- cyberpunk, hacker, robot, or AI-generated futurism clichés;
- excessive animation or scroll choreography;
- tiny uppercase text used for essential information;
- color used as decoration without structural meaning;
- dense prose without editorial pacing;
- hiding dates, locations, prices, or access details behind marketing language;
- copying the parent site so literally that the sub-event has no identity.

## 9. Review checklist

Before approving a concept, verify that:

- the page's purpose, date, place, and primary next step are immediately clear;
- the design visibly belongs to Ars Electronica Festival 2026;
- one sub-event idea is memorable without fighting the parent identity;
- hierarchy works before color and imagery are considered;
- color roles remain consistent and are never the sole carrier of meaning;
- IBM Plex Sans is used with expressive but disciplined weight contrast;
- every occurrence of the festival theme is uppercase, and occurrences inside
  paragraph or body text are italicized as *NEGOTIATING HUMANITY*;
- media is specific, credited, and meaningfully cropped;
- global and local navigation are distinct;
- planning information is easier to access than promotional copy;
- mobile is a deliberate composition rather than a compressed desktop page;
- contrast, focus, language, motion, and text alternatives are addressed;
- the result feels editorial and civic, not like a tech product template.

## 10. Provenance

These principles were derived from the official [Ars Electronica Festival 2026 “Future Begins / *NEGOTIATING HUMANITY*” site](https://ars.electronica.art/negotiatinghumanity/en/) and its home, theme, program, and locations pages as observed on 2026-07-13. They describe visual and UX patterns; they do not grant rights to logos, photographs, artwork, or other protected assets and do not replace official brand approval.
