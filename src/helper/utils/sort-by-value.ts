export function sortByValue<T extends { value: number }>(data: T[]) {
  data.sort((a, b) => b.value - a.value)
  return data
}