import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

type ScoreConsultantCardProps = {
  avatarSrc: string
  lead: string
  tail?: string
}

export default function ScoreConsultantCard({ avatarSrc, lead, tail }: ScoreConsultantCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-6 p-4">
        <div className="-mt-4 -mb-2 flex flex-col items-center">
          <Avatar className="h-22 w-22">
            <AvatarImage src={avatarSrc} alt="Consultant" className="bg-transparent" />
          </Avatar>
          <p className="text-xs text-muted-foreground -mt-1">Le consultant</p>
        </div>
        <div className="flex-1 space-y-2 self-center">
          <p className="text-base">{lead}</p>
          {tail ? <p className="text-sm text-muted-foreground">{tail}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
