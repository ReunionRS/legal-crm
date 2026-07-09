export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">{title}</h2>
        {description ? <p className="mt-1 text-sm text-on-surface-variant">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
