export function buildInventorySignature(item) {
  return [
    item.clientId,
    item.type,
    item.category?.trim()?.toLowerCase() || '',
    item.name?.trim()?.toLowerCase() || '',
    item.sku?.trim()?.toLowerCase() || '',
    item.serialNumber?.trim()?.toLowerCase() || '',
  ].join('::')
}
