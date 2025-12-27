import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import FolderIllustration from "@/assets/folder.svg"
import FolderIllustrationTwo from "@/assets/folder-2.svg"
import FolderIllustrationThree from "@/assets/folder-3.svg"
import { FileDiff } from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router-dom"

export default function MarketMercurialesPage() {
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const isRequestValid = requestMessage.trim().length > 0
  const folderCards = [
    { id: "metro", label: "Metro France", src: FolderIllustration },
    { id: "pomona", label: "Sysco", src: FolderIllustrationTwo },
    { id: "transgourmet", label: "France Boissons", src: FolderIllustrationThree },
  ]

  const handleRequestOpenChange = (open: boolean) => {
    setRequestOpen(open)
    if (!open) {
      setRequestMessage("")
    }
  }

  const handleRequestSubmit = () => {
    if (!isRequestValid) {
      toast.error("Merci de préciser le fournisseur concerné.")
      return
    }
    setRequestOpen(false)
    setRequestMessage("")
    toast.success("Demande de mercuriale envoyée.")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Mercuriales</h1>
          <p className="text-sm text-muted-foreground">
            Consultez les mercuriales négociées par Ravy auprès de grands fournisseurs partenaires.
          </p>
        </div>
        <Dialog open={requestOpen} onOpenChange={handleRequestOpenChange}>
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
                Indiquez le nom du fournisseur ainsi que les produits recherché chez ce dernier.
                Si la demande est suffisante, nous irons négocier un deal exclusif avec ce
                fournisseur.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              id="mercu-request"
              required
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
              placeholder="Ex : Pomona, Metro, tomates, salade iceberg..."
            />
            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleRequestSubmit} disabled={!isRequestValid}>
                Envoyer la demande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6 items-start justify-start">
            {folderCards.map((folder) => {
              const isDisabled = folder.id === "transgourmet"
              const card = (
                <Card
                  className={`w-full max-w-[140px] border-transparent shadow-none transition ${
                    isDisabled ? "opacity-60" : "hover:bg-muted"
                  }`}
                >
                  <CardContent className="relative p-3 text-center">
                    <img
                      src={folder.src}
                      alt={`Dossier mercuriale ${folder.label}`}
                      className="h-[120px] w-full object-contain opacity-70"
                    />
                    <p className="-mt-1 text-sm font-semibold text-foreground">
                      {folder.label}
                    </p>
                    {isDisabled && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 text-xs font-semibold text-foreground">
                        Bientôt disponible
                      </div>
                    )}
                  </CardContent>
                </Card>
              )

              if (isDisabled) {
                return (
                  <div key={folder.id} aria-disabled="true">
                    {card}
                  </div>
                )
              }

              return (
                <Link key={folder.id} to={folder.id} className="block">
                  {card}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
