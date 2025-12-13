import { useEstablishment } from "@/context/EstablishmentContext"
import { useUserEstablishments } from "@/context/UserEstablishmentsContext"

export function useCurrentRole() {
  const { estId } = useEstablishment()
  const ctx = useUserEstablishments()

  const role =
    ctx?.list.find((e) => e.establishmentId === estId)?.role ?? null

  return { role }
}
