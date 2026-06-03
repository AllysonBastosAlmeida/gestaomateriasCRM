# Gestao de Materiais CRM

Aplicacao React para controle de clientes, unidades, itens, movimentacoes e auditoria.

## Stack

- React + Vite
- Tailwind CSS
- React Router
- Persistencia local com sincronizacao remota em `CrudCrud`
- Importacao e exportacao XLSX

## Acesso

- `admin / admin123`
- `operador1 / 123456`
- `operador2 / 123456`

## Rodar localmente

```bash
npm install
npm run dev
```

DEV:

- `http://localhost:5173/gestaomateriasCRM/`

## Build

```bash
npm run build
```

## Deploy

O repositório está preparado para deploy automático no GitHub Pages via GitHub Actions.

## Observacoes

- A base compartilhada atual usa `CrudCrud` no frontend.
- O sistema mantém somente as ultimas `80` movimentacoes salvas para evitar crescimento descontrolado.
