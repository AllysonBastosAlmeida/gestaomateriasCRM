export function validateRequired(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0
}

export function validateEmail(value) {
  if (!value) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validatePositiveNumber(value) {
  return Number(value) >= 0
}
