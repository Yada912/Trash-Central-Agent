export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-alert bg-card px-3 py-2 text-sm font-semibold text-alert">
      {message}
    </p>
  )
}
