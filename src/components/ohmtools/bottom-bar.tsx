// ohmtools/design: shadcn/src/components/ohmtools/bottom-bar.tsx (copied by `ohmtools-design add`, do not edit)
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { bottomBar } from "@/lib/ohmtools/bottom-bar-height";

// Phones: the view's tabs and controls at the bottom, within thumb reach,
// under a divider and inside the safe areas (DESIGN.md, "App shell"). Its
// height goes to `--bottom-bar`, so toasts stand above it. Hide it from
// `compact:` on, where the header carries everything.
export function BottomBar({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      ref={bottomBar}
      className={cn(
        "flex shrink-0 flex-col gap-3 border-t pt-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
