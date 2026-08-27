import type { Category, CreateTask, Priority, TaskStatus } from '../types'
import { Priority as PriorityEnum, TaskStatus as TaskStatusEnum } from '../types'

export interface ParsedImportTask {
  tempId: string
  title: string
  description: string | null
  priority: Priority
  priorityLabel: string
  status: TaskStatus
  statusLabel: string
  categoryName: string | null
  categoryId: string | null
  dueDate: string | null
  isValid: boolean
  errors: string[]
}

export interface TaskImportResult {
  totalRows: number
  validCount: number
  invalidCount: number
  tasks: ParsedImportTask[]
}

function normalizeText(text: unknown): string {
  return String(text ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
}

export function mapPriorityValue(value: unknown): { priority: Priority; label: string } {
  if (value === null || value === undefined || value === '') {
    return { priority: PriorityEnum.Normal, label: 'Normal' }
  }

  const normalized = normalizeText(value)
  if (normalized === '1' || normalized.includes('düşük') || normalized.includes('dusuk') || normalized === 'low') {
    return { priority: PriorityEnum.Low, label: 'Düşük' }
  }
  if (normalized === '2' || normalized === 'normal' || normalized === 'orta') {
    return { priority: PriorityEnum.Normal, label: 'Normal' }
  }
  if (normalized === '3' || normalized.includes('yüksek') || normalized.includes('yuksek') || normalized === 'high') {
    return { priority: PriorityEnum.High, label: 'Yüksek' }
  }
  if (normalized === '4' || normalized === 'acil' || normalized === 'urgent') {
    return { priority: PriorityEnum.Urgent, label: 'Acil' }
  }
  if (normalized === '5' || normalized === 'kritik' || normalized === 'critical') {
    return { priority: PriorityEnum.Critical, label: 'Kritik' }
  }

  return { priority: PriorityEnum.Normal, label: 'Normal' }
}

export function mapStatusValue(value: unknown): { status: TaskStatus; label: string } {
  if (value === null || value === undefined || value === '') {
    return { status: TaskStatusEnum.Pending, label: 'Bekliyor' }
  }

  const normalized = normalizeText(value)
  if (normalized === '0' || normalized.includes('bekle') || normalized === 'pending') {
    return { status: TaskStatusEnum.Pending, label: 'Bekliyor' }
  }
  if (normalized === '1' || normalized.includes('devam') || normalized.includes('progress')) {
    return { status: TaskStatusEnum.InProgress, label: 'Devam Ediyor' }
  }
  if (normalized === '2' || normalized.includes('tamam') || normalized.includes('bitti') || normalized === 'completed') {
    return { status: TaskStatusEnum.Completed, label: 'Tamamlandı' }
  }
  if (normalized === '3' || normalized.includes('iptal') || normalized.includes('cancel')) {
    return { status: TaskStatusEnum.Cancelled, label: 'İptal Edildi' }
  }

  return { status: TaskStatusEnum.Pending, label: 'Bekliyor' }
}

export function parseDueDateValue(value: unknown): string | null {
  if (!value) return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  const str = String(value).trim()
  if (!str) return null

  // Check ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parsed = new Date(str)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }

  // Check DD.MM.YYYY or DD/MM/YYYY
  const trMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/)
  if (trMatch) {
    const [, day, month, year] = trMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }

  const fallback = new Date(str)
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString()
}

export function findMatchingCategory(categoryInput: unknown, categories: Category[]): { id: string | null; name: string | null } {
  if (!categoryInput) return { id: null, name: null }

  const raw = String(categoryInput).trim()
  if (!raw) return { id: null, name: null }

  const normalizedQuery = normalizeText(raw)
  const match = categories.find(
    (category) =>
      category.id === categoryInput ||
      normalizeText(category.name) === normalizedQuery ||
      category.name.trim().toLowerCase() === raw.toLowerCase(),
  )

  if (match) {
    return { id: match.id, name: match.name }
  }

  return { id: null, name: raw }
}

export async function parseImportFile(file: File, categories: Category[]): Promise<TaskImportResult> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.json')) {
    return parseJsonFile(file, categories)
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelFile(file, categories)
  }

  throw new Error('Desteklenmeyen dosya formatı. Lütfen .xlsx veya .json dosyası seçiniz.')
}

async function parseJsonFile(file: File, categories: Category[]): Promise<TaskImportResult> {
  const text = await file.text()
  let rawData: unknown

  try {
    rawData = JSON.parse(text)
  } catch {
    throw new Error('Geçersiz JSON dosyası. Lütfen JSON sözdizimini kontrol ediniz.')
  }

  if (!Array.isArray(rawData)) {
    throw new Error('JSON dosyası bir görev dizisi ([...]) içermelidir.')
  }

  const tasks: ParsedImportTask[] = rawData.map((item, index) => {
    const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const rawTitle = record.title ?? record.baslik ?? record.Title ?? record.Baslik ?? ''
    const rawDesc = record.description ?? record.aciklama ?? record.Description ?? record.Aciklama ?? null
    const rawPriority = record.priority ?? record.oncelik ?? record.Priority ?? record.Oncelik
    const rawStatus = record.status ?? record.durum ?? record.Status ?? record.Durum
    const rawCategory = record.category ?? record.kategori ?? record.categoryName ?? record.Category ?? record.Kategori
    const rawDueDate = record.dueDate ?? record.sonTarih ?? record.bitisTarihi ?? record.DueDate ?? record.SonTarih

    const title = String(rawTitle).trim()
    const description = rawDesc ? String(rawDesc).trim() : null
    const { priority, label: priorityLabel } = mapPriorityValue(rawPriority)
    const { status, label: statusLabel } = mapStatusValue(rawStatus)
    const { id: categoryId, name: categoryName } = findMatchingCategory(rawCategory, categories)
    const dueDate = parseDueDateValue(rawDueDate)

    const errors: string[] = []
    if (!title) {
      errors.push('Görev başlığı zorunludur.')
    } else if (title.length > 200) {
      errors.push('Görev başlığı en fazla 200 karakter olabilir.')
    }

    if (description && description.length > 2000) {
      errors.push('Açıklama en fazla 2000 karakter olabilir.')
    }

    return {
      tempId: `json-row-${index + 1}`,
      title: title || '(Başlıksız görev)',
      description,
      priority,
      priorityLabel,
      status,
      statusLabel,
      categoryName,
      categoryId,
      dueDate,
      isValid: errors.length === 0,
      errors,
    }
  })

  return {
    totalRows: tasks.length,
    validCount: tasks.filter((t) => t.isValid).length,
    invalidCount: tasks.filter((t) => !t.isValid).length,
    tasks,
  }
}

async function parseExcelFile(file: File, categories: Category[]): Promise<TaskImportResult> {
  const { default: ExcelJS } = await import('exceljs')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const worksheet = workbook.worksheets[0]
  if (!worksheet || worksheet.rowCount < 2) {
    throw new Error('Excel dosyasında veri satırı bulunamadı. Lütfen şablona uygun bir dosya yükleyiniz.')
  }

  // Column index detection from header row (Row 1)
  const headerMap: Record<string, number> = {}
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell, colNumber) => {
    const headerText = String(cell.value ?? '').trim().toLowerCase()
    if (headerText.includes('başlık') || headerText.includes('baslik') || headerText.includes('title')) {
      headerMap.title = colNumber
    } else if (headerText.includes('açıklama') || headerText.includes('aciklama') || headerText.includes('description')) {
      headerMap.description = colNumber
    } else if (headerText.includes('öncelik') || headerText.includes('oncelik') || headerText.includes('priority')) {
      headerMap.priority = colNumber
    } else if (headerText.includes('durum') || headerText.includes('status')) {
      headerMap.status = colNumber
    } else if (headerText.includes('kategori') || headerText.includes('category')) {
      headerMap.category = colNumber
    } else if (headerText.includes('tarih') || headerText.includes('date') || headerText.includes('vade')) {
      headerMap.dueDate = colNumber
    }
  })

  const titleCol = headerMap.title ?? 1
  const descCol = headerMap.description ?? 2
  const priorityCol = headerMap.priority ?? 3
  const statusCol = headerMap.status ?? 4
  const categoryCol = headerMap.category ?? 5
  const dueDateCol = headerMap.dueDate ?? 6

  const tasks: ParsedImportTask[] = []

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const rawTitle = row.getCell(titleCol).value
    const rawDesc = row.getCell(descCol).value
    const rawPriority = row.getCell(priorityCol).value
    const rawStatus = row.getCell(statusCol).value
    const rawCategory = row.getCell(categoryCol).value
    const rawDueDate = row.getCell(dueDateCol).value

    if (!rawTitle && !rawDesc && !rawCategory && !rawDueDate) return

    const title = String(rawTitle ?? '').trim()
    const description = rawDesc ? String(rawDesc).trim() : null
    const { priority, label: priorityLabel } = mapPriorityValue(rawPriority)
    const { status, label: statusLabel } = mapStatusValue(rawStatus)
    const { id: categoryId, name: categoryName } = findMatchingCategory(rawCategory, categories)
    const dueDate = parseDueDateValue(rawDueDate)

    const errors: string[] = []
    if (!title) {
      errors.push('Görev başlığı zorunludur.')
    } else if (title.length > 200) {
      errors.push('Görev başlığı en fazla 200 karakter olabilir.')
    }

    if (description && description.length > 2000) {
      errors.push('Açıklama en fazla 2000 karakter olabilir.')
    }

    tasks.push({
      tempId: `excel-row-${rowNumber}`,
      title: title || `(Satır ${rowNumber} - Başlıksız)`,
      description,
      priority,
      priorityLabel,
      status,
      statusLabel,
      categoryName,
      categoryId,
      dueDate,
      isValid: errors.length === 0,
      errors,
    })
  })

  if (tasks.length === 0) {
    throw new Error('Excel dosyasında okunabilir görev satırı bulunamadı.')
  }

  return {
    totalRows: tasks.length,
    validCount: tasks.filter((t) => t.isValid).length,
    invalidCount: tasks.filter((t) => !t.isValid).length,
    tasks,
  }
}

export function convertToCreateTaskRequests(tasks: ParsedImportTask[]): CreateTask[] {
  return tasks
    .filter((task) => task.isValid)
    .map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      categoryId: task.categoryId ?? undefined,
      dueDate: task.dueDate ?? undefined,
    }))
}

export async function downloadExcelTemplate(categories: Category[] = []): Promise<void> {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
    import('exceljs'),
    import('file-saver'),
  ])

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MilSOFT Task Management'

  const sheet = workbook.addWorksheet('Görev Şablonu', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = [
    { header: 'Başlık (Zorunlu)', key: 'title', width: 36 },
    { header: 'Açıklama', key: 'description', width: 45 },
    { header: 'Öncelik (Düşük/Normal/Yüksek/Acil/Kritik)', key: 'priority', width: 30 },
    { header: 'Durum (Bekliyor/Devam Ediyor/Tamamlandı)', key: 'status', width: 30 },
    { header: 'Kategori Adı', key: 'category', width: 24 },
    { header: 'Son Tarih (GG.AA.YYYY)', key: 'dueDate', width: 22 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC4162A' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  const sampleCat = categories.length > 0 ? categories[0].name : 'İş / Proje'
  const sampleRows = [
    {
      title: 'Haftalık proje raporunu hazırla',
      description: 'Sistem gereksinimleri ve tamamlanan maddeleri özetle.',
      priority: 'Yüksek',
      status: 'Bekliyor',
      category: sampleCat,
      dueDate: '30.09.2026',
    },
    {
      title: 'Arayüz test senaryolarını çalıştır',
      description: 'PrimeReact bileşenleri ve form doğrulamalarını test et.',
      priority: 'Normal',
      status: 'Devam Ediyor',
      category: sampleCat,
      dueDate: '05.10.2026',
    },
    {
      title: 'Dokümantasyonu güncelle',
      description: 'API uç noktaları ve veri tabanı şemasını markdown olarak yaz.',
      priority: 'Düşük',
      status: 'Bekliyor',
      category: categories.length > 1 ? categories[1].name : sampleCat,
      dueDate: '15.10.2026',
    },
  ]

  sampleRows.forEach((row) => {
    sheet.addRow(row)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, 'milsoft-gorev-ice-aktarma-sablonu.xlsx')
}

export async function downloadJsonTemplate(categories: Category[] = []): Promise<void> {
  const { saveAs } = await import('file-saver')
  const sampleCat = categories.length > 0 ? categories[0].name : 'İş / Proje'

  const sampleData = [
    {
      title: 'Haftalık proje raporunu hazırla',
      description: 'Sistem gereksinimleri ve tamamlanan maddeleri özetle.',
      priority: 'Yüksek',
      status: 'Bekliyor',
      category: sampleCat,
      dueDate: '2026-09-30T18:00:00Z',
    },
    {
      title: 'Arayüz test senaryolarını çalıştır',
      description: 'PrimeReact bileşenleri ve form doğrulamalarını test et.',
      priority: 'Normal',
      status: 'Devam Ediyor',
      category: sampleCat,
      dueDate: '2026-10-05T15:00:00Z',
    },
    {
      title: 'Dokümantasyonu güncelle',
      description: 'API uç noktaları ve veri tabanı şemasını markdown olarak yaz.',
      priority: 'Düşük',
      status: 'Bekliyor',
      category: categories.length > 1 ? categories[1].name : sampleCat,
      dueDate: '2026-10-15T12:00:00Z',
    },
  ]

  const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json;charset=utf-8' })
  saveAs(blob, 'milsoft-gorev-ice-aktarma-sablonu.json')
}
