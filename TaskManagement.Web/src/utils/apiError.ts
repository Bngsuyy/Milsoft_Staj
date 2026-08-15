import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getValidationMessage(errors: unknown): string | null {
  if (!isRecord(errors)) {
    return null
  }

  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages)) {
      const message = messages.find((item): item is string => typeof item === 'string')
      if (message) {
        return message
      }
    }
  }

  return null
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  if (!error.response) {
    return 'API sunucusuna ulaşılamadı. Backend servisinin çalıştığını kontrol edin.'
  }

  const data: unknown = error.response.data
  if (!isRecord(data)) {
    return fallbackMessage
  }

  const validationMessage = getValidationMessage(data.errors)
  if (validationMessage) {
    return validationMessage
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (typeof data.title === 'string' && data.title.trim()) {
    return data.title
  }

  return fallbackMessage
}
