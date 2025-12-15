import { ExternalLink, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      className={cn(
        "h-8 px-3 text-sm",
      )}
      title={copied ? "Copié" : "Copier"}
    >
      {copied ? "Copié" : label}
    </Button>
  )
}

export default function HelpPage() {
  return (
    <div className="flex items-start justify-start bg-sidebar rounded-xl p-6">
      <div className="w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Support Ravy
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
              Centre d’aide & ressources
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground sm:max-w-2xl">
              Accédez aux tutoriels ou contactez-nous par mail ou téléphone.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-left">
            <Button asChild>
              <a
                href="https://ravy-1.gitbook.io/centre-daide"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir la documentation
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://ravy.fr" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Visiter ravy.fr
              </a>
            </Button>
          </div>
        </header>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Nous contacter</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choisissez le moyen le plus pratique : email ou téléphone.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <a
                href="https://calendly.com/ravy-meet/30min"
                target="_blank"
                rel="noreferrer"
              >
                Planifier un rendez-vous
              </a>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </div>
              <div className="text-sm text-foreground font-semibold">support@ravy.fr</div>
              <CopyButton value="support@ravy.fr" label="Copier l'email" />
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-primary" />
                Téléphone
              </div>
              <div className="text-sm text-foreground font-semibold">+33 07 82 49 32</div>
              <CopyButton value="+337824932" label="Copier le numéro" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
