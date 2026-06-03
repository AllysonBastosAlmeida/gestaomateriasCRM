import { createId } from '../utils/ids'
import { nowIso } from '../utils/date'
import { createLogoPreviewDataUrl } from '../utils/logoUpload'
import { getStorageProvider } from './storageProvider'
import { createAuditEntry } from './audit'

const storage = getStorageProvider()

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function assertClientNotDuplicated(payload, currentClientId = '') {
  const nextName = normalizeText(payload.name)
  const nextCode = normalizeText(payload.code)
  const nextCnpj = normalizeText(payload.cnpj)

  const duplicated = storage.list('clients').find((client) => {
    if (client.id === currentClientId) return false

    const sameName = nextName && normalizeText(client.name) === nextName
    const sameCode = nextCode && normalizeText(client.code) === nextCode
    const sameCnpj = nextCnpj && normalizeText(client.cnpj) === nextCnpj

    return sameName || sameCode || sameCnpj
  })

  if (!duplicated) {
    return
  }

  if (nextCnpj && normalizeText(duplicated.cnpj) === nextCnpj) {
    throw new Error('Ja existe um cliente com esse CNPJ.')
  }

  if (nextCode && normalizeText(duplicated.code) === nextCode) {
    throw new Error('Ja existe um cliente com esse codigo.')
  }

  throw new Error('Ja existe um cliente com esse nome.')
}

export function listClients(search = '') {
  const term = search.trim().toLowerCase()

  return storage.list('clients')
    .filter((client) => {
      if (!term) return true
      return [
        client.name,
        client.code,
        client.cnpj,
        client.contactName,
        client.contactEmail,
      ].join(' ').toLowerCase().includes(term)
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function getClientById(clientId) {
  return storage.get('clients', clientId)
}

async function resolveClientLogoPayload(payload) {
  if (payload.removeLogo) {
    return {
      logoDataUrl: '',
      logoFileName: '',
      logoItemId: '',
      logoUploadedAt: '',
    }
  }

  if (!payload.logoUploadFile) {
    return {
      logoDataUrl: payload.logoDataUrl || '',
      logoFileName: payload.logoFileName || '',
      logoItemId: payload.logoItemId || '',
      logoUploadedAt: payload.logoUploadedAt || '',
    }
  }

  const logoDataUrl = await createLogoPreviewDataUrl(payload.logoUploadFile)
  let logoItemId = payload.logoItemId || ''
  let logoFileName = payload.logoFileName || payload.logoUploadFile.name
  const logoUploadedAt = nowIso()

  if (storage.uploadClientLogo) {
    const uploadedLogo = await storage.uploadClientLogo({
      clientCode: payload.code,
      clientName: payload.name,
      file: payload.logoUploadFile,
    })
    logoItemId = uploadedLogo.id || logoItemId
    logoFileName = uploadedLogo.name || logoFileName
  }

  return {
    logoDataUrl,
    logoFileName,
    logoItemId,
    logoUploadedAt,
  }
}

export async function createClient(payload, actor) {
  assertClientNotDuplicated(payload)
  const timestamp = nowIso()
  const logoPayload = await resolveClientLogoPayload(payload)
  const client = {
    id: createId('client'),
    name: payload.name?.trim() || '',
    code: payload.code?.trim() || '',
    cnpj: payload.cnpj?.trim() || '',
    contactName: payload.contactName?.trim() || '',
    contactEmail: payload.contactEmail?.trim() || '',
    contactPhone: payload.contactPhone?.trim() || '',
    notes: payload.notes || '',
    ...logoPayload,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  storage.insert('clients', client)
  createAuditEntry({
    action: 'client_created',
    entityType: 'client',
    entityId: client.id,
    entityLabel: client.name,
    user: actor,
    clientId: client.id,
  })

  return client
}

export async function updateClient(clientId, payload, actor) {
  const currentClient = storage.get('clients', clientId)
  if (!currentClient) {
    throw new Error('Cliente nao encontrado.')
  }

  assertClientNotDuplicated(
    {
      ...currentClient,
      ...payload,
    },
    clientId,
  )

  const logoPayload = await resolveClientLogoPayload({
    ...currentClient,
    ...payload,
  })

  const updated = storage.update('clients', clientId, {
    ...payload,
    name: payload.name?.trim() ?? currentClient.name,
    code: payload.code?.trim() ?? currentClient.code,
    cnpj: payload.cnpj?.trim() ?? currentClient.cnpj,
    contactName: payload.contactName?.trim() ?? currentClient.contactName,
    contactEmail: payload.contactEmail?.trim() ?? currentClient.contactEmail,
    contactPhone: payload.contactPhone?.trim() ?? currentClient.contactPhone,
    ...logoPayload,
    updatedAt: nowIso(),
  })

  createAuditEntry({
    action: 'client_updated',
    entityType: 'client',
    entityId: updated.id,
    entityLabel: updated.name,
    user: actor,
    clientId: updated.id,
  })

  return updated
}
