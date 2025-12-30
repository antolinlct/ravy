import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

type ReportConsultantCardProps = {
  avatarSrc: string
  title: string
  body: string
}

export default function ReportConsultantCard({ avatarSrc, title, body }: ReportConsultantCardProps) {
  return (
    <Card className="mt-4 rounded-lg">
      <CardContent className="flex items-start gap-6 p-4">
        <div className="-mt-4 -mb-2 flex flex-col items-center">
          <Avatar className="h-22 w-22">
            <AvatarImage src={avatarSrc} alt="Consultant" className="bg-transparent" />
          </Avatar>
          <p className="text-xs text-muted-foreground -mt-1">Le consultant</p>
        </div>
        <div className="flex-1 space-y-2 self-center">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  )
}
