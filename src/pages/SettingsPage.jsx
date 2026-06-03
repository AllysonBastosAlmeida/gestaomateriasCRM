import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw, Upload } from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { PageSection } from '../components/common/PageSection'
import { useToast } from '../hooks/useToast'
import { resetLocalDb } from '../services/localDb'
import { getStorageProvider } from '../services/storageProvider'
import { normalizeDatabasePayload } from '../utils/database'
import { env } from '../utils/env'
import { exportDatabaseToXlsx } from '../utils/exportXlsx'
import { importWorkbookFile } from '../utils/importXlsx'

function InfoRow({ label, value }) {
  return (
    <p className="text-sm text-slate-300">
      <strong className="text-slate-100">{label}:</strong> {value}
    </p>
  )
}

export function SettingsPage() {
  const toast = useToast()
  const storageProvider = useMemo(() => getStorageProvider(), [])
  const [resetOpen, setResetOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState(storageProvider.getStatus?.() || null)
  const isCrudCrudMode = storageProvider.mode === 'crudcrud'

  useEffect(() => {
    if (!storageProvider.subscribe) return undefined
    return storageProvider.subscribe(setSyncStatus)
  }, [storageProvider])

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Integracao"
        title="Configuracoes"
        description="Controles compactos da persistencia local e da base online compartilhada."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <h3 className="font-display text-[1.2rem] font-bold text-white">Persistencia</h3>
          <div className="mt-4 space-y-3">
            <InfoRow label="Modo atual" value={storageProvider.mode} />
            <InfoRow label="Status" value={storageProvider.isReady ? 'Pronto para uso' : 'Fallback local ativo'} />
            <InfoRow label="Observacao" value={storageProvider.info} />
            {isCrudCrudMode ? (
              <InfoRow label="Sincronizacao" value="Automatica nos salvamentos e leitura ciclica da base online." />
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => exportDatabaseToXlsx(storageProvider.readDb())}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2.5 text-[13px] font-semibold text-white"
            >
              <Download className="h-4 w-4" />
              Exportar XLSX
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:border-white/20 hover:text-white">
              <Upload className="h-4 w-4" />
              Importar XLSX
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={async (event) => {
                  const [file] = event.target.files || []
                  if (!file) return

                  try {
                    const workbookData = await importWorkbookFile(file)
                    const nextDb = normalizeDatabasePayload(workbookData, storageProvider.readDb())
                    storageProvider.replaceDb(nextDb)
                    toast.success('Planilha importada com sucesso.')
                  } catch (error) {
                    toast.error(`Falha ao importar a planilha: ${error.message}`)
                  } finally {
                    event.target.value = ''
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-coral/30 bg-coral/10 px-3 py-2.5 text-[13px] font-semibold text-coral"
            >
              <RefreshCw className="h-4 w-4" />
              Restaurar sementes locais
            </button>
            {isCrudCrudMode ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await storageProvider.pushRemote?.(storageProvider.readDb())
                      toast.success('Base local enviada para o CrudCrud.')
                    } catch (error) {
                      toast.error(`Falha ao sincronizar online: ${error.message}`)
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2.5 text-[13px] font-semibold text-cyan-200"
                >
                  Sincronizar agora
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await storageProvider.pullRemote?.()
                      toast.success('Base online recarregada do CrudCrud.')
                    } catch (error) {
                      toast.error(`Falha ao recarregar online: ${error.message}`)
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
                >
                  Recarregar base online
                </button>
              </>
            ) : null}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <h3 className="font-display text-[1.2rem] font-bold text-white">CrudCrud compartilhado</h3>
          <div className="mt-4 space-y-3">
            <InfoRow label="Aplicativo" value={env.appTitle} />
            <InfoRow label="Nome base" value={env.routerBasename} />
            <InfoRow label="URL remota" value={env.crudcrud.baseUrl || 'Nao definida'} />
            {syncStatus ? (
              <InfoRow
                label="Sincronizacao de status"
                value={syncStatus.inFlight ? 'Sincronizando...' : syncStatus.isReady ? 'Conectado' : 'Aguardando configuracao'}
              />
            ) : null}
            {syncStatus?.lastSyncAt ? <InfoRow label="Ultima sync" value={syncStatus.lastSyncAt} /> : null}
            {syncStatus?.lastError ? <InfoRow label="Ultimo erro" value={syncStatus.lastError} /> : null}
          </div>
          <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm font-semibold text-white">Modelo da base</p>
            <p className="mt-3 text-xs text-slate-400">
              O sistema publica um snapshot JSON compartilhado com clientes, unidades, itens, usuarios, exclusoes, auditoria e movimentacoes.
            </p>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurar seed local?"
        description="Todos os dados atuais do localStorage serao substituidos pela base seed inicial."
        confirmLabel="Restaurar"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetLocalDb()
          setResetOpen(false)
          toast.success('Base local restaurada para o seed inicial.')
        }}
      />
    </div>
  )
}
