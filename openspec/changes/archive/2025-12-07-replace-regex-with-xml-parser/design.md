# Design: Replace Regex with XML Parser

## Architecture Decision

### Parser Library Selection

**Chosen: `@xmldom/xmldom`**

| Library | Pros | Cons |
|---------|------|------|
| `@xmldom/xmldom` | Standard DOM API, mature, well-maintained | No querySelector (needs xpath or manual traversal) |
| `linkedom` | Full DOM API including querySelector, fast | Larger bundle, more features than needed |
| `fast-xml-parser` | Very fast, JSON output | Different API, no DOM manipulation |
| `cheerio` | jQuery-like, familiar | HTML-focused, XML support is secondary |

**Decision**: Use `@xmldom/xmldom` with helper functions for element selection. It's the most established XML parser for Node.js with a standard W3C DOM API.

### Implementation Strategy

#### 1. Parse SVG to DOM Document

```typescript
import { DOMParser } from '@xmldom/xmldom';

function parseSvgDocument(svgContent: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(svgContent, 'image/svg+xml');
}
```

#### 2. Element Selection Helpers

Since `@xmldom/xmldom` doesn't support `querySelector`, create helper functions:

```typescript
function findElementById(doc: Document, id: string): Element | null {
  return doc.getElementById(id);
}

function findElementByAttribute(
  parent: Element | Document,
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

function findElementByInkscapeLabel(
  doc: Document,
  tagName: string,
  label: string
): Element | null {
  return findElementByAttribute(doc, tagName, 'inkscape:label', label);
}
```

#### 3. Transform Parsing

Keep the transform string parsing logic (matrix, translate, rotate, scale) as it operates on attribute values, not XML structure. Extract the transform attribute via DOM, then parse the string.

#### 4. Element Cleaning

Replace regex-based attribute removal with DOM manipulation:

```typescript
function cleanElement(element: Element): Element {
  const clone = element.cloneNode(true) as Element;
  // Remove specific attributes
  const attrsToRemove = ['id', 'inkscape:label', 'sodipodi:nodetypes'];
  attrsToRemove.forEach(attr => clone.removeAttribute(attr));
  // Remove namespaced attributes by prefix
  // ... iterate attributes and remove those with inkscape: or sodipodi: prefix
  return clone;
}
```

#### 5. Serialization

Use `XMLSerializer` to convert cleaned elements back to strings for output:

```typescript
import { XMLSerializer } from '@xmldom/xmldom';

function elementToString(element: Element): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(element);
}
```

### Function Mapping

| Current Function | New Implementation |
|-----------------|-------------------|
| `extractViewBox()` | `doc.documentElement.getAttribute('viewBox')` |
| `extractCircleCenter()` | `findElementById()` or `findElementByInkscapeLabel()` + `getAttribute('cx'/'cy')` |
| `extractPathElement()` | `findElementById()` or `findElementByInkscapeLabel()` + `elementToString()` |
| `extractAllCircles()` | `doc.getElementsByTagName('circle')` + filter + clean |
| `extractAllVisualElements()` | Iterate specific tag names + filter + clean |
| `extractLabelZones()` | `doc.getElementsByTagName('text')` + filter by inkscape:label |
| `cleanSvgElement()` | DOM attribute manipulation + `XMLSerializer` |
| `cleanCircleElement()` | DOM attribute manipulation + `XMLSerializer` |
| `cleanTextElement()` | DOM attribute manipulation + `XMLSerializer` |

### Testing Strategy

1. **Unit tests**: Test each extraction function with sample SVG snippets
2. **Integration tests**: Ensure generated output SVGs are identical before/after refactor
3. **Visual validation**: Generate sample images and compare visually

### Rollback Plan

Keep the old regex-based implementation in a separate branch until the new implementation is validated in production use.
