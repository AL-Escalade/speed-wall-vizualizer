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
import type { HoldSvgData, Point, Dimensions, HoldTypeConfig, HoldTypesConfig } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'assets', 'holds');
const HOLDS_CONFIG_FILE = join(ASSETS_DIR, 'holds.json');

/** Cache for loaded SVG data */
const svgCache = new Map<string, HoldSvgData>();

/** Cache for hold type configurations */
let holdTypesConfigCache: HoldTypesConfig | null = null;

/**
 * Parse viewBox attribute
 * @param viewBox - viewBox string (e.g., "0 0 100 200")
 * @returns Parsed dimensions
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
 * Extract viewBox from SVG content
 * @param svgContent - SVG file content
 * @returns ViewBox dimensions
 */
function extractViewBox(svgContent: string): Dimensions {
  // Try viewBox attribute
  const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (viewBoxMatch) {
    return parseViewBox(viewBoxMatch[1]);
  }

  // Try width/height attributes
  const widthMatch = svgContent.match(/width\s*=\s*["']([0-9.]+)(?:mm)?["']/);
  const heightMatch = svgContent.match(/height\s*=\s*["']([0-9.]+)(?:mm)?["']/);
  if (widthMatch && heightMatch) {
    return {
      width: parseFloat(widthMatch[1]),
      height: parseFloat(heightMatch[1]),
    };
  }

  throw new Error('Could not determine SVG dimensions (no viewBox or width/height)');
}

/**
 * Parse a transform matrix from a transform attribute
 * Supports: matrix(a,b,c,d,e,f), translate(x,y), rotate(angle), scale(x,y)
 * @param transform - Transform attribute value
 * @returns Matrix components [a, b, c, d, e, f] or null if no transform
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
 * @param point - Original point
 * @param matrix - Transform matrix [a, b, c, d, e, f]
 * @returns Transformed point
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
 * @param matrix - Transform matrix [a, b, c, d, e, f]
 * @returns Rotation angle in degrees
 */
function extractRotationFromMatrix(matrix: [number, number, number, number, number, number]): number {
  const [a, b] = matrix;
  // For a rotation matrix: a = cos(θ), b = sin(θ)
  const radians = Math.atan2(b, a);
  return radians * (180 / Math.PI);
}

/**
 * Extract rotation from a transform attribute string
 * @param transform - Transform attribute value
 * @returns Rotation angle in degrees
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

/**
 * Extract circle center from SVG content
 * Supports both id="name" and inkscape:label="name" attributes
 * Applies any transform on the circle element to get actual coordinates
 * @param svgContent - SVG content
 * @param circleId - ID or label of the circle element
 * @returns Center point of the circle (after transform applied)
 */
function extractCircleCenter(svgContent: string, circleId: string): Point {
  // Match circle element with the given id or inkscape:label
  const patterns = [
    new RegExp(`<circle[^>]*id\\s*=\\s*["']${circleId}["'][^>]*(?:/>|>)`, 'i'),
    new RegExp(`<circle[^>]*inkscape:label\\s*=\\s*["']${circleId}["'][^>]*(?:/>|>)`, 'i'),
  ];

  let circleElement: string | null = null;

  for (const pattern of patterns) {
    const match = svgContent.match(pattern);
    if (match) {
      circleElement = match[0];
      break;
    }
  }

  if (!circleElement) {
    // Try finding all circles and checking each one
    const circleMatches = svgContent.match(/<circle[^>]*(?:\/?>)/gi) || [];
    for (const circle of circleMatches) {
      if (
        circle.includes(`id="${circleId}"`) ||
        circle.includes(`id='${circleId}'`) ||
        circle.includes(`inkscape:label="${circleId}"`) ||
        circle.includes(`inkscape:label='${circleId}'`)
      ) {
        circleElement = circle;
        break;
      }
    }
  }

  if (!circleElement) {
    throw new Error(`Circle with id or label "${circleId}" not found in SVG`);
  }

  const cxMatch = circleElement.match(/cx\s*=\s*["']([0-9.-]+)["']/);
  const cyMatch = circleElement.match(/cy\s*=\s*["']([0-9.-]+)["']/);

  if (!cxMatch || !cyMatch) {
    throw new Error(`Circle "${circleId}" missing cx or cy attributes`);
  }

  let center: Point = {
    x: parseFloat(cxMatch[1]),
    y: parseFloat(cyMatch[1]),
  };

  // Check for transform attribute and apply it
  const transformMatch = circleElement.match(/transform\s*=\s*["']([^"']+)["']/);
  if (transformMatch) {
    const matrix = parseTransformMatrix(transformMatch[1]);
    if (matrix) {
      center = applyTransform(center, matrix);
    }
  }

  return center;
}

/**
 * Simplify compound path by keeping only the first subpath
 * This converts outline shapes (with inner/outer boundaries) to solid shapes
 * @param d - SVG path d attribute value
 * @returns Simplified path with only the first subpath
 */
function simplifyCompoundPath(d: string): string {
  // Find the first 'z' or 'Z' (close path) and keep everything up to and including it
  const closeIndex = d.search(/[zZ]/);
  if (closeIndex !== -1) {
    // Check if there's another subpath after the first one
    const afterClose = d.substring(closeIndex + 1).trim();
    if (afterClose.match(/^[mM]/)) {
      // There's another subpath, keep only the first one
      return d.substring(0, closeIndex + 1);
    }
  }
  return d;
}

/**
 * Clean SVG element by removing Inkscape/Sodipodi namespaced attributes
 * and cleaning up style attributes
 * @param element - SVG element string
 * @returns Cleaned SVG element
 */
function cleanSvgElement(element: string): string {
  let cleaned = element
    // Remove sodipodi: attributes
    .replace(/\s+sodipodi:[a-z-]+\s*=\s*["'][^"']*["']/gi, '')
    // Remove inkscape: attributes
    .replace(/\s+inkscape:[a-z-]+\s*=\s*["'][^"']*["']/gi, '')
    // Remove xml:space attribute
    .replace(/\s+xml:space\s*=\s*["'][^"']*["']/gi, '')
    // Remove id attributes (not needed in output)
    .replace(/\s+id\s*=\s*["'][^"']*["']/gi, '')
    // Keep transform attribute - it's needed for the shape to render correctly
    // Remove fill from style attributes (will be set via fill attribute)
    .replace(/fill\s*:\s*[^;}"']+;?/gi, '')
    // Remove stroke from style attributes
    .replace(/stroke\s*:\s*[^;}"']+;?/gi, '')
    // Remove stroke-opacity from style attributes
    .replace(/stroke-opacity\s*:\s*[^;}"']+;?/gi, '')
    // Clean up empty style attributes
    .replace(/\s+style\s*=\s*["']\s*["']/gi, '')
    // Remove standalone fill attribute (will be added by generator)
    .replace(/\s+fill\s*=\s*["'][^"']*["']/gi, '');

  // Simplify compound paths to solid shapes
  cleaned = cleaned.replace(/d\s*=\s*"([^"]+)"/g, (_match, d) => {
    return `d="${simplifyCompoundPath(d)}"`;
  });

  return cleaned;
}

/**
 * Extract path element content and its rotation
 * Supports both id="name" and inkscape:label="name" attributes
 * @param svgContent - SVG content
 * @param pathId - ID or label of the path element
 * @returns Object with path element (cleaned, or null if not found) and rotation angle from transform
 */
function extractPathElement(svgContent: string, pathId: string): { element: string | null; rotation: number } {
  // Try different patterns for path and g elements with id or inkscape:label
  const patterns = [
    // path with id
    new RegExp(`<path[^>]*id\\s*=\\s*["']${pathId}["'][^>]*(?:/>|>[^<]*</path>)`, 'i'),
    // path with inkscape:label
    new RegExp(`<path[^>]*inkscape:label\\s*=\\s*["']${pathId}["'][^>]*(?:/>|>[^<]*</path>)`, 'i'),
    // g with id
    new RegExp(`<g[^>]*id\\s*=\\s*["']${pathId}["'][^>]*>[\\s\\S]*?</g>`, 'i'),
    // g with inkscape:label
    new RegExp(`<g[^>]*inkscape:label\\s*=\\s*["']${pathId}["'][^>]*>[\\s\\S]*?</g>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = svgContent.match(pattern);
    if (match) {
      const rawElement = match[0];
      // Extract rotation from transform before cleaning
      const transformMatch = rawElement.match(/transform\s*=\s*["']([^"']+)["']/);
      const rotation = extractRotation(transformMatch ? transformMatch[1] : null);
      return {
        element: cleanSvgElement(rawElement),
        rotation,
      };
    }
  }

  // Element not found - return null (no colored shape)
  return { element: null, rotation: 0 };
}

/**
 * Clean a circle element for output, preserving fill and stroke styles
 * @param element - Circle element string
 * @returns Cleaned circle element
 */
function cleanCircleElement(element: string): string {
  return element
    // Remove sodipodi: attributes
    .replace(/\s+sodipodi:[a-z-]+\s*=\s*["'][^"']*["']/gi, '')
    // Remove inkscape: attributes
    .replace(/\s+inkscape:[a-z-]+\s*=\s*["'][^"']*["']/gi, '')
    // Remove id attributes
    .replace(/\s+id\s*=\s*["'][^"']*["']/gi, '')
    // Keep style, fill, stroke attributes as they are
    .trim();
}

/**
 * Extract all circle elements (inserts, screw holes, etc.)
 * @param svgContent - SVG content
 * @returns Array of cleaned circle element strings
 */
function extractAllCircles(svgContent: string): string[] {
  const circles: string[] = [];

  // Find all circle elements
  const circleMatches = svgContent.match(/<circle[^>]*(?:\/?>)/gi) || [];

  for (const circle of circleMatches) {
    circles.push(cleanCircleElement(circle));
  }

  return circles;
}

/**
 * Extract all visual elements from SVG (for holds without "prise" element)
 * Excludes: svg wrapper, defs, metadata, namedview, and the insert circle
 * @param svgContent - SVG content
 * @returns Array of element strings
 */
function extractAllVisualElements(svgContent: string): string[] {
  const elements: string[] = [];

  // Extract content between <svg> tags
  const svgBodyMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!svgBodyMatch) return elements;

  const svgBody = svgBodyMatch[1];

  // Find all visual elements (path, rect, circle, text, g, etc.)
  // Exclude: defs, sodipodi:namedview, metadata
  const elementPatterns = [
    /<path[^>]*(?:\/>|>[\s\S]*?<\/path>)/gi,
    /<rect[^>]*(?:\/>|>[\s\S]*?<\/rect>)/gi,
    /<circle[^>]*(?:\/>|>[\s\S]*?<\/circle>)/gi,
    /<text[^>]*>[\s\S]*?<\/text>/gi,
    /<ellipse[^>]*(?:\/>|>[\s\S]*?<\/ellipse>)/gi,
    /<polygon[^>]*(?:\/>|>[\s\S]*?<\/polygon>)/gi,
    /<polyline[^>]*(?:\/>|>[\s\S]*?<\/polyline>)/gi,
    /<line[^>]*(?:\/>|>[\s\S]*?<\/line>)/gi,
  ];

  for (const pattern of elementPatterns) {
    const matches = svgBody.match(pattern) || [];
    for (const match of matches) {
      // Skip the insert circle (used for positioning only)
      if (match.includes('id="insert"') || match.includes("id='insert'")) {
        continue;
      }
      // Skip elements with id="prise" (should be handled separately)
      if (match.includes('id="prise"') || match.includes("id='prise'")) {
        continue;
      }
      elements.push(cleanCircleElement(match));
    }
  }

  return elements;
}

/**
 * Parse a hold SVG file
 * @param svgContent - SVG file content
 * @returns Parsed SVG data
 */
export function parseHoldSvg(svgContent: string): HoldSvgData {
  const viewBox = extractViewBox(svgContent);
  const insertCenter = extractCircleCenter(svgContent, 'insert');
  const { element: pathElement, rotation: svgRotation } = extractPathElement(svgContent, 'prise');

  // If no "prise" element, extract all visual elements (uncolored)
  // Otherwise, just extract circles (inserts, screw holes)
  const additionalElements = pathElement === null
    ? extractAllVisualElements(svgContent)
    : extractAllCircles(svgContent);

  return {
    pathElement,
    additionalElements,
    insertCenter,
    viewBox,
    svgRotation,
  };
}

/**
 * Load and parse a hold SVG file by type
 * @param holdType - Type of hold (e.g., "BIG", "FOOT")
 * @returns Parsed SVG data
 */
export async function loadHoldSvg(holdType: string): Promise<HoldSvgData> {
  const upperType = holdType.toUpperCase();

  // Check cache
  if (svgCache.has(upperType)) {
    return svgCache.get(upperType)!;
  }

  const filePath = join(ASSETS_DIR, `${upperType}.svg`);
  const content = await readFile(filePath, 'utf-8');
  const svgData = parseHoldSvg(content);

  // Cache the result
  svgCache.set(upperType, svgData);

  return svgData;
}

/**
 * Clear the SVG cache
 */
export function clearSvgCache(): void {
  svgCache.clear();
}

/**
 * Load hold types configuration from holds.json
 * @returns Hold types configuration
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
 * @param holdType - Type of hold (e.g., "BIG", "FOOT")
 * @returns Hold type configuration
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
 * @param holdType - Type of hold (e.g., "BIG", "FOOT")
 * @returns Default orientation angle in degrees
 */
export function getHoldDefaultOrientation(holdType: string): number {
  return getHoldTypeConfig(holdType).defaultOrientation;
}

/**
 * Get the dimensions for a hold type
 * @param holdType - Type of hold (e.g., "BIG", "FOOT")
 * @returns Hold dimensions in mm
 */
export function getHoldDimensions(holdType: string): Dimensions {
  return getHoldTypeConfig(holdType).dimensions;
}

/**
 * Clear the hold types configuration cache
 */
export function clearHoldTypesConfigCache(): void {
  holdTypesConfigCache = null;
}
