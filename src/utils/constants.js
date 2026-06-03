export const ROLES = {
  admin: 'admin',
  funcionario: 'funcionario',
}

export const ROLE_LABELS = {
  [ROLES.admin]: 'Administrador',
  [ROLES.funcionario]: 'Funcionario',
}

export const ITEM_TYPES = [
  { value: 'material', label: 'Material' },
  { value: 'ferramenta', label: 'Ferramenta' },
  { value: 'equipamento', label: 'Equipamento' },
]

export const ITEM_STATUSES = [
  { value: 'disponivel', label: 'Disponivel' },
  { value: 'em_uso', label: 'Em uso' },
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'baixado', label: 'Baixado' },
]

export const MOVEMENT_TYPES = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saida' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'transferencia', label: 'Transferencia' },
]

export const STORAGE_MODES = {
  local: 'local',
  excel: 'excel',
  crudcrud: 'crudcrud',
}

export const DB_COLLECTIONS = {
  users: 'users',
  clients: 'clients',
  units: 'units',
  inventoryItems: 'inventoryItems',
  inventoryDeletionRequests: 'inventoryDeletionRequests',
  stockMovements: 'stockMovements',
  auditLogs: 'auditLogs',
  settings: 'settings',
}

export const ROUTES = {
  login: '/login',
  dashboard: '/',
  clients: '/clientes',
  clientDetail: '/clientes/:clientId',
  unitDetail: '/unidades/:unitId',
  inventory: '/estoque',
  deletionRequests: '/exclusoes',
  movements: '/movimentacoes',
  audit: '/auditoria',
  users: '/usuarios',
  settings: '/configuracoes',
}

export const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Clientes', icon: 'LayoutDashboard' },
  { to: ROUTES.clients, label: 'Cadastro', icon: 'Building2' },
  { to: ROUTES.inventory, label: 'Estoque', icon: 'Boxes' },
  { to: ROUTES.deletionRequests, label: 'Exclusoes', icon: 'ArchiveX', roles: [ROLES.admin] },
  { to: ROUTES.movements, label: 'Logs', icon: 'ArrowLeftRight', roles: [ROLES.admin] },
  { to: ROUTES.audit, label: 'Auditoria', icon: 'ClipboardList', roles: [ROLES.admin] },
  { to: ROUTES.users, label: 'Usuarios', icon: 'Users', roles: [ROLES.admin] },
  { to: ROUTES.settings, label: 'Configuracoes', icon: 'Settings' },
]

export const DEFAULT_PAGE_SIZE = 10
export const MAX_STORED_MOVEMENTS = 80
