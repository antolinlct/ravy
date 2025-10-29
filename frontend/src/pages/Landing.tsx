import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import logo from "@/assets/branding/logo_og.svg"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"




export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center space-y-8">
      <Button>Click me</Button>

      <Accordion type="single" collapsible className="w-[300px]">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Can it be customized?</AccordionTrigger>
          <AccordionContent>
            Absolutely. You can style it with Tailwind classes.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AlertDialog>
  <AlertDialogTrigger>Open alert</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<Alert variant="default"> {/* ou "destructive" pour afficher en rouge */}
  <Terminal />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components and dependencies to your app using the cli.
  </AlertDescription>
</Alert>
    <div className="w-[120px] h-[80px]">
      <AspectRatio ratio={3/2} >
      <img src={logo} alt="Ravy Logo" className="h-full w-full object-contain"/>
      </AspectRatio>
      </div>

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>

<Badge variant="default | outline | secondary | destructive">Badge</Badge>


    </div>
  )
}
