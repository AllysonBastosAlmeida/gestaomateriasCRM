const env = {
  appTitle: import.meta.env.VITE_APP_TITLE || 'Gestao de Materiais CRM',
  routerBasename: import.meta.env.VITE_ROUTER_BASENAME || '/gestaomateriasCRM',
  storageMode: import.meta.env.VITE_STORAGE_MODE || 'local',
  localDbKey: 'gestaomateriaiscrm.localdb',
  sessionKey: 'gestaomateriaiscrm.session',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  },
  crudcrud: {
    baseUrl: import.meta.env.VITE_CRUDCRUD_BASE_URL || '',
  },
}

export { env }
