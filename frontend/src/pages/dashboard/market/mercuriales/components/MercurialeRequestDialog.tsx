import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FileDiff } from "lucide-react"
import { toast } from "sonner"

const REQUEST_PLACEHOLDER = "Ex : Pomona, Metro, tomates, salade iceberg..."

export default function MercurialeRequestDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const isRequestValid = requestMessage.trim().length > 0

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setRequestMessage("")
    }
  }

  const handleSubmit = () => {
    if (!isRequestValid) {
      toast.error("Merci de préciser le fournisseur concerné.")
      return
    }
    setIsOpen(false)
    setRequestMessage("")
    toast.success("Demande de mercuriale envoyée.")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2" type="button">
          <FileDiff className="h-4 w-4" />
          Demander une mercuriale
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander une mercuriale</DialogTitle>
          <DialogDescription>
            Indiquez le nom du fournisseur ainsi que les produits recherché chez ce dernier. Si
            la demande est suffisante, nous irons négocier un deal exclusif avec ce fournisseur.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          id="mercu-request"
          required
          value={requestMessage}
          onChange={(event) => setRequestMessage(event.target.value)}
          placeholder={REQUEST_PLACEHOLDER}
        />
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={!isRequestValid}>
            Envoyer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
