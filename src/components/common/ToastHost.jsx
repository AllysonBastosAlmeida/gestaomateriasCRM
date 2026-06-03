import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const iconByType = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const classesByType = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

export function ToastHost({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-[100] space-y-3">
      {toasts.map((toast) => {
        const Icon = iconByType[toast.type] || Info
        return (
          <div
            key={toast.id}
            className={`flex min-w-[280px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-panel ${classesByType[toast.type] || classesByType.info}`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button type="button" onClick={() => onDismiss(toast.id)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
