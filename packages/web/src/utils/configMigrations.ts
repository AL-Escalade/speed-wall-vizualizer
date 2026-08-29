/**
 * Schema migrations for configurations that outlive a release: localStorage,
 * exported JSON files and shared links.
 *
 * Unlike migrateSectionColors(), which is idempotent and can therefore run
 * unconditionally, these migrations are only correct when applied to a payload
 * older than the version that introduced them.
 */

/**
 * Schema version stamped on every configuration this build writes.
 * Bump it whenever a new entry is added to RENAMED_SOURCES.
 */
export const CONFIG_SCHEMA_VERSION = 2;

/** Version assumed for a payload written before versions were stamped */
export const UNVERSIONED_SCHEMA = 1;

/**
 * Reference route ids renamed by each schema version.
 *
 * These renames must not be replayed on newer payloads: `u15-it` used to be the
 * Austrian/German route and now is the Italian one, so rewriting it
 * unconditionally would silently move a v2 configuration to the wrong route.
 */
const RENAMED_SOURCES: ReadonlyArray<{
  readonly version: number;
  readonly sources: Readonly<Record<string, string>>;
}> = [
  {
    version: 2,
    sources: {
      'u15-it': 'u15-de',
      'u11-u13-de-it': 'u11-u13-de',
    },
  },
];

/**
 * Bring a section's source up to the current route ids.
 *
 * Runs before migrateSectionColors(), so the color migration still reads the
 * frozen legacy color of the route the section actually referred to.
 *
 * @param section - Section from a stored, imported or shared configuration
 * @param schemaVersion - Version the payload was written with, undefined when unstamped
 */
export function migrateSectionSource<T extends { source: string }>(
  section: T,
  schemaVersion: number | undefined
): T {
  const from = schemaVersion ?? UNVERSIONED_SCHEMA;

  let { source } = section;
  for (const step of RENAMED_SOURCES) {
    if (from < step.version) {
      source = step.sources[source.toLowerCase()] ?? source;
    }
  }

  return source === section.source ? section : { ...section, source };
}
