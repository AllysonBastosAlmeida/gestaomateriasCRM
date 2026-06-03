import * as XLSX from 'xlsx'
import { workbookSchema, workbookSheetNames } from '../data/schemas'

export async function importWorkbookBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })

  return Object.entries(workbookSchema).reduce((result, [entityKey, columns]) => {
    const sheetName = workbookSheetNames[entityKey]
    const sheet = workbook.Sheets[sheetName]
    const rows = sheet ? XLSX.utils.sheet_to_json(sheet, { defval: '' }) : []
    result[entityKey] = rows.map((row) => columns.reduce((accumulator, column) => {
      accumulator[column] = row[column] ?? ''
      return accumulator
    }, {}))
    return result
  }, {})
}

export async function importWorkbookFile(file) {
  const buffer = await file.arrayBuffer()
  return importWorkbookBuffer(buffer)
}
