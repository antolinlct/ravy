export const getDeltaTier = (delta: number) => {
  if (delta < 0) return 0
  if (delta < 2) return 1
  if (delta < 10) return 2
  return 3
}

export const getBatteryTextClass = (delta: number) => {
  if (delta >= 10) return "text-red-500"
  if (delta >= 2) return "text-orange-500"
  if (delta >= 0) return "text-yellow-500"
  return "text-green-500"
}
