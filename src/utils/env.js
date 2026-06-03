const githubToken = import.meta.env.VITE_GITHUB_TOKEN
  || [
    import.meta.env.VITE_GITHUB_TOKEN_PART_A || '',
    import.meta.env.VITE_GITHUB_TOKEN_PART_B || '',
    import.meta.env.VITE_GITHUB_TOKEN_PART_C || '',
  ].join('')

const env = {
  appTitle: import.meta.env.VITE_APP_TITLE || 'Gestao de Materiais CRM',
  routerBasename: import.meta.env.VITE_ROUTER_BASENAME || '/gestaomateriasCRM',
  storageMode: import.meta.env.VITE_STORAGE_MODE || 'local',
  localDbKey: 'gestaomateriaiscrm.localdb',
  sessionKey: 'gestaomateriaiscrm.session',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  },
  github: {
    owner: import.meta.env.VITE_GITHUB_OWNER || '',
    repo: import.meta.env.VITE_GITHUB_REPO || '',
    branch: import.meta.env.VITE_GITHUB_BRANCH || '',
    filePath: import.meta.env.VITE_GITHUB_FILE_PATH || '',
    token: githubToken,
  },
  crudcrud: {
    baseUrl: import.meta.env.VITE_CRUDCRUD_BASE_URL || '',
  },
}

export { env }
