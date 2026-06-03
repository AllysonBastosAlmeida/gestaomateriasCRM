import { ModalShell } from './ModalShell'

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', onClose, onConfirm }) {
  return (
    <ModalShell title={title} description={description} open={open} onClose={onClose}>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="form-button-secondary-dark text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-2xl bg-coral px-4 py-2 text-sm font-semibold text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}
