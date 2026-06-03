import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { ModalShell } from '../common/ModalShell'
import { readFileAsDataUrl } from '../../utils/logoUpload'

const initialState = {
  name: '',
  code: '',
  cnpj: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
  logoDataUrl: '',
  logoFileName: '',
  logoItemId: '',
  logoUploadedAt: '',
}

export function ClientFormModal({ open, client, onClose, onSubmit }) {
  const [form, setForm] = useState(initialState)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [removeLogo, setRemoveLogo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setForm(client ? { ...initialState, ...client } : initialState)
    setLogoFile(null)
    setLogoPreview(client?.logoDataUrl || '')
    setRemoveLogo(false)
    setIsSubmitting(false)
  }, [client, open])

  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (!isSubmitting) {
          onClose()
        }
      }}
      closeDisabled={isSubmitting}
      title={client ? 'Editar cliente' : 'Novo cliente'}
      description="Cadastre os dados principais do cliente, do contato operacional e o logo."
    >
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault()
          if (isSubmitting) return

          setIsSubmitting(true)
          try {
            await onSubmit({
              ...form,
              logoUploadFile: logoFile,
              removeLogo,
            })
          } finally {
            if (isMountedRef.current) {
              setIsSubmitting(false)
            }
          }
        }}
      >
        {isSubmitting ? (
          <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[12px] font-medium text-cyan-100">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Salvando cliente e enviando logo...
          </div>
        ) : null}
        {[
          ['name', 'Nome do cliente'],
          ['code', 'Codigo'],
          ['cnpj', 'CNPJ'],
          ['contactName', 'Contato principal'],
          ['contactEmail', 'Email do contato'],
          ['contactPhone', 'Telefone do contato'],
        ].map(([name, label]) => (
          <label key={name} className="form-label-dark">
            <span className="font-medium">{label}</span>
            <input
              value={form[name]}
              onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
              disabled={isSubmitting}
              className="form-input-dark"
            />
          </label>
        ))}
        <label className="form-label-dark md:col-span-2">
          <span className="font-medium">Logo do cliente</span>
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            {logoPreview ? (
              <div className="flex items-center gap-3">
                <img src={logoPreview} alt="Logo do cliente" className="h-16 w-16 rounded-xl bg-white/5 object-contain p-1" />
                <div className="text-[12px] text-slate-400">
                  <p>{logoFile?.name || form.logoFileName || 'Logo atual'}</p>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview('')
                      setRemoveLogo(true)
                    }}
                    className="mt-1 text-coral disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remover logo
                  </button>
                </div>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={isSubmitting}
              className="form-input-dark file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400/15 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-cyan-200"
              onChange={async (event) => {
                const nextFile = event.target.files?.[0] || null
                setLogoFile(nextFile)
                setRemoveLogo(false)

                if (!nextFile) {
                  setLogoPreview(form.logoDataUrl || '')
                  return
                }

                try {
                  const previewDataUrl = await readFileAsDataUrl(nextFile)
                  setLogoPreview(previewDataUrl)
                } catch {
                  setLogoFile(null)
                  setLogoPreview(form.logoDataUrl || '')
                }
              }}
            />
          </div>
        </label>
        <label className="form-label-dark md:col-span-2">
          <span className="font-medium">Observacoes</span>
          <textarea
            rows="2"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            disabled={isSubmitting}
            className="form-textarea-dark"
          />
        </label>
        <div className="md:col-span-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="form-button-secondary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
