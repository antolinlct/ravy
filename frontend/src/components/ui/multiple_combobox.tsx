"use client"

import { useId, useMemo, useState } from "react"

import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type ComboboxItem = {
  value: string
  label: string
}

type MultipleComboboxProps = {
  label?: string
  items?: ComboboxItem[]
  value?: string[]
  onChange?: (values: string[]) => void
  placeholder?: string
  maxShownItems?: number
  className?: string
  triggerClassName?: string
}

const defaultItems: ComboboxItem[] = [
  { value: "react", label: "React" },
  { value: "nextjs", label: "Nextjs" },
  { value: "angular", label: "Angular" },
  { value: "vue", label: "VueJS" },
  { value: "django", label: "Django" },
  { value: "astro", label: "Astro" },
  { value: "remix", label: "Remix" },
  { value: "svelte", label: "Svelte" },
  { value: "solidjs", label: "SolidJS" },
  { value: "qwik", label: "Qwik" },
]

export default function MultipleCombobox({
  label,
  items = defaultItems,
  value,
  onChange,
  placeholder = "Sélectionner...",
  maxShownItems = 2,
  className,
  triggerClassName,
}: MultipleComboboxProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [internalValues, setInternalValues] = useState<string[]>([])

  const selectedValues = value ?? internalValues

  const toggleSelection = (nextValue: string) => {
    const next = selectedValues.includes(nextValue)
      ? selectedValues.filter((v) => v !== nextValue)
      : [...selectedValues, nextValue]
    if (!value) setInternalValues(next)
    onChange?.(next)
  }

  const removeSelection = (nextValue: string) => {
    const next = selectedValues.filter((v) => v !== nextValue)
    if (!value) setInternalValues(next)
    onChange?.(next)
  }

  const { visibleItems, hiddenCount } = useMemo(() => {
    const visible = expanded ? selectedValues : selectedValues.slice(0, maxShownItems)
    return { visibleItems: visible, hiddenCount: selectedValues.length - visible.length }
  }, [expanded, maxShownItems, selectedValues])

  return (
    <div className={cn("space-y-2 w-[275px] self-start", className)}>
      {label && (
        <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-auto min-h-9 w-full justify-between hover:bg-transparent items-start",
              triggerClassName
            )}
          >
            <div className="flex flex-wrap items-center gap-1 pr-2.5">
              {selectedValues.length > 0 ? (
                <>
                  {visibleItems.map((val) => {
                    const current = items.find((c) => c.value === val)

                    return current ? (
                      <Badge key={val} variant="outline" className="rounded-sm">
                        {current.label}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-4"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSelection(val)
                          }}
                          asChild
                        >
                          <span>
                            <XIcon className="size-3" />
                          </span>
                        </Button>
                      </Badge>
                    ) : null
                  })}
                  {hiddenCount > 0 || expanded ? (
                    <Badge
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpanded((prev) => !prev)
                      }}
                      className="rounded-sm"
                    >
                      {expanded ? "Afficher moins" : `+${hiddenCount} de plus`}
                    </Badge>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDownIcon className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <CommandList>
              <CommandEmpty>Aucun résultat</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => toggleSelection(item.value)}
                  >
                    <span className="truncate">{item.label}</span>
                    {selectedValues.includes(item.value) && <CheckIcon size={16} className="ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
