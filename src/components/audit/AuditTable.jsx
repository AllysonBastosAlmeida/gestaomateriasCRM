import { formatDateTime } from '../../utils/date'

export function AuditTable({ logs }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/60 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-[13px]">
          <thead className="bg-white/[0.03]">
            <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <th className="px-4 py-3">Acao</th>
              <th className="px-4 py-3">Entidade</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Contexto</th>
              <th className="px-4 py-3">Data / Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-semibold text-white">{log.action}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{log.entityType}</p>
                  <p className="text-[11px] text-slate-400">{log.entityLabel}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{log.userName}</td>
                <td className="px-4 py-3 text-slate-400">
                  <pre className="max-w-[420px] whitespace-pre-wrap break-words text-xs text-slate-400">{JSON.stringify(log.metadata, null, 2)}</pre>
                </td>
                <td className="px-4 py-3 text-slate-400">{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
