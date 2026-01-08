import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  const isHorizontal = orientation === "horizontal"

  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "relative shrink-0 bg-border",
        isHorizontal
          ? "h-px w-full"
          : "w-px h-full",
        className
      )}
      {...props}
    >
      {/* Left / Top cap */}
      <span
        className={cn(
          "separator-cap",
          isHorizontal ? "cap-left" : "cap-top"
        )}
      />

      {/* Right / Bottom cap */}
      <span
        className={cn(
          "separator-cap",
          isHorizontal ? "cap-right" : "cap-bottom"
        )}
      />
    </SeparatorPrimitive.Root>
  )
}

export { Separator }
