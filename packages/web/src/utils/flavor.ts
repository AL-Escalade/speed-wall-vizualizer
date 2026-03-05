/**
 * Flavor (nominal) typing utility
 *
 * Creates a lightweight branded type that is structurally compatible
 * with its base type T. A plain T can be assigned to Flavor<T, Name>,
 * but two Flavor types with different Names are incompatible.
 */

declare const __flavor: unique symbol;

export type Flavor<T, Name> = T & { readonly [__flavor]?: Name };
