/**
 * Normalizes an alias string for fast lookup matching
 */
export function normalizeAlias(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[-_\s():[\]/\\#.,%₹]+/g, "");
}

/**
 * Creates an alias index map from normalized alias -> field key
 */
export function createAliasIndex(
  definitions: { key: string; aliases: string[]; parentAliases?: string[] }[]
): Map<string, string> {
  const index = new Map<string, string>();

  definitions.forEach((def) => {
    // Index standard key
    index.set(normalizeAlias(def.key), def.key);

    // Index all aliases
    def.aliases.forEach((alias) => {
      index.set(normalizeAlias(alias), def.key);
    });

    // If parent aliases exist, index parent > child combinations
    if (def.parentAliases) {
      def.parentAliases.forEach((parent) => {
        def.aliases.forEach((child) => {
          index.set(normalizeAlias(`${parent} > ${child}`), def.key);
          index.set(normalizeAlias(`${parent} / ${child}`), def.key);
          index.set(normalizeAlias(`${parent} : ${child}`), def.key);
        });
      });
    }
  });

  return index;
}
