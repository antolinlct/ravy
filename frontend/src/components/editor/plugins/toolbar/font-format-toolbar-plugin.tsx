import { useCallback, useState } from "react"
import { $isTableSelection } from "@lexical/table"
import {
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type BaseSelection,
  type TextFormatType,
} from "lexical"
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const FORMATS = [
  { format: "bold", icon: BoldIcon, label: "Bold" },
  { format: "italic", icon: ItalicIcon, label: "Italic" },
  { format: "underline", icon: UnderlineIcon, label: "Underline" },
  { format: "strikethrough", icon: StrikethroughIcon, label: "Strikethrough" },
] as const

type FontFormatName = (typeof FORMATS)[number]["format"]

type FontFormatToolbarPluginProps = {
  formats?: FontFormatName[]
}

export function FontFormatToolbarPlugin({
  formats,
}: FontFormatToolbarPluginProps) {
  const { activeEditor } = useToolbarContext()
  const [activeFormats, setActiveFormats] = useState<string[]>([])
  const allowedFormats = formats?.length ? formats : FORMATS.map(({ format }) => format)
  const allowedSet = new Set(allowedFormats)
  const visibleFormats = FORMATS.filter(({ format }) => allowedSet.has(format))

  const $updateToolbar = useCallback((selection: BaseSelection) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const formats: string[] = []
      visibleFormats.forEach(({ format }) => {
        if (selection.hasFormat(format as TextFormatType)) {
          formats.push(format)
        }
      })
      setActiveFormats((prev) => {
        // Only update if formats have changed
        if (
          prev.length !== formats.length ||
          !formats.every((f) => prev.includes(f))
        ) {
          return formats
        }
        return prev
      })
    }
  }, [visibleFormats])

  useUpdateToolbarHandler($updateToolbar)

  return (
    <ToggleGroup
      type="multiple"
      value={activeFormats}
      onValueChange={setActiveFormats}
      variant="outline"
      size="sm"
    >
      {visibleFormats.map(({ format, icon: Icon, label }) => (
        <ToggleGroupItem
          key={format}
          value={format}
          aria-label={label}
          onClick={() => {
            activeEditor.dispatchCommand(
              FORMAT_TEXT_COMMAND,
              format as TextFormatType
            )
          }}
        >
          <Icon className="size-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
