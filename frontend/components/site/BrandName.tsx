/**
 * Renders the business name with the original split-colour styling: the last
 * word is tinted with the primary colour (e.g. "Home" + "Anywhere"). For a
 * single-word name the whole thing is tinted. Works in both server and client
 * components — it's pure presentation with no hooks.
 */
export function BrandName({ name }: { name: string }) {
  const trimmed = name.trim()
  const lastSpace = trimmed.lastIndexOf(' ')

  if (lastSpace === -1) {
    return <span className="text-primary">{trimmed}</span>
  }

  const head = trimmed.slice(0, lastSpace + 1) // keep the trailing space
  const tail = trimmed.slice(lastSpace + 1)
  return (
    <>
      {head}
      <span className="text-primary">{tail}</span>
    </>
  )
}
