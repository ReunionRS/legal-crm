export function StatusBadge({ status }) {
  const tone =
    status === 'Закрыт' ? 'status-closed' : status === 'В работе' ? 'status-progress' : 'status-new'

  return <span className={`pill ${tone}`}>{status}</span>
}
