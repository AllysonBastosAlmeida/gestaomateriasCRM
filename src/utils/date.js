const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function nowIso() {
  return new Date().toISOString()
}

export function formatDate(value) {
  if (!value) return '-'
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) return '-'
  return dateTimeFormatter.format(new Date(value))
}
