import { ListItemNode, ListNode } from "@lexical/list"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import type { Klass, LexicalNode } from "lexical"
import { ParagraphNode, TextNode } from "lexical"

export const nodes: ReadonlyArray<Klass<LexicalNode>> = [
  HeadingNode,
  ParagraphNode,
  TextNode,
  QuoteNode,
  ListNode,
  ListItemNode,
]
