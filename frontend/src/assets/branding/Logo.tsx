import LightLogo from "@/assets/branding/logo_light.svg"
import DarkLogo from "@/assets/branding/logo_dark.svg"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <>
      {/* Logo clair */}
      <img
        src={DarkLogo}
        alt="RAVY"
        className={`${className} block dark:hidden`}
      />

      {/* Logo sombre */}
      <img
        src={LightLogo}
        alt="RAVY"
        className={`${className} hidden dark:block`}
      />
    </>
  )
}
