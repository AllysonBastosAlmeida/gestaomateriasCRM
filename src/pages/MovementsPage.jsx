import { useDeferredValue, useEffect, useState } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { FiltersBar } from '../components/common/FiltersBar'
import { PageSection } from '../components/common/PageSection'
import { SearchBar } from '../components/common/SearchBar'
import { listClients } from '../services/clients'
import { listInventoryItems } from '../services/inventory'
import { listMovements } from '../services/movements'
import { listUnits } from '../services/units'
import { listUsers } from '../services/users'
import { MOVEMENT_TYPES } from '../utils/constants'
import { formatDateTime } from '../utils/date'

export function MovementsPage() {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filters, setFilters] = useState({
    movementType: '',
    clientId: '',
    unitId: '',
    userId: '',
    from: '',
    to: '',
  })
  const [movements, setMovements] = useState([])
  const [clients, setClients] = useState([])
  const [units, setUnits] = useState([])
  const [users, setUsers] = useState([])
  const [itemsMap, setItemsMap] = useState({})

  useEffect(() => {
    setClients(listClients())
    setUnits(listUnits())
    setUsers(listUsers())
    setItemsMap(Object.fromEntries(listInventoryItems({ includePendingDeletion: true }).map((item) => [item.id, item])))
    setMovements(listMovements({ search: deferredSearch, ...filters }))
  }, [deferredSearch, filters])

  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="Area administrativa"
        title="Registros"
        description="Historico compacto de movimentacoes com usuario, data e contexto."
      >
        <div className="space-y-3">
          <div className="max-w-xl">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por motivo, observacao ou tipo de movimento..." />
          </div>
          <FiltersBar
            filters={[
              {
                name: 'movementType',
                label: 'Operacao',
                value: filters.movementType,
                onChange: (value) => setFilters((current) => ({ ...current, movementType: value })),
                options: MOVEMENT_TYPES,
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
              {
                name: 'userId',
                label: 'Usuario',
                value: filters.userId,
                onChange: (value) => setFilters((current) => ({ ...current, userId: value })),
                options: users.map((user) => ({ value: user.id, label: user.name })),
              },
            ]}
            toggleLabel="Filtros"
          >
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <label className="form-label-dark">
                <span className="font-medium text-[11px] text-slate-400">De</span>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                  className="form-input-dark px-3 py-2"
                />
              </label>
              <label className="form-label-dark">
                <span className="font-medium text-[11px] text-slate-400">Ate</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                  className="form-input-dark px-3 py-2"
                />
              </label>
            </div>
          </FiltersBar>
        </div>
      </PageSection>

      {movements.length ? (
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/60 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-[13px]">
              <thead className="bg-white/[0.03]">
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Cliente / Unidade</th>
                  <th className="px-4 py-3">Qtd.</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
                        {movement.movementType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{itemsMap[movement.itemId]?.name || 'Item removido'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <p>{clients.find((client) => client.id === movement.clientId)?.name || '-'}</p>
                      <p className="text-[11px] text-slate-400">{units.find((unit) => unit.id === movement.unitId)?.name || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-white">
                      <p className="font-semibold">{movement.quantity}</p>
                      <p className="text-[11px] text-slate-400">{movement.previousQuantity} {'->'} {movement.newQuantity}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {users.find((user) => user.id === movement.performedBy)?.name || movement.performedBy}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDateTime(movement.performedAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <p className="max-w-[320px] truncate">{movement.reason || 'Nao informado'}</p>
                      {(movement.sourceUnitId || movement.destinationUnitId) ? (
                        <p className="text-[11px] text-slate-500">
                          {movement.sourceUnitId || '-'} {'->'} {movement.destinationUnitId || '-'}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Nenhum log encontrado"
          description="As movimentacoes registradas aparecerao aqui para acompanhamento administrativo."
        />
      )}
    </div>
  )
}
