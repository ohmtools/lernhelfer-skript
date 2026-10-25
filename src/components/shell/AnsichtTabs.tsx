import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * „Mit Ergänzungen | Nur Original“, die Gruppe „View“ des Designs: ab
 * kompakt im Kopf, am Handy über die ganze Breite der Leiste unten
 * (`leiste`). Ohne Ergänzungen bleibt der Originaltext.
 */
export function AnsichtTabs({
  mitErgaenzungen,
  onChange,
  leiste,
}: {
  mitErgaenzungen: boolean;
  onChange: (mit: boolean) => void;
  leiste?: boolean;
}) {
  return (
    <Tabs
      value={mitErgaenzungen ? "mit" : "original"}
      onValueChange={(wert: unknown) => onChange(wert === "mit")}
    >
      <TabsList aria-label="Ansicht" className={leiste ? "h-10! w-full" : undefined}>
        <TabsTrigger value="mit">Mit Ergänzungen</TabsTrigger>
        <TabsTrigger value="original">Nur Original</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
