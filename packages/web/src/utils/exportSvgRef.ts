/**
 * Module-level ref to share the full SVG content string between
 * the Viewer (producer) and useSvgExport (consumer) without DOM injection.
 * This avoids triggering browser extension MutationObservers (e.g. 1Password).
 */
let _svgContent: string | null = null;

export function setExportSvgContent(svg: string | null): void {
  _svgContent = svg;
}

export function getExportSvgContent(): string | null {
  return _svgContent;
}
