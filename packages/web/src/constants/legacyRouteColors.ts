/**
 * FROZEN SNAPSHOT - DO NOT EDIT.
 *
 * Colors declared by data/routes/*.json before routes could declare several
 * colors. Every saved section stores an explicit color, so this table is the
 * only way to tell "inherited from the route" from "the user picked this".
 *
 * Editing a value here would make migrateSectionColors() misread the saved
 * configurations of users who have not loaded the new version yet.
 */
export const LEGACY_ROUTE_COLORS: Record<string, string> = {
  ifsc: '#FF0000',
  'ifsc-10m': '#FF0000',
  training: '#FF0000',
  'u11-u13': '#00AAFF',
  'u11-u13-comp': '#00AAFF',
  'u12-u14': '#00AAFF',
  'u12-u14-comp': '#00AAFF',
  'u11-u13-de-it': '#008000',
  u15: '#FF0000',
  'u15-it': '#008000',
  'u13-u15-in': '#FF6600',
  'u13-de': '#32CD32',
};
