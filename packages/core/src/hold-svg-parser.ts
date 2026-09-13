/**
 * Parser for hold SVG files
 *
 * Hold SVG files must contain:
 * - A <path> or <g> element with id="prise" for the hold shape, or a
 *   <rect inkscape:label="pad"> for uncolored holds (STOP)
 * - A <circle> or <ellipse> element with id="insert" for the anchor point
 *
 * Label zones (<text inkscape:label="label-up|down|left|right|label">) give a
 * direction and an angle, not a position: the tspan x/y is the text centre
 * (text-anchor: middle is required), the label is pushed from the insert
 * toward it, and the <text> transform is the text angle. Font size, baseline
 * and style of the zone are ignored.
 */

import { DOMParser, XMLSerializer, type Document, type Element } from '@xmldom/xmldom';
import type { HoldSvgData, Point, Dimensions, HoldTypeConfig, HoldTypesConfig, LabelZones, ArrowDirection } from './types.js';
import { HOLD_SVG_CONTENT, HOLD_TYPES_CONFIG } from './bundled-assets.js';
import { applyMatrix, matrixRotation, multiplyMatrices, parseTransformList, IDENTITY_MATRIX, type Matrix } from './svg-transform.js';
import { flattenFirstSubpath } from './hold-outline.js';

/** Cache for loaded SVG data */
const svgCache = new Map<string, HoldSvgData>();

/** Cache for hold type configurations */
let holdTypesConfigCache: HoldTypesConfig | null = null;

// ============================================================================
// DOM Parser Infrastructure
// ============================================================================

/**
 * Parse SVG content into a DOM Document
 */
function parseSvgDocument(svgContent: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(svgContent, 'image/svg+xml');
}

/**
 * Find an element by attribute value within a parent
 */
function findElementByAttribute(
  parent: Document | Element,
  tagName: string,
  attrName: string,
  attrValue: string
): Element | null {
  const elements = parent.getElementsByTagName(tagName);
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].getAttribute(attrName) === attrValue) {
      return elements[i];
    }
  }
  return null;
}

/**
 * Find an element by id or inkscape:label
 */
function findElementByIdOrLabel(
  doc: Document,
  tagName: string,
  idOrLabel: string
): Element | null {
  // Try by id first
  const byId = findElementByAttribute(doc, tagName, 'id', idOrLabel);
  if (byId) return byId;

  // Try by inkscape:label
  return findElementByAttribute(doc, tagName, 'inkscape:label', idOrLabel);
}

/**
 * Find an element by id or inkscape:label across multiple tag names
 */
function findElementByIdOrLabelMultiTag(
  doc: Document,
  tagNames: string[],
  idOrLabel: string
): Element | null {
  for (const tagName of tagNames) {
    const element = findElementByIdOrLabel(doc, tagName, idOrLabel);
    if (element) return element;
  }
  return null;
}

/**
 * Serialize a DOM element to string
 */
function elementToString(element: Element): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(element);
}

/**
 * Remove namespaced and unwanted attributes from an element (in place)
 */
function removeUnwantedAttributes(element: Element, removeId: boolean = true): void {
  const attrsToRemove: string[] = [];
  const attrs = element.attributes;

  for (let i = 0; i < attrs.length; i++) {
    const attrName = attrs[i].name;
    // Remove inkscape:* and sodipodi:* attributes
    if (attrName.startsWith('inkscape:') || attrName.startsWith('sodipodi:')) {
      attrsToRemove.push(attrName);
    }
    // Remove xml:space
    if (attrName === 'xml:space') {
      attrsToRemove.push(attrName);
    }
    // Remove id if requested
    if (removeId && attrName === 'id') {
      attrsToRemove.push(attrName);
    }
  }

  attrsToRemove.forEach(attr => element.removeAttribute(attr));

  // Recursively clean child elements
  const children = element.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) { // Element node
      removeUnwantedAttributes(child as Element, removeId);
    }
  }
}

/**
 * Remove fill and stroke from style attribute
 */
function cleanStyleAttribute(element: Element): void {
  const style = element.getAttribute('style');
  if (style) {
    const cleanedStyle = style
      .replace(/fill\s*:\s*[^;}"']+;?/gi, '')
      .replace(/stroke\s*:\s*[^;}"']+;?/gi, '')
      .replace(/stroke-opacity\s*:\s*[^;}"']+;?/gi, '')
      .trim();

    if (cleanedStyle) {
      element.setAttribute('style', cleanedStyle);
    } else {
      element.removeAttribute('style');
    }
  }

  // Remove standalone fill attribute
  element.removeAttribute('fill');
}

// ============================================================================
// ViewBox and Dimensions
// ============================================================================

/**
 * Parse viewBox attribute
 */
function parseViewBox(viewBox: string): Dimensions {
  const parts = viewBox.split(/\s+/).map(Number);
  if (parts.length !== 4) {
    throw new Error(`Invalid viewBox format: ${viewBox}`);
  }
  return {
    width: parts[2],
    height: parts[3],
  };
}

/**
 * Extract viewBox from SVG document
 */
function extractViewBox(doc: Document): Dimensions {
  const svg = doc.documentElement;

  if (!svg) {
    throw new Error('SVG document has no root element');
  }

  // Try viewBox attribute
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    return parseViewBox(viewBox);
  }

  // Try width/height attributes
  const width = svg.getAttribute('width');
  const height = svg.getAttribute('height');
  if (width && height) {
    return {
      width: parseFloat(width.replace(/mm$/, '')),
      height: parseFloat(height.replace(/mm$/, '')),
    };
  }

  throw new Error('Could not determine SVG dimensions (no viewBox or width/height)');
}

// ============================================================================
// Circle Extraction
// ============================================================================

/**
 * Extract insert point center from SVG document.
 * Supports <circle> and <ellipse> elements with the given id/label.
 */
function extractInsertCenter(doc: Document, insertId: string): Point {
  const element = findElementByIdOrLabelMultiTag(doc, ['circle', 'ellipse'], insertId);

  if (!element) {
    throw new Error(`Circle or ellipse with id or label "${insertId}" not found in SVG`);
  }

  const cx = element.getAttribute('cx');
  const cy = element.getAttribute('cy');

  if (!cx || !cy) {
    throw new Error(`Element "${insertId}" missing cx or cy attributes`);
  }

  const center: Point = {
    x: parseFloat(cx),
    y: parseFloat(cy),
  };

  return applyMatrix(parseTransformList(element.getAttribute('transform')), center);
}

/**
 * Extract all circle and ellipse elements (inserts, screw holes)
 */
function extractAllCirclesAndEllipses(doc: Document): string[] {
  const result: string[] = [];

  for (const tagName of ['circle', 'ellipse']) {
    const elements = doc.getElementsByTagName(tagName);
    for (let i = 0; i < elements.length; i++) {
      const clone = elements[i].cloneNode(true) as Element;
      removeUnwantedAttributes(clone);
      result.push(elementToString(clone));
    }
  }

  return result;
}

// ============================================================================
// Path/Shape Extraction
// ============================================================================

/**
 * Simplify compound path by keeping only the first subpath
 */
function simplifyCompoundPath(d: string): string {
  const closeIndex = d.search(/[zZ]/);
  if (closeIndex !== -1) {
    const afterClose = d.substring(closeIndex + 1).trim();
    if (afterClose.match(/^[mM]/)) {
      return d.substring(0, closeIndex + 1);
    }
  }
  return d;
}

/**
 * Clean a path element's d attribute
 */
function cleanPathD(element: Element): void {
  const d = element.getAttribute('d');
  if (d) {
    element.setAttribute('d', simplifyCompoundPath(d));
  }

  // Recursively clean child paths
  const paths = element.getElementsByTagName('path');
  for (let i = 0; i < paths.length; i++) {
    const childD = paths[i].getAttribute('d');
    if (childD) {
      paths[i].setAttribute('d', simplifyCompoundPath(childD));
    }
  }
}

/**
 * Extract path element content and its rotation
 */
function extractPathElement(doc: Document, pathId: string): { element: string | null; rotation: number } {
  const element = findElementByIdOrLabelMultiTag(doc, ['path', 'g'], pathId);

  if (!element) {
    return { element: null, rotation: 0 };
  }

  // Extract rotation from transform before cleaning
  const rotation = matrixRotation(parseTransformList(element.getAttribute('transform')));

  // Clone and clean the element
  const clone = element.cloneNode(true) as Element;
  removeUnwantedAttributes(clone);
  cleanStyleAttribute(clone);
  cleanPathD(clone);

  return {
    element: elementToString(clone),
    rotation,
  };
}

// ============================================================================
// Visual Elements Extraction
// ============================================================================

/**
 * Check if an element should be skipped (insert circle, prise, label zones)
 */
function shouldSkipElement(element: Element): boolean {
  const id = element.getAttribute('id');
  const label = element.getAttribute('inkscape:label');

  // Skip insert circle
  if (id === 'insert') return true;

  // Skip prise element
  if (id === 'prise' || label === 'prise') return true;

  // Skip label zone text elements
  if (label && label.startsWith('label')) return true;

  return false;
}

/**
 * Extract all visual elements from SVG
 */
function extractAllVisualElements(doc: Document): string[] {
  const elements: string[] = [];
  const visualTags = ['path', 'rect', 'circle', 'text', 'ellipse', 'polygon', 'polyline', 'line'];

  for (const tagName of visualTags) {
    const nodeList = doc.getElementsByTagName(tagName);
    for (let i = 0; i < nodeList.length; i++) {
      const element = nodeList[i];

      if (shouldSkipElement(element)) continue;

      const clone = element.cloneNode(true) as Element;
      removeUnwantedAttributes(clone);
      elements.push(elementToString(clone));
    }
  }

  return elements;
}

// ============================================================================
// Outline Extraction
// ============================================================================

function pathPolygon(path: Element, matrix: Matrix): Point[] {
  return flattenFirstSubpath(path.getAttribute('d') ?? '').map((p) => applyMatrix(matrix, p));
}

/** Transforms from `root` (included) down to `element` (included) */
function chainMatrix(root: Element, element: Element): Matrix {
  const chain: Element[] = [];
  let node: Element | null = element;
  while (node !== null) {
    chain.unshift(node);
    node = node === root ? null : (node.parentNode as Element | null);
  }
  return chain.reduce(
    (matrix, current) => multiplyMatrices(matrix, parseTransformList(current.getAttribute('transform'))),
    IDENTITY_MATRIX
  );
}

/** The pad rect, grown by half its stroke on each side */
function padPolygon(pad: Element): Point[] {
  const x = parseFloat(pad.getAttribute('x') ?? '0');
  const y = parseFloat(pad.getAttribute('y') ?? '0');
  const width = parseFloat(pad.getAttribute('width') ?? '0');
  const height = parseFloat(pad.getAttribute('height') ?? '0');
  const strokeInStyle = /stroke-width\s*:\s*([\d.]+)/.exec(pad.getAttribute('style') ?? '');
  const stroke = strokeInStyle ? parseFloat(strokeInStyle[1]) : parseFloat(pad.getAttribute('stroke-width') ?? '0');
  const half = stroke / 2;
  const matrix = parseTransformList(pad.getAttribute('transform'));
  return [
    { x: x - half, y: y - half },
    { x: x + width + half, y: y - half },
    { x: x + width + half, y: y + height + half },
    { x: x - half, y: y + height + half },
  ].map((p) => applyMatrix(matrix, p));
}

/**
 * Extract the hold outline, in the asset frame.
 * - <path> prise: its first subpath, through its own transform
 * - <g> prise: one polygon per descendant <path>, through the transforms
 *   from the <g> (included) down to the path (included)
 * - no prise (STOP): the "pad" rect
 * Parent group transforms are ignored, exactly as the rendering ignores them.
 */
function extractOutline(doc: Document): Point[][] {
  const prise = findElementByIdOrLabelMultiTag(doc, ['path', 'g'], 'prise');
  if (prise !== null && prise.tagName === 'path') {
    return [pathPolygon(prise, parseTransformList(prise.getAttribute('transform')))];
  }
  if (prise !== null) {
    const polygons: Point[][] = [];
    const paths = prise.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
      polygons.push(pathPolygon(paths[i], chainMatrix(prise, paths[i])));
    }
    return polygons;
  }
  const pad = findElementByIdOrLabel(doc, 'rect', 'pad');
  if (pad === null) {
    throw new Error('Hold SVG has neither a "prise" shape nor a "pad" rect to outline');
  }
  return [padPolygon(pad)];
}

// ============================================================================
// Label Zones Extraction
// ============================================================================

/**
 * Effective text-anchor of a zone: the tspan's own value, else the text's
 * (style first, then attribute); SVG's default is start.
 */
function effectiveTextAnchor(text: Element, tspan: Element | null): string {
  const elements = tspan === null ? [text] : [tspan, text];
  for (const element of elements) {
    const inStyle = /text-anchor\s*:\s*([a-z]+)/i.exec(element.getAttribute('style') ?? '');
    if (inStyle) return inStyle[1];
    const attribute = element.getAttribute('text-anchor');
    if (attribute) return attribute;
  }
  return 'start';
}

/**
 * Extract label zones from SVG document
 */
function extractLabelZones(doc: Document): LabelZones {
  const zones: LabelZones = {};

  const labelMap: Record<string, ArrowDirection | 'default'> = {
    'label-up': 'up',
    'label-down': 'down',
    'label-left': 'left',
    'label-right': 'right',
    'label': 'default',
  };

  const textElements = doc.getElementsByTagName('text');

  for (let i = 0; i < textElements.length; i++) {
    const textElement = textElements[i];
    const inkscapeLabel = textElement.getAttribute('inkscape:label');

    if (!inkscapeLabel) continue;

    const zoneKey = labelMap[inkscapeLabel];
    if (!zoneKey) continue;

    const tspan = textElement.getElementsByTagName('tspan').item(0);
    if (effectiveTextAnchor(textElement, tspan) !== 'middle') {
      throw new Error(`Label zone "${inkscapeLabel}" must be centred (text-anchor: middle)`);
    }
    const positioned = tspan ?? textElement;
    const position = {
      x: parseFloat(positioned.getAttribute('x') ?? ''),
      y: parseFloat(positioned.getAttribute('y') ?? ''),
    };
    if (Number.isNaN(position.x) || Number.isNaN(position.y)) {
      throw new Error(`Label zone "${inkscapeLabel}" has no x/y position`);
    }
    const matrix = parseTransformList(textElement.getAttribute('transform'));

    zones[zoneKey] = {
      anchor: applyMatrix(matrix, position),
      angle: matrixRotation(matrix),
    };
  }

  return zones;
}

// ============================================================================
// Main Parse Function
// ============================================================================

/**
 * Parse a hold SVG file
 */
export function parseHoldSvg(svgContent: string): HoldSvgData {
  const doc = parseSvgDocument(svgContent);

  const viewBox = extractViewBox(doc);
  const insertCenter = extractInsertCenter(doc, 'insert');
  const { element: pathElement, rotation: svgRotation } = extractPathElement(doc, 'prise');
  const labelZones = extractLabelZones(doc);
  const outline = extractOutline(doc);

  // If no "prise" element, extract all visual elements (uncolored)
  // Otherwise, just extract circles/ellipses (inserts, screw holes)
  const additionalElements = pathElement === null
    ? extractAllVisualElements(doc)
    : extractAllCirclesAndEllipses(doc);

  return {
    pathElement,
    additionalElements,
    insertCenter,
    viewBox,
    svgRotation,
    labelZones,
    outline,
  };
}

// ============================================================================
// File Loading Functions
// ============================================================================

/**
 * Load and parse a hold SVG by type (from bundled assets)
 */
export async function loadHoldSvg(holdType: string): Promise<HoldSvgData> {
  const upperType = holdType.toUpperCase();

  if (svgCache.has(upperType)) {
    return svgCache.get(upperType)!;
  }

  const content = HOLD_SVG_CONTENT[upperType];
  if (!content) {
    throw new Error(`Unknown hold type: ${holdType}. Available types: ${Object.keys(HOLD_SVG_CONTENT).join(', ')}`);
  }

  let svgData: HoldSvgData;
  try {
    svgData = parseHoldSvg(content);
  } catch (error) {
    throw new Error(`Invalid hold SVG "${upperType}": ${(error as Error).message}`, { cause: error });
  }
  svgCache.set(upperType, svgData);

  return svgData;
}

/**
 * Clear the SVG cache
 */
export function clearSvgCache(): void {
  svgCache.clear();
}

// ============================================================================
// Hold Types Configuration
// ============================================================================

/**
 * Load hold types configuration (from bundled assets)
 */
export function loadHoldTypesConfig(): HoldTypesConfig {
  if (holdTypesConfigCache) {
    return holdTypesConfigCache;
  }

  holdTypesConfigCache = HOLD_TYPES_CONFIG;
  return holdTypesConfigCache;
}

/**
 * Get configuration for a specific hold type
 */
export function getHoldTypeConfig(holdType: string): HoldTypeConfig {
  const config = loadHoldTypesConfig();
  const upperType = holdType.toUpperCase();

  if (!config[upperType]) {
    throw new Error(`Unknown hold type: ${holdType}. Available types: ${Object.keys(config).join(', ')}`);
  }

  return config[upperType];
}

/**
 * Get the default orientation for a hold type
 */
export function getHoldDefaultOrientation(holdType: string): number {
  return getHoldTypeConfig(holdType).defaultOrientation;
}

/**
 * Get the dimensions for a hold type
 */
export function getHoldDimensions(holdType: string): Dimensions {
  return getHoldTypeConfig(holdType).dimensions;
}

/**
 * Get the label margin for a hold type
 */
export function getHoldLabelMargin(holdType: string): number {
  return getHoldTypeConfig(holdType).labelMargin ?? 0;
}

/**
 * Check if a hold type should show an arrow indicator
 * @param holdType - The hold type name (e.g., "BIG", "FOOT", "STOP")
 * @returns true if the hold type should show an arrow (default: true)
 */
export function getHoldShowArrow(holdType: string): boolean {
  return getHoldTypeConfig(holdType).showArrow ?? true;
}

/**
 * Get the color forced for a hold type, regardless of its route's color.
 * Used to keep finish pads dark whatever the route they belong to.
 * @param holdType - The hold type name (e.g., "BIG", "FOOT", "STOP")
 * @returns The forced color, or undefined when the route's color applies
 */
export function getHoldTypeColor(holdType: string): string | undefined {
  return getHoldTypeConfig(holdType).color;
}

/**
 * Clear the hold types configuration cache
 */
export function clearHoldTypesConfigCache(): void {
  holdTypesConfigCache = null;
}
