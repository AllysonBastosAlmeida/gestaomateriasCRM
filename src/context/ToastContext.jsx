import { createContext, useCallback, useMemo, useState } from 'react'
import { ToastHost } from '../components/common/ToastHost'

export const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback((message, type = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismiss(id), 3200)
  }, [dismiss])

  const value = useMemo(() => ({
    push,
    success(message) {
      push(message, 'success')
    },
    error(message) {
      push(message, 'error')
    },
    info(message) {
      push(message, 'info')
    },
  }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
