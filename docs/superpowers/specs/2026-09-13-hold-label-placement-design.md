# Placement des étiquettes de prises sans chevauchement

Date : 2026-09-13
Statut : revu (revue adversariale, 13 points intégrés), en attente de validation

## Problème

Les étiquettes de prises (`M1`, `P3`…) sont dessinées à la main dans chaque asset
(`assets/holds/*.svg`) : quatre `<text>` Inkscape (`label-up`, `label-down`,
`label-left`, `label-right`, ou un seul `label` pour le STOP). Le générateur
(`svg-generator.ts`, `generateHold`) choisit la zone selon la direction de la
flèche, réécrit le texte, la couleur et la taille par regex, force
`dominant-baseline="hanging"`, puis place l'élément **dans le groupe transformé de
la prise**.

Ce placement ne vaut que pour la taille de police du dessin (12,7 px). Quand on
grossit le texte (`holdLabelFontSize`, curseur web limité à 80), il grandit depuis
un point fixe (haut-centre) et :

1. recouvre **sa propre prise** dans certaines orientations (M4, N4, M1 sur un
   rendu IFSC + U15-DE à 120 px) ;
2. recouvre les **prises voisines** : l'étiquette M2 disparaît sous la prise M1 ;
   comme elle a la couleur de la prise, elle devient invisible dès qu'elle la
   touche.

## Objectif

Pouvoir afficher les étiquettes **beaucoup plus grosses** (jusqu'à 200 px) sans
qu'elles touchent :

- leur propre prise — **garantie absolue** ;
- les autres prises et les autres étiquettes — au mieux, avec un repli explicite.

## Décisions

| Question | Décision |
|---|---|
| Portée de l'évitement | Prises et étiquettes de prises. Flèches, zones d'adhérence et leurs étiquettes exclues. |
| Orientation | L'étiquette suit la prise, comme aujourd'hui (inclinaison héritée des assets, jusqu'à environ ±95° en bord de secteur). |
| Forme de la prise | Contour réel (chemin `prise` converti en polygone), pas la boîte englobante. |
| Pas de place libre | Moindre chevauchement ; même taille pour toutes les étiquettes. |
| Algorithme | Rayon partant du centre du cercle `insert` (point de fixation), dans la direction de l'ancre Inkscape ; si rien n'est libre, éventail de directions autour de l'insert ; sinon repli. |
| Rôle de l'ancre Inkscape | Elle ne donne que la **direction** (insert → ancre) et l'**angle** du texte ; la distance est calculée. |
| Ordre de placement | Haut du mur d'abord, indépendant de l'ordre des sections. |

Approches écartées :

- **B seul** : la revue a montré qu'il ne résout pas le cas M1/M2 (prises
  parallèles à 280 mm, rayon de M2 pointé vers M1) ; aucune place libre avant
  ≈ 400 mm à 120 px.
- **Rayon partant de l'ancre Inkscape** (première version de cette spec) :
  conservait la distance dessinée dans l'asset, mais cette distance n'a de sens
  qu'à 12,7 px. Partir de l'insert rend le rayon identique aux directions de
  l'éventail et donne les mêmes résultats en simulation.
- **Optimisation globale** (recuit simulé) : non déterministe sans graine, lent,
  difficile à tester.

Simulation de revue (algorithme ci-dessous, rayon partant de l'insert, avant la
correction de `STOP.svg`) — « B seul » désigne le rayon sans éventail :

| Configuration | Taille | Replis B seul | Replis B + éventail | Via l'éventail |
|---|---|---|---|---|
| IFSC | 120 px | 3 | 0 | 2 / 32 |
| IFSC + U15-DE | 120 px | 7 | 0 | 5 / 79 |
| IFSC + U15-DE | 200 px | 5 | 0 | 5 / 79 |
| U15 | 200 px | 3 | 0 | 2 / 30 |

## Conception

### 1. Géométrie

**Contour d'une prise** — nouveau module `packages/core/src/hold-outline.ts`.

- Source : l'élément `prise` que `extractPathElement` trouve déjà. On garde le
  **premier sous-chemin** de chaque `<path>` (même règle que
  `simplifyCompoundPath`, c'est le contour extérieur de la BIG).
- Commandes gérées : `M/m C/c S/s L/l H/h V/v Z/z`. **Répétition implicite** :
  des jeux de paramètres supplémentaires sans nouvelle lettre répètent la
  commande ; après `M/m`, les paires supplémentaires valent `L/l`. Tous les
  assets en dépendent. Toute autre commande (`A/a`, `Q/q`, `T/t`) lève une
  erreur.
- Les Bézier cubiques sont découpées en 8 segments.
- `hold-outline` lève ses erreurs sans nom d'asset ; `loadHoldSvg` les enveloppe
  en y ajoutant le type de prise.
- Sans élément `prise` (STOP) : le contour est le `<rect inkscape:label="pad">`
  (`x`, `y`, `width`, `height`, agrandi de `stroke-width / 2` de chaque côté).
  Si `pad` manque aussi, erreur.

`HoldSvgData` gagne `outline: Point[][]` (repère de l'asset), calculé dans
`parseHoldSvg`, donc mis en cache par type par `loadHoldSvg`.

**Transforms lues pour le contour et l'ancre.** Une liste de fonctions
composées de gauche à droite parmi `matrix`, `translate`, `rotate(a[, cx, cy])`
et `scale(sx[, sy])`. Toute autre forme (`skewX/Y`…) lève une erreur.
`parseTransformMatrix` est étendue en conséquence (`scale(-1)`, utilisé par
`FOOT.svg` sur `label-right`, est aujourd'hui lu comme une rotation nulle) ; le
test existant `rotate(45, 50, 50)` → `svgRotation` 45 reste vert. Les transforms
des **groupes parents** de `prise`, des zones et de l'insert sont ignorées,
exactement comme au rendu (seul l'élément est extrait, sans ses parents).

- `prise` est un `<path>` : sa propre `transform` est appliquée.
- `prise` est un `<g>` : chaque `<path>` descendant donne un polygone, transformé
  par la composition de la chaîne, de la `transform` du `<g>` (incluse) jusqu'à
  celle du chemin (incluse).

**Ancre d'étiquette.** `LabelZone` passe de `{ element: string }` à
`{ anchor: Point; angle: number }`. L'ancre ne fixe pas la position de
l'étiquette : elle donne la direction de poussée depuis l'insert (§2).

- `anchor` = `(x, y)` du `<tspan>` (à défaut du `<text>`), transformé par la
  `transform` du `<text>` ;
- `angle` = rotation extraite de cette `transform` (degrés SVG, 0 si absente).

**Contrat d'asset** : le `(x, y)` d'une zone est le **centre horizontal** du
texte ; le `text-anchor` effectif (style du `<tspan>`, à défaut du `<text>`)
vaut `middle`. Taille de police, baseline et style de la zone sont ignorés.
L'élément Inkscape n'est plus recopié.

**Modification d'asset — `assets/holds/STOP.svg`.** La zone `label` est
aujourd'hui ancrée à gauche (`text-anchor:start`, `x = −1,35`) à la hauteur de
l'insert : la direction insert → ancre serait horizontale et `PAD-U15`
sortirait du mur à 200 px. Elle est recentrée sous l'insert : `x = 119.3675`
sur `<text>` et `<tspan>`, `text-anchor:middle` et `text-align:center`, `y`
inchangé (262.596). Alors `anchor − insert = (0 ; 3,37)`, le rayon descend. Puis
`bun run generate:assets`.

**Boîte d'étiquette** — rectangle orienté centré sur un point, dans le repère du
mur (mm) :

- hauteur `h = fontSize` ;
- largeur `w` = longueur du **texte affiché** (sortie de `formatHoldLabel`, ou
  numéro composé) × 0,65 × `fontSize` (estimation volontairement large : core ne
  peut pas mesurer une police, et `'Lucida Grande'` est remplacée hors macOS) ;
- pour **tous** les tests de collision, la boîte est gonflée de
  `0,15 × fontSize` de chaque côté ; les obstacles ne sont pas gonflés ;
- une étiquette dont le texte affiché est vide n'émet aucun `<text>`, n'est pas
  placée et n'est pas un obstacle.

**Primitive géométrique unique** — nouveau module
`packages/core/src/polygon-clip.ts`, fonctions pures :

- `clipPolygon(subject, convexClip)` : Sutherland–Hodgman ;
- `polygonArea(points)` : formule du lacet, valeur absolue ;
- `overlapArea(subject, box) = polygonArea(clipPolygon(subject, box))` ;
- `aabb(points)` et `aabbIntersects(a, b)` pour le préfiltrage.

La boîte (convexe) découpe le contour (éventuellement concave) : c'est la
configuration où Sutherland–Hodgman est correct. Les arêtes dégénérées produites
sur un sujet concave ont une aire nulle ; l'aire reste exacte. Une aire sous
`1e-6` mm² signifie « pas d'intersection ». `clipPolygon` normalise le sens de
parcours de la boîte, pour ne pas dépendre de l'enroulement.

### 2. Placement

Nouveau module `packages/core/src/label-placement.ts`, fonctions pures. Il ne
connaît ni le SVG ni les assets : il reçoit des polygones et des boîtes en
coordonnées du mur.

```ts
interface LabelRequest {
  holdIndex: number;      // index dans holds (composition)
  text: string;           // texte affiché
  ownOutline: Point[][];  // repère du mur
  anchor: Point;          // repère du mur, donne seulement la direction
  insert: Point;          // repère du mur, origine de toutes les directions
  angle: number;          // θ, voir ci-dessous
}

interface LabelPlacement {
  holdIndex: number;
  text: string;
  center: Point;
  angle: number;
  width: number;          // boîte non gonflée
  height: number;
  direction: 'ray' | number; // 'ray' ou déviation de l'éventail en degrés
  d: number;              // distance insert → centre, mm
  d0: number;
  fallback: boolean;
  ownOverlap: number;     // mm², boîte gonflée
  otherOverlap: number;   // mm², boîte gonflée
}

function placeHoldLabels(
  requests: LabelRequest[],
  outlines: Point[][][],  // contours de toutes les prises, par holdIndex
  fontSize: number
): LabelPlacement[];
```

**Angle.** `θ = zone.angle − rotation`, en degrés SVG (sens horaire, Y vers le
bas). `rotation` vient de `calculateHoldRotation` (anti-horaire, Y vers le
haut ; le rendu de la prise applique déjà `rotate(-rotation)`). θ est la valeur
écrite dans `rotate(θ, x, y)`. Coins de la boîte :
`C + [[cos θ, −sin θ], [sin θ, cos θ]] · (±w/2, ±h/2)`.

**Ordre de placement.** Tri stable indépendant de l'ordre des sections : `y` de
l'insert croissant dans le repère SVG (haut du mur d'abord), puis `x`
croissant, puis `holdIndex`. Le résultat est renvoyé dans l'ordre de `requests`.

**Directions candidates.** Toutes partent de l'**insert** (centre du cercle
`insert` de l'asset, transformé dans le repère du mur), dans cet ordre :

1. **Rayon** : `u = (anchor − insert) / |anchor − insert|` ; si
   `|anchor − insert| < 1 mm`, `u = (0, 1)` (vers le bas du mur).
2. **Éventail** : `u` tournée de
   `+22,5°, −22,5°, +45°, −45°, …, +157,5°, −157,5°, 180°` (15 directions).

**Pour chaque direction** `v`, centre candidat `C(d) = insert + d · v` :

- **Décollage** : `d₀` = premier `d ∈ {0, 5, 10, …}` (mm) où
  `overlapArea(ownOutline, boîte gonflée en C(d))` est nulle. Borne :
  `d_max` = plus grande distance de l'insert aux sommets de `ownOutline` +
  demi-diagonale de la boîte gonflée + 5 mm ; au-delà aucune intersection n'est
  géométriquement possible, donc ne pas avoir décollé à `d_max` est une erreur
  interne, jamais une conséquence de la taille.
- **Fenêtre** : `d ∈ [d₀, d₀ + 2 × fontSize]`, par pas de 5 mm. Un candidat
  n'est **admissible** que si son chevauchement avec sa propre prise est nul (le
  contour propre est retesté à chaque pas : sur une prise concave, un bras peut
  recouper le rayon après `d₀`).
- **Libre** : admissible, et ne chevauche ni une autre prise, ni une étiquette
  déjà placée. Le test s'arrête au premier obstacle d'aire positive.

**Choix** : le premier candidat libre, en parcourant les directions dans l'ordre
puis `d` croissant. Les directions suivantes ne sont pas explorées.

**Repli** (aucun candidat libre dans aucune direction) : parmi tous les
candidats admissibles, on calcule la somme exacte des aires de chevauchement
avec les autres prises et étiquettes ; on retient le **premier** (même ordre de
parcours) dont la somme est `≤ 1,05 × minimum + 1 mm²`. Cela évite de s'éloigner
jusqu'au bout de la fenêtre pour un gain négligeable.

La boîte retenue (non gonflée) devient un obstacle pour les étiquettes
suivantes.

**Préfiltrage** : un obstacle n'est découpé que si son AABB intersecte celle de
la boîte gonflée.

Conséquences assumées :

- Les étiquettes sont deux à deux sans chevauchement hors repli : chaque
  étiquette évite toutes celles placées avant elle.
- Chaque étiquette se pose **au plus près de sa prise** dans sa direction
  (contour + marge) : la distance dessinée dans Inkscape n'est plus utilisée. À
  40 px, le centre de la boîte finit en médiane à 13 mm de l'ancre Inkscape
  (simulation IFSC, IFSC + U15-DE, U15). PAD descend sous le pad. **Toutes les
  étiquettes de `docs/images` bougent.**
- La fenêtre borne l'éloignement à `2 × fontSize` au-delà du décollage, soit
  400 mm à 200 px (plus de trois pas d'insert). Elle ne garantit pas
  l'association visuelle : une étiquette peut finir plus près d'une autre prise
  que de la sienne.
- Coût : le cas nominal s'arrête au premier candidat libre ; seul le repli
  calcule toutes les aires (jusqu'à 16 directions × 81 pas à 200 px).

### 3. Rendu

**Normalisation de la taille** : `generateSvg` normalise `holdLabelFontSize` —
une valeur non finie ou `≤ 0` devient 40 (défaut), une valeur `> 200` devient
200 (maximum du curseur ; au-delà, la plupart des étiquettes passent en repli
et le coût explose : 15 s à 1000 px sur IFSC + U15-DE). La même valeur
normalisée est passée aux étiquettes des zones d'adhérence.

**Deux temps** :

1. `layoutHoldLabels(config, holds, options): Promise<LabelPlacement[]>`
   (`svg-generator.ts`, exportée par `index.ts`) : pour chaque prise, contour et
   ancre transformés dans le repère du mur (même matrice que le rendu :
   `translate · rotate(−rotation) · scale · translate(−insertCenter)`), angle θ,
   texte affiché ; puis `placeHoldLabels`.
2. `generateSvg` consomme ces placements et écrit les étiquettes.

Chaque étiquette est écrite **dans le repère du mur**, hors du groupe de la prise :

```svg
<text x="…" y="…" transform="rotate(θ, x, y)" text-anchor="middle"
      dominant-baseline="central" font-size="…"
      font-family="'Lucida Grande', sans-serif" font-weight="500"
      fill="…">M1</text>
```

- La réécriture par regex de l'élément Inkscape (bloc `if (labelZone)`) et la
  branche de repli « sous la prise » disparaissent : une prise sans zone prend
  l'insert comme ancre et passe par le même algorithme.
- Le calque `<g id="hold-labels">` reste au-dessus des prises.

`placeHoldLabels`, `layoutHoldLabels` et les types `LabelRequest`,
`LabelPlacement` sont exportés par `packages/core/src/index.ts`. Le type exporté
`LabelZone` change de forme ; aucun autre package ne l'utilise.

### 4. Web

- `packages/web/src/components/Sidebar.tsx` : le curseur « Taille des noms de
  prises » passe de `20–80` à `20–200` (pas de 5). Défaut inchangé (40) : aucune
  configuration existante ne change, aucune migration. Le curseur règle aussi la
  taille des étiquettes de zone (comportement existant).
- `urlConfig.ts` n'est pas modifié : la normalisation est faite dans core, elle
  couvre aussi les imports, localStorage et le CLI.
- Suppression de `packages/web/src/components/sidebarComponents/DisplayOptions.tsx`,
  copie morte (non importée, libellé codé en dur, max 80).

### 5. CLI, assets et documentation

- CLI inchangé (il appelle `generateSvg`).
- `bun run generate:assets` après la modification de `STOP.svg`.
- En-tête de `hold-svg-parser.ts` et `CLAUDE.md` : nouvelle section « Hold Label
  Placement » décrivant le contrat des zones `label-*` (ancre = x/y du tspan =
  centre du texte et sert seulement de direction depuis l'insert, angle =
  transform du `<text>`, `text-anchor:middle` obligatoire, taille/baseline/style
  ignorés) et l'algorithme (rayon depuis l'insert, éventail, repli, ordre haut
  d'abord).
- `docs/images/*.svg` régénérées (`bun run generate:doc-images`).

## Tests

TDD, fichiers co-localisés, Vitest.

- `hold-outline.test.ts` :
  - carré absolu → 4 sommets ; même carré en relatif (`m l h v z`) → même
    polygone ; `m 0,0 10,0 10,10 0,10 z` → le carré (répétition après `m`) ;
  - un `C` suivi de 12 nombres → 3 courbes (3 × 8 segments) passant par leurs
    3 extrémités ;
  - transforms : `rotate` centré, liste `translate(..) rotate(..)`,
    `scale(-1)`, `skewX` qui lève, `<g>` `prise` porteur d'une transform ;
  - `A` lève une erreur ;
  - pour chaque asset embarqué, aire du contour (repère de l'asset) à 1 % près :
    BIG 18 417,3 ; FOOT 3 024,3 ; BIG-DE15 4 123,8 ; FOOT-DE15 300,5 ; AABB de
    BIG ≈ [20,2 ; 10,5]–[199,84 ; 274,14] ; le contour STOP contient les 4 coins
    du rect `pad` rendu.
- `hold-svg-parser.test.ts` : `scale(-1)` → rotation 180° ; zones exposées en
  `{ anchor, angle }` ; chaque zone de chaque asset embarqué a un `text-anchor`
  effectif `middle`.
- `polygon-clip.test.ts` : disjoints → 0 ; contenu → aire du plus petit ; moitié
  → moitié ; polygone concave en L découpé par un rectangle → aire exacte ;
  boîte parcourue dans les deux sens → même aire.
- `label-placement.test.ts` (formes synthétiques) :
  - sans obstacle → `d = d₀`, `direction = 'ray'`, centre sur la demi-droite
    insert → ancre ;
  - la boîte à `d = 0` (sur l'insert) chevauche sa prise → poussée à `d₀`,
    `ownOverlap = 0`, et à `d₀ − 5` elle la chevauchait ;
  - la distance de l'ancre à l'insert n'influe pas sur le résultat (même
    direction, ancre deux fois plus loin → même placement) ;
  - voisine sur le rayon dans la fenêtre → arrêt juste après ;
  - rayon bloqué sur toute la fenêtre, place libre à +22,5° → `direction = 22.5` ;
  - obstacles partout → `fallback`, `ownOverlap = 0`, jamais sous `d₀` ;
  - chevauchement décroissant le long du rayon avec un gain < 5 % → le repli
    retient le premier candidat ;
  - une seconde étiquette évite la première ;
  - `anchor ≈ insert` → poussée vers le bas ;
  - permuter `requests` ne change pas le résultat.
- `svg-generator.test.ts` :
  - via `layoutHoldLabels` : chaque type de prise × 4 directions, au centre et
    aux deux bords de secteur (rotation centre ± 44°), à 40 et 200 px →
    `ownOverlap === 0` ;
  - BIG `label-down` à rotation 26,57° → `rotate(≈ −67,8, …)` émis ;
  - un seul test au niveau SVG : `x`, `y` et `rotate(θ, x, y)` émis égalent
    `center` et `angle` du placement ;
  - étiquette vide : aucun `<text>`, et la voisine garde le même placement qu'en
    son absence ;
  - `holdLabelFontSize` = 850 et 5000 donnent 200 ; `NaN` et `0` donnent 40 ;
  - `id="hold-labels"` conservé.
- Régression voies de référence — `packages/cli/src/reference-routes/label-placement.test.ts`
  (les voies se chargent côté cli ; core est importé compilé). Configuration :
  `wall: { lanes: 2, panelsHeight: 10 }`, routes `ifsc` en `laneOffset` 0 et
  `u15-de` en `laneOffset` 1. À 40, 120 et 200 px :
  - `ownOverlap === 0` pour chaque étiquette ;
  - nombre de `fallback` ≤ un plafond documenté (valeur mesurée à
    l'implémentation, 0 d'après la simulation), jamais une égalité exacte ;
  - M2 (IFSC) et H2 (U15-DE) ne sont pas en repli ;
  - inverser l'ordre des routes donne un placement identique ;
  - les étiquettes `SN8 STOP D7 D7 @PAD-U15` (`u15`) et `SN6 STOP B3`
    (`u11-u13`), dans leur propre configuration, ont leur boîte entièrement
    dans le mur à 200 px.
- `Sidebar.test.tsx` : le curseur accepte 200.

Vérification finale : `bun run lint`, `bun run build`, `bun run test`,
`bun run generate:doc-images`, puis relecture visuelle dans l'app web
(`bun run dev:web`) à 40 px et à 200 px, sur IFSC + U15-DE avec les zones
d'adhérence affichées, en surveillant la fluidité du curseur.

## Limites connues

- Le bord du mur n'est pas un obstacle : une étiquette poussée près du bord peut
  en sortir (dans la marge des coordonnées ou hors du SVG).
- Les flèches et les zones d'adhérence peuvent être recouvertes.
- Les étiquettes des zones d'adhérence partagent `holdLabelFontSize` : elles
  atteignent aussi 200 mm (en gras), ne sont pas placées par l'algorithme et ne
  sont pas des obstacles ; elles peuvent recouvrir des prises et des étiquettes
  de prise. Leur découplage est hors périmètre.
- La largeur du texte est estimée ; une police de repli plus large que
  `0,65 em` par caractère peut produire un chevauchement de quelques mm que la
  marge de `0,15 em` doit absorber.
- La garantie « ne touche pas sa propre prise » porte sur le contour découpé
  (8 segments par Bézier) ; l'écart à la courbe réelle est absorbé par la marge.
