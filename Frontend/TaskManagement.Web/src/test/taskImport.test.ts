import { describe, expect, it } from 'vitest'
import {
  convertToCreateTaskRequests,
  findMatchingCategory,
  mapPriorityValue,
  mapStatusValue,
  parseDueDateValue,
  parseImportFile,
} from '../utils/taskImport'
import { Priority, TaskStatus } from '../types'
import type { Category } from '../types'

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'İş / Proje', color: '#c4162a', description: null, createdAt: '2026-08-01T00:00:00Z' },
  { id: 'cat-2', name: 'Kişisel', color: '#3b82f6', description: null, createdAt: '2026-08-01T00:00:00Z' },
]

describe('taskImport utility', () => {
  describe('mapPriorityValue', () => {
    it('metinsel ve sayısal öncelik değerlerini doğru eşleştirir', () => {
      expect(mapPriorityValue('Düşük').priority).toBe(Priority.Low)
      expect(mapPriorityValue('1').priority).toBe(Priority.Low)
      expect(mapPriorityValue('Normal').priority).toBe(Priority.Normal)
      expect(mapPriorityValue('2').priority).toBe(Priority.Normal)
      expect(mapPriorityValue('Yüksek').priority).toBe(Priority.High)
      expect(mapPriorityValue('3').priority).toBe(Priority.High)
      expect(mapPriorityValue('Acil').priority).toBe(Priority.Urgent)
      expect(mapPriorityValue('4').priority).toBe(Priority.Urgent)
      expect(mapPriorityValue('Kritik').priority).toBe(Priority.Critical)
      expect(mapPriorityValue('5').priority).toBe(Priority.Critical)
      expect(mapPriorityValue(null).priority).toBe(Priority.Normal)
    })
  })

  describe('mapStatusValue', () => {
    it('metinsel ve sayısal durum değerlerini doğru eşleştirir', () => {
      expect(mapStatusValue('Bekliyor').status).toBe(TaskStatus.Pending)
      expect(mapStatusValue('0').status).toBe(TaskStatus.Pending)
      expect(mapStatusValue('Devam Ediyor').status).toBe(TaskStatus.InProgress)
      expect(mapStatusValue('1').status).toBe(TaskStatus.InProgress)
      expect(mapStatusValue('Tamamlandı').status).toBe(TaskStatus.Completed)
      expect(mapStatusValue('2').status).toBe(TaskStatus.Completed)
      expect(mapStatusValue('İptal Edildi').status).toBe(TaskStatus.Cancelled)
      expect(mapStatusValue('3').status).toBe(TaskStatus.Cancelled)
      expect(mapStatusValue(undefined).status).toBe(TaskStatus.Pending)
    })
  })

  describe('parseDueDateValue', () => {
    it('ISO ve TR tarih formatlarını başarıyla ISO tarihine dönüştürür', () => {
      expect(parseDueDateValue('2026-09-30')).toContain('2026-09-30')
      expect(parseDueDateValue('30.09.2026')).toContain('2026-09-30')
      expect(parseDueDateValue(null)).toBeNull()
      expect(parseDueDateValue('')).toBeNull()
    })
  })

  describe('findMatchingCategory', () => {
    it('kategori adını veya ID sini listeden eşleştirir', () => {
      const matchName = findMatchingCategory('iş / proje', mockCategories)
      expect(matchName.id).toBe('cat-1')
      expect(matchName.name).toBe('İş / Proje')

      const matchId = findMatchingCategory('cat-2', mockCategories)
      expect(matchId.id).toBe('cat-2')

      const noMatch = findMatchingCategory('Bilinmeyen Kategori', mockCategories)
      expect(noMatch.id).toBeNull()
      expect(noMatch.name).toBe('Bilinmeyen Kategori')
    })
  })

  describe('parseImportFile (JSON)', () => {
    it('geçerli JSON verisini doğru ayrıştırır ve doğrular', async () => {
      const jsonContent = JSON.stringify([
        {
          title: 'Görev 1',
          description: 'Açıklama 1',
          priority: 'Yüksek',
          status: 'Bekliyor',
          category: 'İş / Proje',
          dueDate: '2026-09-30',
        },
        {
          title: '', // Hatalı satır
          description: 'Başlıksız görev',
        },
      ])

      const file = new File([jsonContent], 'test-tasks.json', { type: 'application/json' })
      const result = await parseImportFile(file, mockCategories)

      expect(result.totalRows).toBe(2)
      expect(result.validCount).toBe(1)
      expect(result.invalidCount).toBe(1)

      const validTask = result.tasks[0]
      expect(validTask.isValid).toBe(true)
      expect(validTask.title).toBe('Görev 1')
      expect(validTask.priority).toBe(Priority.High)
      expect(validTask.categoryId).toBe('cat-1')

      const invalidTask = result.tasks[1]
      expect(invalidTask.isValid).toBe(false)
      expect(invalidTask.errors).toContain('Görev başlığı zorunludur.')

      const requests = convertToCreateTaskRequests(result.tasks)
      expect(requests).toHaveLength(1)
      expect(requests[0].title).toBe('Görev 1')
    })
  })
})
