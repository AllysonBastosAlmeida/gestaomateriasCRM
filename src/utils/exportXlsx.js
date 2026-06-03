import * as XLSX from 'xlsx'
import { workbookSchema, workbookSheetNames } from '../data/schemas'

function normalizeRows(rows, columns) {
  return rows.map((row) => columns.reduce((result, column) => {
    result[column] = row[column] ?? ''
    return result
  }, {}))
}

export function buildWorkbook(db) {
  const workbook = XLSX.utils.book_new()

  Object.entries(workbookSchema).forEach(([sheetName, columns]) => {
    const rows = normalizeRows(db[sheetName] || [], columns)
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns })
    XLSX.utils.book_append_sheet(workbook, worksheet, workbookSheetNames[sheetName] || sheetName)
  })

  return workbook
}

export function buildWorkbookBlob(db) {
  const workbook = buildWorkbook(db)
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function exportDatabaseToXlsx(db) {
  const workbook = buildWorkbook(db)
  XLSX.writeFile(workbook, 'gestao-materiais-crm-export.xlsx')
}
