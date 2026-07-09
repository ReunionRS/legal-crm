export function fromDbStatus(status) {
  if (status === 'IN_PROGRESS') {
    return 'In Progress'
  }

  if (status === 'CLOSED') {
    return 'Closed'
  }

  return 'New'
}

export function toDbStatus(status) {
  if (status === 'In Progress') {
    return 'IN_PROGRESS'
  }

  if (status === 'Closed') {
    return 'CLOSED'
  }

  return 'NEW'
}

export function formatClient(client) {
  return {
    ...client,
    status: fromDbStatus(client.status),
  }
}
