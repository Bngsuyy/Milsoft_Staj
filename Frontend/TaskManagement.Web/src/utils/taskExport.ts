import type { Task } from '../types'
import {
  formatTaskDate,
  formatTaskDateTime,
  getPriorityLabel,
  getStatusLabel,
  isTaskOverdue,
} from './taskPresentation'

interface ExportColumn {
  header: string
  width: number
  value: (task: Task) => string
}

/** Excel, PDF ve yazdırma çıktılarının ortak kolon tanımı. */
const exportColumns: ExportColumn[] = [
  { header: 'Başlık', width: 38, value: (task) => task.title },
  { header: 'Açıklama', width: 46, value: (task) => task.description ?? '' },
  { header: 'Durum', width: 14, value: (task) => getStatusLabel(task.status) },
  { header: 'Öncelik', width: 12, value: (task) => getPriorityLabel(task.priority) },
  { header: 'Kategori', width: 18, value: (task) => task.category?.name ?? 'Kategorisiz' },
  { header: 'Son tarih', width: 14, value: (task) => formatTaskDate(task.dueDate) },
  { header: 'Oluşturulma', width: 14, value: (task) => formatTaskDate(task.createdAt) },
  { header: 'Vadesi geçti', width: 12, value: (task) => (isTaskOverdue(task) ? 'Evet' : 'Hayır') },
]

function buildFileName(extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `gorevler-${stamp}.${extension}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Görevleri gerçek bir .xlsx dosyası olarak indirir. */
export async function exportTasksToExcel(tasks: Task[]): Promise<void> {
  // Ağır kütüphaneler yalnızca dışa aktarma tetiklendiğinde indirilir.
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
    import('exceljs'),
    import('file-saver'),
  ])

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Task Management System'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Görevler', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = exportColumns.map((column) => ({
    header: column.header,
    key: column.header,
    width: column.width,
  }))

  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  }

  tasks.forEach((task) => {
    sheet.addRow(exportColumns.map((column) => column.value(task)))
  })

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: exportColumns.length },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    buildFileName('xlsx'),
  )
}

/**
 * Görevleri PDF olarak indirir. pdfmake'in Roboto fontu Türkçe karakterleri
 * doğru gösterdiği için standart PDF fontları yerine tercih edilir.
 */
export async function exportTasksToPdf(tasks: Task[]): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])

  pdfMake.addVirtualFileSystem(pdfFonts)

  // Açıklama sütunu PDF'de satırları taşırdığı için yatay çıktıda dışarıda bırakılır.
  const pdfColumns = exportColumns.filter((column) => column.header !== 'Açıklama')

  pdfMake
    .createPdf({
      pageOrientation: 'landscape',
      pageSize: 'A4',
      pageMargins: [24, 32, 24, 32],
      defaultStyle: { font: 'Roboto', fontSize: 9 },
      content: [
        { text: 'Görev Listesi', style: 'title' },
        { text: `Oluşturulma: ${formatTaskDateTime(new Date().toISOString())}`, style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              pdfColumns.map((column) => ({ text: column.header, style: 'tableHeader' })),
              ...tasks.map((task) => pdfColumns.map((column) => column.value(task))),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        title: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
        subtitle: { fontSize: 9, color: '#64748B', margin: [0, 0, 0, 12] },
        tableHeader: { bold: true, fillColor: '#E2E8F0', margin: [0, 3, 0, 3] },
      },
    })
    .download(buildFileName('pdf'))
}

/** Görev listesini ayrı bir pencerede yazdırılabilir tablo olarak açar. */
export function printTasks(tasks: Task[], title: string): void {
  const printWindow = window.open('', '_blank', 'width=1024,height=768')

  if (!printWindow) {
    throw new Error('Yazdırma penceresi açılamadı. Tarayıcınızın pop-up engelini kontrol edin.')
  }

  const headerCells = exportColumns
    .filter((column) => column.header !== 'Açıklama')
    .map((column) => `<th>${escapeHtml(column.header)}</th>`)
    .join('')

  const bodyRows = tasks
    .map((task) => {
      const cells = exportColumns
        .filter((column) => column.header !== 'Açıklama')
        .map((column) => `<td>${escapeHtml(column.value(task))}</td>`)
        .join('')
      return `<tr class="${isTaskOverdue(task) ? 'is-overdue' : ''}">${cells}</tr>`
    })
    .join('')

  printWindow.document.write(`<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #0f172a; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p.meta { font-size: 12px; color: #64748b; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #e2e8f0; }
  tr.is-overdue td { color: #b91c1c; }
  @page { size: A4 landscape; margin: 12mm; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${tasks.length} görev · ${escapeHtml(formatTaskDateTime(new Date().toISOString()))}</p>
  <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
</body>
</html>`)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
