export const workbookSheetNames = {
  clients: 'Clientes',
  units: 'Unidades',
  inventoryItems: 'Itens',
  inventoryDeletionRequests: 'ExclusoesPendentes',
  stockMovements: 'Movimentacoes',
  auditLogs: 'Historico',
  users: 'Usuarios',
}

export const workbookSchema = {
  clients: ['id', 'name', 'code', 'cnpj', 'contactName', 'contactEmail', 'contactPhone', 'notes', 'logoDataUrl', 'logoFileName', 'logoItemId', 'logoUploadedAt', 'createdAt', 'updatedAt'],
  units: ['id', 'clientId', 'name', 'code', 'address', 'city', 'state', 'notes', 'createdAt', 'updatedAt'],
  inventoryItems: ['id', 'clientId', 'unitId', 'type', 'category', 'name', 'description', 'sku', 'serialNumber', 'quantity', 'minQuantity', 'unitMeasure', 'status', 'internalLocation', 'notes', 'pendingDeletion', 'pendingDeletionRequestId', 'pendingDeletionRequestedAt', 'pendingDeletionRequestedBy', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
  inventoryDeletionRequests: ['id', 'itemId', 'itemName', 'clientId', 'unitId', 'status', 'requestedBy', 'requestedByName', 'requestedAt', 'reviewedBy', 'reviewedByName', 'reviewedAt', 'reviewNotes', 'itemSnapshotJson'],
  stockMovements: ['id', 'itemId', 'movementType', 'clientId', 'unitId', 'sourceUnitId', 'destinationUnitId', 'quantity', 'previousQuantity', 'newQuantity', 'reason', 'notes', 'performedBy', 'performedAt'],
  auditLogs: ['id', 'action', 'entityType', 'entityId', 'entityLabel', 'userId', 'userName', 'clientId', 'unitId', 'metadata', 'createdAt'],
  users: ['id', 'name', 'email', 'username', 'passwordHash', 'role', 'active', 'createdAt', 'updatedAt', 'lastLoginAt'],
}
