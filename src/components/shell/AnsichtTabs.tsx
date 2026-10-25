import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** „Mit Ergänzungen | Nur Original“ im Kopf: ohne Ergänzungen bleibt der Originaltext. */
export function AnsichtTabs({
  mitErgaenzungen,
  onChange,
}: {
  mitErgaenzungen: boolean;
  onChange: (mit: boolean) => void;
}) {
  return (
    <Tabs
      value={mitErgaenzungen ? "mit" : "original"}
      onValueChange={(wert: unknown) => onChange(wert === "mit")}
    >
      <TabsList aria-label="Ansicht">
        <TabsTrigger value="mit">Mit Ergänzungen</TabsTrigger>
        <TabsTrigger value="original">Nur Original</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
