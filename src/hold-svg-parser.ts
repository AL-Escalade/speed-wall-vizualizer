/**
 * Parser for hold SVG files
 *
 * Hold SVG files must contain:
 * - A <path> or <g> element with id="prise" for the hold shape
 * - A <circle> element with id="insert" for the anchor point
 */

import { readFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { HoldSvgData, Point, Dimensions, HoldTypeConfig, HoldTypesConfig, LabelZones, ArrowDirection } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'assets', 'holds');
const HOLDS_CONFIG_FILE = join(ASSETS_DIR, 'holds.json');

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
// Transform Parsing (String-based - kept as-is)
// ============================================================================

/**
 * Parse a transform matrix from a transform attribute
 * Supports: matrix(a,b,c,d,e,f), translate(x,y), rotate(angle), scale(x,y)
 */
function parseTransformMatrix(transform: string | null): [number, number, number, number, number, number] | null {
  if (!transform) return null;

  // Handle matrix(a,b,c,d,e,f)
  const matrixMatch = transform.match(/matrix\s*\(\s*([0-9.e+-]+)\s*,\s*([0-9.e+-]+)\s*,\s*([0-9.e+-]+)\s*,\s*([0-9.e+-]+)\s*,\s*([0-9.e+-]+)\s*,\s*([0-9.e+-]+)\s*\)/i);
  if (matrixMatch) {
    return [
      parseFloat(matrixMatch[1]),
      parseFloat(matrixMatch[2]),
      parseFloat(matrixMatch[3]),
      parseFloat(matrixMatch[4]),
      parseFloat(matrixMatch[5]),
      parseFloat(matrixMatch[6]),
    ];
  }

  // Handle translate(x, y)
  const translateMatch = transform.match(/translate\s*\(\s*([0-9.e+-]+)\s*(?:,\s*([0-9.e+-]+))?\s*\)/i);
  if (translateMatch) {
    const tx = parseFloat(translateMatch[1]);
    const ty = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
    return [1, 0, 0, 1, tx, ty];
  }

  return null;
}

/**
 * Apply a transform matrix to a point
 */
function applyTransform(point: Point, matrix: [number, number, number, number, number, number]): Point {
  const [a, b, c, d, e, f] = matrix;
  return {
    x: a * point.x + c * point.y + e,
    y: b * point.x + d * point.y + f,
  };
}

/**
 * Extract rotation angle from a transform matrix
 */
function extractRotationFromMatrix(matrix: [number, number, number, number, number, number]): number {
  const [a, b] = matrix;
  const radians = Math.atan2(b, a);
  return radians * (180 / Math.PI);
}

/**
 * Extract rotation from a transform attribute string
 */
function extractRotation(transform: string | null): number {
  if (!transform) return 0;

  const matrix = parseTransformMatrix(transform);
  if (matrix) {
    return extractRotationFromMatrix(matrix);
  }

  // Handle rotate(angle) directly
  const rotateMatch = transform.match(/rotate\s*\(\s*([0-9.e+-]+)/i);
  if (rotateMatch) {
    return parseFloat(rotateMatch[1]);
  }

  return 0;
}

// ============================================================================
// Circle Extraction
// ============================================================================

/**
 * Extract circle center from SVG document
 */
function extractCircleCenter(doc: Document, circleId: string): Point {
  const circle = findElementByIdOrLabel(doc, 'circle', circleId);

  if (!circle) {
    throw new Error(`Circle with id or label "${circleId}" not found in SVG`);
  }

  const cx = circle.getAttribute('cx');
  const cy = circle.getAttribute('cy');

  if (!cx || !cy) {
    throw new Error(`Circle "${circleId}" missing cx or cy attributes`);
  }

  let center: Point = {
    x: parseFloat(cx),
    y: parseFloat(cy),
  };

  // Apply transform if present
  const transform = circle.getAttribute('transform');
  if (transform) {
    const matrix = parseTransformMatrix(transform);
    if (matrix) {
      center = applyTransform(center, matrix);
    }
  }

  return center;
}

/**
 * Extract all circle elements
 */
function extractAllCircles(doc: Document): string[] {
  const circles: string[] = [];
  const elements = doc.getElementsByTagName('circle');

  for (let i = 0; i < elements.length; i++) {
    const circle = elements[i].cloneNode(true) as Element;
    removeUnwantedAttributes(circle);
    circles.push(elementToString(circle));
  }

  return circles;
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
  const transform = element.getAttribute('transform');
  const rotation = extractRotation(transform);

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
// Label Zones Extraction
// ============================================================================

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

    // Clone and clean the text element
    const clone = textElement.cloneNode(true) as Element;
    removeUnwantedAttributes(clone, false); // Keep id for text elements? No, remove it
    removeUnwantedAttributes(clone, true);

    zones[zoneKey] = { element: elementToString(clone) };
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
  const insertCenter = extractCircleCenter(doc, 'insert');
  const { element: pathElement, rotation: svgRotation } = extractPathElement(doc, 'prise');
  const labelZones = extractLabelZones(doc);

  // If no "prise" element, extract all visual elements (uncolored)
  // Otherwise, just extract circles (inserts, screw holes)
  const additionalElements = pathElement === null
    ? extractAllVisualElements(doc)
    : extractAllCircles(doc);

  return {
    pathElement,
    additionalElements,
    insertCenter,
    viewBox,
    svgRotation,
    labelZones,
  };
}

// ============================================================================
// File Loading Functions
// ============================================================================

/**
 * Load and parse a hold SVG file by type
 */
export async function loadHoldSvg(holdType: string): Promise<HoldSvgData> {
  const upperType = holdType.toUpperCase();

  if (svgCache.has(upperType)) {
    return svgCache.get(upperType)!;
  }

  const filePath = join(ASSETS_DIR, `${upperType}.svg`);
  const content = await readFile(filePath, 'utf-8');
  const svgData = parseHoldSvg(content);

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
 * Load hold types configuration from holds.json
 */
export function loadHoldTypesConfig(): HoldTypesConfig {
  if (holdTypesConfigCache) {
    return holdTypesConfigCache;
  }

  try {
    const content = readFileSync(HOLDS_CONFIG_FILE, 'utf-8');
    holdTypesConfigCache = JSON.parse(content) as HoldTypesConfig;
    return holdTypesConfigCache;
  } catch (error) {
    throw new Error(`Failed to load hold types configuration from ${HOLDS_CONFIG_FILE}: ${error}`);
  }
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
 * Clear the hold types configuration cache
 */
export function clearHoldTypesConfigCache(): void {
  holdTypesConfigCache = null;
}
