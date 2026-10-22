// Typen für vite.config.ts; die Plugins selbst sind einfaches JavaScript,
// damit Node sie ohne TypeScript ausführt (Prüfung, Umwandlung, Tests).
import type { PluggableList } from "unified";

export const remarkPlugins: PluggableList;
export const rehypePlugins: PluggableList;
export const remarkRehypeOptions: Record<string, unknown>;
export const SPRACHEN: string[];
