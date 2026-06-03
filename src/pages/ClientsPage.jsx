import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { ClientCard } from '../components/clients/ClientCard'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { EmptyState } from '../components/common/EmptyState'
import { PageSection } from '../components/common/PageSection'
import { SearchBar } from '../components/common/SearchBar'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { listClients, createClient, updateClient } from '../services/clients'
import { listUnits } from '../services/units'
import { listInventoryItems } from '../services/inventory'
import { canManageClients } from '../utils/permissions'
import { validateEmail, validateRequired } from '../utils/validation'

export function ClientsPage() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [clients, setClients] = useState([])
  const [units, setUnits] = useState([])
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  const reload = useCallback(() => {
    setClients(listClients(deferredSearch))
    setUnits(listUnits())
    setItems(listInventoryItems())
  }, [deferredSearch])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleSubmit(form) {
    if (!validateRequired(form.name) || !validateRequired(form.code)) {
      toast.error('Nome e codigo do cliente sao obrigatorios.')
      return
    }

    if (!validateEmail(form.contactEmail)) {
      toast.error('Informe um email valido para o contato.')
      return
    }

    try {
      if (editingClient) {
        await updateClient(editingClient.id, form, currentUser)
        toast.success('Cliente atualizado.')
      } else {
        await createClient(form, currentUser)
        toast.success('Cliente criado.')
      }
      setModalOpen(false)
      setEditingClient(null)
      reload()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Cadastro principal"
        title="Clientes"
        description="Cadastre clientes, acompanhe sua rede de unidades e organize o estoque distribuido."
        action={canManageClients(currentUser) ? (
          <button
            type="button"
            onClick={() => {
              setEditingClient(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2.5 text-[13px] font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Novo cliente
          </button>
        ) : null}
      >
        <div className="max-w-xl">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome, codigo, contato ou CNPJ..." />
        </div>
      </PageSection>

      {clients.length ? (
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {clients.map((client) => (
            <div key={client.id} className="space-y-2">
              <ClientCard
                client={client}
                unitsCount={units.filter((unit) => unit.clientId === client.id).length}
                itemsCount={items.filter((item) => item.clientId === client.id).length}
                variant="dark"
                onEdit={canManageClients(currentUser) ? () => {
                  setEditingClient(client)
                  setModalOpen(true)
                } : undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum cliente encontrado" description="Ajuste os filtros ou cadastre um novo cliente para iniciar a operacao." />
      )}

      <ClientFormModal
        open={modalOpen}
        client={editingClient}
        onClose={() => {
          setModalOpen(false)
          setEditingClient(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
