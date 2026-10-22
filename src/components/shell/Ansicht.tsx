import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** „Mit Ergänzungen | Nur Original“: ohne Ergänzungen bleibt der Originaltext. */
export function Ansicht({
  mitErgaenzungen,
  onChange,
  voll = false,
}: {
  mitErgaenzungen: boolean;
  onChange: (mit: boolean) => void;
  voll?: boolean;
}) {
  return (
    <ToggleGroup
      aria-label="Ansicht"
      variant="outline"
      size="sm"
      className={voll ? "w-full" : undefined}
      value={[mitErgaenzungen ? "mit" : "original"]}
      onValueChange={(neu: string[]) => neu.length && onChange(neu[0] === "mit")}
    >
      <ToggleGroupItem value="mit" className={voll ? "flex-1" : undefined}>
        Mit Ergänzungen
      </ToggleGroupItem>
      <ToggleGroupItem value="original" className={voll ? "flex-1" : undefined}>
        Nur Original
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
