import { useDeferredValue, useEffect, useState } from 'react'
import { AuditTable } from '../components/audit/AuditTable'
import { EmptyState } from '../components/common/EmptyState'
import { FiltersBar } from '../components/common/FiltersBar'
import { PageSection } from '../components/common/PageSection'
import { SearchBar } from '../components/common/SearchBar'
import { listAuditLogs } from '../services/audit'
import { listClients } from '../services/clients'
import { listUnits } from '../services/units'
import { listUsers } from '../services/users'

export function AuditPage() {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filters, setFilters] = useState({
    userId: '',
    clientId: '',
    unitId: '',
    from: '',
    to: '',
  })
  const [logs, setLogs] = useState([])
  const [clients, setClients] = useState([])
  const [units, setUnits] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    setClients(listClients())
    setUnits(listUnits())
    setUsers(listUsers())
    setLogs(listAuditLogs({ search: deferredSearch, ...filters }))
  }, [deferredSearch, filters])

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Rastreabilidade"
        title="Auditoria"
        description="Registro detalhado de logins, cadastros, alteracoes e movimentacoes relevantes."
      >
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por acao, entidade, usuario ou metadata..." />
          <FiltersBar
            filters={[
              {
                name: 'userId',
                label: 'Usuario',
                value: filters.userId,
                onChange: (value) => setFilters((current) => ({ ...current, userId: value })),
                options: users.map((user) => ({ value: user.id, label: user.name })),
              },
              {
                name: 'clientId',
                label: 'Cliente',
                value: filters.clientId,
                onChange: (value) => setFilters((current) => ({ ...current, clientId: value })),
                options: clients.map((client) => ({ value: client.id, label: client.name })),
              },
              {
                name: 'unitId',
                label: 'Unidade',
                value: filters.unitId,
                onChange: (value) => setFilters((current) => ({ ...current, unitId: value })),
                options: units.map((unit) => ({ value: unit.id, label: unit.name })),
              },
            ]}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="form-label-dark">
                <span className="font-medium">De</span>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                  className="form-input-dark px-3 py-2.5"
                />
              </label>
              <label className="form-label-dark">
                <span className="font-medium">Ate</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                  className="form-input-dark px-3 py-2.5"
                />
              </label>
            </div>
          </FiltersBar>
        </div>
      </PageSection>

      {logs.length ? <AuditTable logs={logs} /> : <EmptyState title="Nenhum log encontrado" description="Os eventos auditaveis aparecerao aqui com contexto detalhado." />}
    </div>
  )
}
