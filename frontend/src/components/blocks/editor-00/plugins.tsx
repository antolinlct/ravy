import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin"
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin"
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph"
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading"
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list"
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list"
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin"
import { ListMaxIndentLevelPlugin } from "@/components/editor/plugins/list-max-indent-level-plugin"
import { Separator } from "@/components/ui/separator"

export function Plugins({ placeholder = "Start typing ..." }: { placeholder?: string }) {
  return (
    <div className="relative">
      <ToolbarPlugin>
        {() => (
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/60 px-3 py-2">
            <BlockFormatDropDown>
              <FormatParagraph />
              <FormatHeading levels={["h3"]} />
              <FormatNumberedList />
              <FormatBulletedList />
            </BlockFormatDropDown>
            <Separator orientation="vertical" className="h-6" />
            <FontFormatToolbarPlugin formats={["bold", "underline"]} />
          </div>
        )}
      </ToolbarPlugin>

      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="max-h-[230px] overflow-y-auto">
              <ContentEditable placeholder={placeholder} />
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <ListMaxIndentLevelPlugin maxDepth={5} />
      </div>
    </div>
  )
}
