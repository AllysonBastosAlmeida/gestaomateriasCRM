import { useEffect, useMemo, useState } from 'react'
import { CloudAlert, CloudOff, CloudUpload, RefreshCw } from 'lucide-react'
import { getStorageProvider } from '../../services/storageProvider'
import { formatDateTime } from '../../utils/date'

function getFallbackStatus(storageProvider) {
  return {
    isReady: storageProvider.isReady ?? true,
    inFlight: false,
    lastSyncAt: '',
    lastError: '',
    info: storageProvider.info || 'Persistencia local ativa.',
  }
}

export function SyncStatusPill() {
  const storageProvider = useMemo(() => getStorageProvider(), [])
  const [status, setStatus] = useState(
    storageProvider.getStatus?.() || getFallbackStatus(storageProvider),
  )

  useEffect(() => {
    if (!storageProvider.subscribe) {
      setStatus(getFallbackStatus(storageProvider))
      return undefined
    }

    return storageProvider.subscribe((nextStatus) => {
      setStatus(nextStatus || getFallbackStatus(storageProvider))
    })
  }, [storageProvider])

  let label = 'Modo local'
  let detail = 'Alteracoes salvas apenas neste navegador.'
  let badgeClassName = 'border-white/10 bg-slate-950/85 text-slate-200'
  let Icon = CloudOff
  let iconClassName = 'text-slate-300'

  if (status.inFlight) {
    label = 'Sincronizando'
    detail = 'Enviando atualizacoes para a base compartilhada.'
    badgeClassName = 'border-cyan-400/25 bg-cyan-500/10 text-cyan-100'
    Icon = RefreshCw
    iconClassName = 'animate-spin text-cyan-300'
  } else if (status.isReady) {
    label = 'Sincronizado'
    detail = status.lastSyncAt
      ? `Ultima sync ${formatDateTime(status.lastSyncAt)}`
      : 'Base compartilhada online conectada.'
    badgeClassName = 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
    Icon = CloudUpload
    iconClassName = 'text-emerald-300'
  } else if (status.lastError) {
    label = 'Erro de sync'
    detail = status.lastError
    badgeClassName = 'border-amber-400/25 bg-amber-500/10 text-amber-100'
    Icon = CloudAlert
    iconClassName = 'text-amber-300'
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.25)] backdrop-blur ${badgeClassName}`}
      title={status.lastError || status.info || detail}
    >
      <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-none sm:text-[12px]">{label}</p>
        <p className="mt-1 hidden max-w-[220px] truncate text-[10px] leading-none text-current/70 sm:block">
          {detail}
        </p>
      </div>
    </div>
  )
}
