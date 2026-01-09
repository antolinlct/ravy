import * as React from "react"

export const BREAKPOINTS = {
  mobileMax: 768,
  tabletMax: 1024,
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return !!matches
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobileMax}px)`)
}

export function useIsTablet() {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.mobileMax + 1}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`
  )
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tabletMax + 1}px)`)
}
