# Internationalisation des labels de prises

Date : 2026-08-30
Statut : validé, prêt pour la planification d'implémentation

## Problème

Les labels de prises (`@M1`, `@P3`, `@N1`, `@Q2`, `@PAD`) sont aujourd'hui des
chaînes opaques rendues telles quelles, du plan SVG jusqu'aux sélecteurs de la
barre latérale. Ces lettres sont pourtant des abréviations françaises : `M` pour
Main, `P` pour Pied, `N` pour une main ajoutée par rapport à la voie officielle
IFSC, `Q` pour un pied ajouté. Un utilisateur anglophone attend `H` (Hand) et
`F` (Foot).

Le problème est déjà visible dans les données : les voies allemandes et
italiennes (`u15-de`, `u11-u13-de`, `u11-u13-it`, `u13-de`, `u15-it`) sont
écrites avec la convention anglo-allemande `H`/`F`/`I`/`G`, la voie indienne
`u13-u15-in` utilise `R` pour un pied ajouté, et les voies françaises utilisent
`M`/`P`/`N`/`Q`. L'application affiche donc aujourd'hui trois conventions
linguistiques différentes selon la voie choisie, quelle que soit la langue de
l'interface.

## Objectif

Le préfixe d'un label est une **présentation** dérivée d'un rôle sémantique, pas
une donnée. Il doit s'afficher dans la langue courante, partout : interface web,
plan rendu, et exports SVG/PDF/PNG.

Contrainte majeure : le label brut est aussi une **clé d'identité**. Les
configurations utilisateurs stockent des labels dans `fromHold`, `toHold` et
`excludeHolds`, et ces configurations survivent au-delà d'une version
(localStorage, fichiers exportés, URLs partagées). Traduire l'identité casserait
ces configurations.

## Décisions

### Rôles

Vocabulaire fermé mais extensible :

| Rôle | Signification |
|---|---|
| `HAND` | prise de main de la voie de référence |
| `FOOT` | prise de pied de la voie de référence |
| `ADDED_HAND` | main ajoutée par rapport à la voie officielle |
| `ADDED_FOOT` | pied ajouté par rapport à la voie officielle |
| `PAD` | pad d'arrivée |

Ajouter un rôle (`START`, `OPTIONAL`…) coûte une entrée dans l'union de types et
une ligne par langue ; le typage total signale les langues oubliées.

### Table de correspondance

Préfixe écrit dans la donnée → rôle (espace de noms global, sans collision
actuelle) :

| Préfixe | Rôle |
|---|---|
| `M`, `H` | `HAND` |
| `P`, `F` | `FOOT` |
| `N`, `I` | `ADDED_HAND` |
| `Q`, `G`, `R` | `ADDED_FOOT` |
| `PAD` | `PAD` |

Rôle → préfixe affiché, par langue :

| Rôle | fr | en | de | it |
|---|---|---|---|---|
| `HAND` | M | H | H | M |
| `FOOT` | P | F | F | P |
| `ADDED_HAND` | N | I | I | N |
| `ADDED_FOOT` | Q | G | G | Q |
| `PAD` | PAD | PAD | PAD | PAD |

L'allemand suit l'anglais (Hand, Fuß), l'italien suit le français (Mano, Piede).

### Approche retenue

Table globale préfixe → rôle dans le core (approche A). Les données de voies et
`schemas/route.schema.json` **ne changent pas**, et aucune migration de
configuration n'est nécessaire : `CONFIG_SCHEMA_VERSION` reste à 2.

Approches écartées :

- **Rôle déclaré par voie** (`"labelRoles"` dans chaque JSON) : plus explicite,
  mais recopie trois conventions dans treize fichiers pour résoudre une
  collision qui n'existe pas. À introduire le jour où deux voies donnent deux
  sens à la même lettre.
- **Normalisation des données** (labels canoniques `@HAND1` ou lettres uniques) :
  renomme les labels des voies françaises, casse `fromHold`/`toHold`/
  `excludeHolds` des configurations existantes et impose une migration, pour un
  bénéfice purement interne.

Le défaut de l'approche A — l'alphabet devient un espace de noms partagé — est
compensé par un test de validation sur l'ensemble des données de voies.

### Règle transverse

**Valeur = donnée brute, texte = traduction.** Partout où un label apparaît dans
un contrôle de formulaire, la valeur soumise et l'état stocké restent le label
écrit dans la donnée de voie ; seul le texte affiché est traduit. C'est ce qui
garantit qu'une configuration partagée par URL entre un francophone et un
italophone désigne les mêmes prises.

## Architecture

### Core — `packages/core/src/hold-label.ts` (nouveau)

Module pur, sans dépendance :

```ts
export type HoldRole = 'HAND' | 'FOOT' | 'ADDED_HAND' | 'ADDED_FOOT' | 'PAD';
export type HoldLabelLanguage = 'fr' | 'en' | 'de' | 'it';

export function parseHoldLabel(label: string): { role: HoldRole; index: string } | undefined;
export function formatHoldLabel(label: string, language: HoldLabelLanguage): string;
```

Comportement :

- le label est découpé par `^([A-Za-z]+)([0-9]*)$` en préfixe alphabétique et
  indice numérique ; l'indice est préservé verbatim, y compris multi-chiffres
  (`M12` → `H12`) ;
- la recherche du rôle se fait sur le préfixe normalisé en majuscules ; les
  données de voies sont en majuscules, la normalisation évite qu'une saisie
  minuscule échoue silencieusement ;
- `PAD` n'a pas d'indice : `parseHoldLabel('PAD')` renvoie `{ role: 'PAD',
  index: '' }`, et le label reste `PAD` dans les quatre langues ;
- un label qui ne correspond pas au motif, ou dont le préfixe est inconnu, donne
  `undefined` à `parseHoldLabel` et est rendu **verbatim, sans exception**, par
  `formatHoldLabel` — un plan mal étiqueté doit rester lisible ; c'est le test de
  validation des données qui signale le problème, pas le rendu ;
- un label déjà traduit se retraduit (`formatHoldLabel('H1', 'fr') === 'M1'`),
  puisque les préfixes de toutes les langues sont des entrées de la table
  préfixe → rôle. C'est cette propriété qui uniformise les voies DE/IT/IN
  existantes.

`parseHoldLabel`, `formatHoldLabel`, `HoldRole` et `HoldLabelLanguage` sont
exportés depuis `packages/core/src/index.ts`.

### Core — génération SVG

`SvgOptions` gagne un champ optionnel :

```ts
/** Language for hold labels (default: 'fr') */
holdLabelLanguage?: HoldLabelLanguage;
```

Valeur par défaut `'fr'` dans `DEFAULT_OPTIONS`, consommée au point unique où le
texte du label est calculé (`svg-generator.ts:335`) :

```ts
const labelText = hold.label
  ? formatHoldLabel(hold.label, options.holdLabelLanguage)
  : String(hold.composedHoldNumber);
```

Le repli sur `composedHoldNumber` pour les prises sans label est inchangé.

### Web

Un hook `useHoldLabelLanguage()` dans `packages/web/src/i18n/` lit `useIntl().locale`
— la locale déjà résolue par `resolveLocale()` et fournie à `IntlProvider` — et la
renvoie typée `HoldLabelLanguage`. Point de conversion unique, et garde-fou
gratuit : `SupportedLocale` et `HoldLabelLanguage` étant les mêmes quatre
valeurs, ajouter une langue à l'application sans l'ajouter au core ne compile
pas.

| Fichier | Changement |
|---|---|
| `components/Viewer.tsx:123` | passe `holdLabelLanguage` à `generateSvg` |
| `pages/PrintPage.tsx:113` | idem, et vérifier les dépendances de son effet |
| `components/section/HoldRangeSelector.tsx:32` | `<option value>` garde le label brut, seul le texte est traduit |
| `components/section/ExcludeHoldsSelector.tsx:69` | idem sur le `<span>` ; état et case à cocher restent sur le label brut |
| `store/routesStore.ts` | **inchangé** : `getHoldLabels()` reste la source d'identité |

L'effet de génération de `Viewer.tsx` dépend déjà de `intl` : changer la langue
de l'interface régénère le plan sans câblage supplémentaire.

Aucune chaîne n'est ajoutée à `i18n/fr.json`, `en.json`, `de.json`, `it.json` :
les labels sont produits par table, pas par `formatMessage`.

### CLI

Option `--lang <fr|en|de|it>`, défaut `fr`. Une valeur invalide est rejetée avec
un message explicite listant les langues acceptées. L'aide (`cli.ts:73`) gagne
une ligne, et l'appel `generateSvg(config, allHolds, {}, …)` (`cli.ts:194`)
transmet l'option.

Le défaut français garde les illustrations de documentation dans la langue du
projet.

## Tests

1. `packages/core/src/hold-label.test.ts` — tests tabulaires : les cinq rôles
   dans les quatre langues ; `PAD` invariant ; indice multi-chiffres préservé ;
   préfixe inconnu rendu verbatim ; retraduction d'un label déjà traduit
   (`'H1'` → `'M1'` en français).
2. `packages/core/src/svg-generator.test.ts` — une prise `@M1` rendue avec
   `holdLabelLanguage: 'en'` produit `H1` dans le SVG ; sans l'option, `M1`.
3. `packages/cli/src/reference-routes/reference-routes.test.ts` — pour chaque
   voie chargée par `loadRoutes()`, chaque `@LABEL` résout un rôle connu ; le
   message d'échec nomme la voie et le label fautif. C'est ce test qui rend
   acceptable l'espace de noms global des préfixes.

   **Correction** : la rédaction initiale affirmait que ce test passait sans
   exception sur les 13 voies. C'était faux. `training.json` et `u15.json`
   portent `SN8 STOP D7 D7 @PAD-U15`, qui distingue le pad U15 du pad IFSC sur
   les voies portant les deux. Le tiret le fait échouer au motif, il est donc
   rendu verbatim — identiquement dans les quatre langues. Le test l'exempte par
   une allowlist d'une entrée, documentée sur place. Le motif reste volontairement
   strict : l'élargir pour absorber ce cas ne changerait aucun rendu et
   affaiblirait la détection des vraies coquilles.
4. `packages/web/src/components/section/HoldRangeSelector.test.tsx` et
   `ExcludeHoldsSelector.test.tsx` — en anglais, le texte affiché est `H1` **et
   la valeur reste `M1`**. Ces cas protègent la compatibilité des configurations
   partagées et doivent être nommés en conséquence.

## Zones d'adhérence — révision de l'exclusion

La rédaction initiale excluait les zones d'adhérence au motif que « ce sont des
identifiants de zone, pas des rôles de prise ». Vérification faite dans les
données, c'était faux : les plans français et italiens numérotent leurs zones
`A1…A6` (Adhérence, Aderenza), les plans allemands `R3…R6` (Reibung). C'est
exactement le clivage linguistique que ce changement existe pour supprimer, et
ne traiter que les prises rendait `docs/images/u15-de.svg` bilingue — prises
françaises, zones allemandes — là où elle était cohéremment allemande avant.

Les zones sont donc traduites, dans un **espace de noms séparé** :
`packages/core/src/smearing-zone-label.ts`, rôle unique `SMEARING_ZONE`,
préfixes `A` (fr, it), `R` (de), `S` (en, pour *smearing* — le seul préfixe de
tout le design que n'appuie aucun plan officiel, aucune voie anglophone
n'existant).

Les deux tables ne doivent jamais fusionner : `R` désigne un pied ajouté sur une
prise (voie indienne) et une zone d'adhérence en allemand. Elles ne coexistent
que parce que prises et zones ne se croisent pas.

Le rendu suit la même règle que les prises : l'attribut `data-label` conserve le
label brut, seul le `<text>` est traduit. Un test de validation jumeau vérifie
que chaque `zone.label` des voies livrées résout un rôle connu.

## Documentation

- `bun run generate:doc-images` doit être exécuté. Avec le défaut français,
  **six images changent** : `u11-u13-de`, `u11-u13-it`, `u13-de`, `u15-de`,
  `u15-it` (H/F/I/G → M/P/N/Q) et `u13-u15-in` (R → Q). C'est le comportement
  voulu ; le volume du diff doit être annoncé dans la description de la PR.
- `CLAUDE.md` — nouvelle sous-section « Hold Labels » à côté de « Hold Colors » :
  les rôles, la table par langue, et la règle valeur brute = identité / texte =
  présentation.
- `README.md:195` mentionne le label `"N1"` dans un exemple ; la mention doit
  préciser que le préfixe affiché dépend de la langue.

## Ce qui ne change pas

- `schemas/route.schema.json` et les treize fichiers de `data/routes/`
- `CONFIG_SCHEMA_VERSION` et `packages/web/src/utils/configMigrations.ts`
- `routesStore.getHoldLabels()` et la forme des configurations stockées
- les quatre fichiers de locale de l'application web
