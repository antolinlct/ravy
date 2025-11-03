import { ResetPasswordForm } from "@/components/blocks/reset-password-form"

export default function NewPasswordPage() {
  return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <ResetPasswordForm />
        </div>
      </div>
    )
  }
