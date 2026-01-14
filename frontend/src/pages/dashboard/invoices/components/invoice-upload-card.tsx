import { useEffect, useRef, useState } from "react"
import { Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import FileUpload06 from "@/components/ui/file-upload-06"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useAccess } from "@/components/access/access-control"
import { useInvoiceAlias } from "../api"

export default function InvoiceUploadCard() {
  const { estId } = useEstablishment()
  const { role } = useAccess()
  const isStaff = role === "staff"
  const { aliasEmail, aliasActive } = useInvoiceAlias(estId)
  const [copied, setCopied] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [uploaderHasFiles, setUploaderHasFiles] = useState(false)
  const [copyLabel, setCopyLabel] = useState("Copier l'adresse")
  const copyTimeoutRef = useRef<number | null>(null)

  const handleCopy = async () => {
    if (!aliasActive || !aliasEmail) return
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }

    navigator.clipboard
      .writeText(aliasEmail)
      .then(() => {
        setCopied(true)
        setCopyLabel("Copié !")
        setTooltipOpen(true)
        copyTimeoutRef.current = window.setTimeout(() => {
          setCopied(false)
          setCopyLabel("Copier l'adresse")
          setTooltipOpen(false)
          copyTimeoutRef.current = null
        }, 1200)
      })
      .catch(() => {
        setCopied(false)
        setCopyLabel("Copier l'adresse")
      })
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card className="shadow-sm bg-card">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:items-top">
          <div className="flex h-full flex-col items-center gap-4 text-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <div className="h-full w-full rounded-full border-[14px] border-muted" />
              <div className="absolute text-xl font-semibold text-primary">0%</div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">150 factures restantes</p>
              <p className="text-sm text-muted-foreground">Mise à jour prévue le : 20 Dec. 25</p>
            </div>
          </div>

          <div className="flex h-full flex-col gap-6">
            <div className="flex flex-col gap-1">
              <CardTitle>Déposez vos factures</CardTitle>
              <CardDescription>
                <div className="space-y-3">
                  <p>
                    Transférez vos factures en pièces jointes à cette adresse pour les importer automatiquement :
                  </p>
                  {!uploaderHasFiles && !isStaff && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={
                          aliasActive && aliasEmail
                            ? aliasEmail
                            : "Adresse en cours de vérification, contactez le support si le problème persiste."
                        }
                        readOnly
                        className="bg-muted/50 text-foreground"
                      />
                      <Tooltip
                        open={tooltipOpen}
                        onOpenChange={(open) => {
                          if (copyTimeoutRef.current) return
                          setTooltipOpen(open)
                        }}
                      >
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopy}
                            aria-label="Copier l'adresse email"
                            disabled={isStaff || !aliasActive || !aliasEmail}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{copied ? "Copié !" : copyLabel}</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex flex-1">
              <FileUpload06 onHasUploadsChange={setUploaderHasFiles} disabled={isStaff} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
