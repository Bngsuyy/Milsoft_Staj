import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportTasksToExcel, exportTasksToPdf } from '../utils/taskExport'
import { Priority, TaskStatus } from '../types'
import type { Task } from '../types'

const pdfMocks = vi.hoisted(() => ({
  createPdf: vi.fn(),
  addVirtualFileSystem: vi.fn(),
  download: vi.fn(),
}))

const fileSaverMocks = vi.hoisted(() => ({
  saveAs: vi.fn(),
}))

vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    createPdf: pdfMocks.createPdf,
    addVirtualFileSystem: pdfMocks.addVirtualFileSystem,
  },
}))

vi.mock('pdfmake/build/vfs_fonts', () => ({ default: {} }))

vi.mock('file-saver', () => ({ saveAs: fileSaverMocks.saveAs }))

const task: Task = {
  id: 'task-1',
  title: 'Türkçe karakterli görev: şğüıöç',
  description: 'Açıklama',
  priority: Priority.High,
  status: TaskStatus.InProgress,
  dueDate: '2026-09-01T10:00:00Z',
  completedAt: null,
  createdAt: '2026-08-18T08:00:00Z',
  userId: 'user-1',
  category: null,
}

interface PdfTable {
  table: { widths: unknown[]; body: unknown[][] }
}

function getGeneratedTable(): PdfTable {
  const definition = pdfMocks.createPdf.mock.calls[0][0] as { content: unknown[] }
  return definition.content.find(
    (item): item is PdfTable => typeof item === 'object' && item !== null && 'table' in item,
  )!
}

describe('exportTasksToPdf', () => {
  beforeEach(() => {
    pdfMocks.createPdf.mockReset().mockReturnValue({ download: pdfMocks.download })
    pdfMocks.addVirtualFileSystem.mockReset()
    pdfMocks.download.mockReset()
  })

  it('genişlik sayısını sütun sayısıyla eşleştirir', async () => {
    // Regresyon: elle yazılan 6 elemanlı widths dizisi 7 sütunla eşleşmiyordu
    // ve pdfmake çalışma zamanında TypeError veriyordu.
    await exportTasksToPdf([task])

    const { table } = getGeneratedTable()
    const headerRow = table.body[0]

    expect(table.widths).toHaveLength(headerRow.length)
    table.body.forEach((row) => expect(row).toHaveLength(table.widths.length))
  })

  it('Türkçe karakterleri koruyan Roboto fontunu kaydeder', async () => {
    await exportTasksToPdf([task])

    expect(pdfMocks.addVirtualFileSystem).toHaveBeenCalled()

    const definition = pdfMocks.createPdf.mock.calls[0][0] as {
      defaultStyle: { font: string }
    }
    expect(definition.defaultStyle.font).toBe('Roboto')

    const { table } = getGeneratedTable()
    expect(table.body[1]).toContain('Türkçe karakterli görev: şğüıöç')
  })

  it('indirme akışını tetikler', async () => {
    await exportTasksToPdf([task])

    expect(pdfMocks.download).toHaveBeenCalledTimes(1)
    expect(pdfMocks.download.mock.calls[0][0]).toMatch(/^gorevler-\d{4}-\d{2}-\d{2}\.pdf$/)
  })
})

describe('exportTasksToExcel', () => {
  beforeEach(() => {
    fileSaverMocks.saveAs.mockReset()
  })

  it('güvenlik güncellemesi uygulanmış ExcelJS bağımlılığıyla workbook üretir', async () => {
    await exportTasksToExcel([task])

    expect(fileSaverMocks.saveAs).toHaveBeenCalledTimes(1)
    const [blob, fileName] = fileSaverMocks.saveAs.mock.calls[0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(fileName).toMatch(/^gorevler-\d{4}-\d{2}-\d{2}\.xlsx$/)
  }, 30_000)
})
