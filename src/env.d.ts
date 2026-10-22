/// <reference types="vite/client" />

declare const __ERSTELLT__: string;

declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { Gliederungseintrag, Suchabschnitt } from "@/lib/kapitel";

  export const titel: string;
  export const gliederung: Gliederungseintrag[];
  export const seiten: [number, number] | null;
  export const suchtext: Suchabschnitt[];
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
