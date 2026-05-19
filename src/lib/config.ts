export const SECTION_NAME = process.env.NEXT_PUBLIC_SECTION_NAME ?? "ESN Section";
export const APP_TITLE = `${SECTION_NAME} Chapters`;
export const APP_TAGLINE = `The record of everyone who built ${SECTION_NAME}.`;
export const META_DESC = `The living record of ${SECTION_NAME}'s volunteer community.`;

/** First word of APP_TITLE highlighted in accent colour in the nav. */
const titleParts = APP_TITLE.split(" ");
export const NAV_TITLE_ACCENT = titleParts[0];
export const NAV_TITLE_REST = titleParts.slice(1).join(" ");
