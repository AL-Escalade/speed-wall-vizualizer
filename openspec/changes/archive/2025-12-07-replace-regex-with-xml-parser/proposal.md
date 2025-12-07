# Proposal: Replace Regex-based SVG Parsing with XML Parser

## Summary

Replace all regex-based SVG parsing in `hold-svg-parser.ts` with a proper XML/DOM parser library. This improves robustness, maintainability, and correctness of SVG parsing without changing external behavior.

## Motivation

The current implementation uses ~20 regex patterns to parse SVG files:
- Extract viewBox, width, height attributes
- Find elements by id or inkscape:label
- Parse transform attributes (matrix, translate, rotate, scale)
- Extract circle cx/cy attributes
- Clean elements by removing namespaced attributes
- Extract text content and label zones

**Problems with regex approach:**
1. **Fragile**: Regex can break on valid SVG variations (attribute order, whitespace, nested elements)
2. **Hard to maintain**: Complex regex patterns are difficult to read and modify
3. **Incomplete**: Some patterns don't handle all valid SVG syntax (e.g., single quotes vs double quotes handled inconsistently)
4. **No namespace support**: Inkscape namespaces are handled via string matching

**Benefits of XML parser:**
1. **Robust**: Handles any valid XML/SVG structure
2. **Readable**: DOM API (querySelector, getAttribute) is self-documenting
3. **Maintainable**: Standard API, easy to extend
4. **Correct**: Proper namespace handling

## Proposed Solution

Use `@xmldom/xmldom` (or `linkedom`) to parse SVG files as DOM documents, then use standard DOM APIs:
- `document.querySelector()` / `querySelectorAll()` to find elements
- `element.getAttribute()` to read attributes
- `element.textContent` for text content
- Proper namespace handling with `getAttributeNS()`

## Scope

- **In scope**: `src/hold-svg-parser.ts` - all SVG parsing functions
- **Out of scope**: SVG generation in `svg-generator.ts` (uses string concatenation, which is fine for output)

## Capabilities Affected

- **svg-parsing** (new): Defines how SVG files are parsed for hold data extraction

## Risks

- **Low**: Parser library adds ~50KB to node_modules
- **Low**: Slight performance overhead for DOM parsing vs regex (negligible for small SVG files)
