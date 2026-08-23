import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks'
import { taskService } from '../services'
import { TaskStatus } from '../types'
import type { Task } from '../types'
import { getApiErrorMessage } from '../utils'

interface ChatTaskLink {
  id: string
  title: string
}

interface ChatActionLink {
  label: string
  to: string
}

interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  text: string
  tasks?: ChatTaskLink[]
  action?: ChatActionLink
}

const quickPrompts = [
  { label: 'Görev özeti', prompt: 'Görevlerimi özetle', icon: 'pi-chart-pie' },
  { label: 'Gecikenler', prompt: 'Geciken görevlerim', icon: 'pi-clock' },
  { label: 'Devam edenler', prompt: 'Devam eden görevlerim', icon: 'pi-spinner' },
]

function normalizeQuery(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
}

function getTaskLinks(tasks: Task[]): ChatTaskLink[] {
  return tasks.slice(0, 3).map((task) => ({ id: task.id, title: task.title }))
}

function getStatusPath(status: TaskStatus): string {
  return `/tasks?status=${status}`
}

export function ChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
    id: 1,
    role: 'assistant',
    text: `Merhaba${user?.firstName ? ` ${user.firstName}` : ''}! Görevlerini özetleyebilir veya geciken işleri gösterebilirim.`,
  }])
  const nextMessageId = useRef(2)
  const inputRef = useRef<HTMLInputElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    inputRef.current?.focus()

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    feedRef.current?.scrollTo?.({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [isOpen, isReplying, messages])

  function addMessage(message: Omit<ChatMessage, 'id'>) {
    const id = nextMessageId.current
    nextMessageId.current += 1
    setMessages((current) => [...current, { ...message, id }])
  }

  async function createAssistantReply(query: string): Promise<Omit<ChatMessage, 'id'>> {
    const normalized = normalizeQuery(query)

    if (/\b(ozet|durum|istatistik|kac)/.test(normalized)) {
      const statistics = await taskService.getStatistics()
      return {
        role: 'assistant',
        text: `Toplam ${statistics.total} görevin var: ${statistics.pending} bekleyen, ${statistics.inProgress} devam eden ve ${statistics.completed} tamamlanan. ${statistics.overdue > 0 ? `${statistics.overdue} görevin gecikmiş görünüyor.` : 'Geciken görevin bulunmuyor.'}`,
        action: { label: 'Tüm görevleri aç', to: '/tasks' },
      }
    }

    if (/\b(gecik|vade)/.test(normalized)) {
      const result = await taskService.getOverdue({ pageNumber: 1, pageSize: 3 })
      return result.totalCount === 0
        ? { role: 'assistant', text: 'Harika, şu anda geciken görevin bulunmuyor.' }
        : {
            role: 'assistant',
            text: `${result.totalCount} geciken görevin var. Öncelikle şunlara göz atabilirsin:`,
            tasks: getTaskLinks(result.items),
            action: { label: 'Tüm gecikenleri aç', to: '/tasks?view=overdue' },
          }
    }

    const statusRequest = [
      { pattern: /\b(devam|suruyor|aktif)/, status: TaskStatus.InProgress, label: 'devam eden' },
      { pattern: /\b(bekle)/, status: TaskStatus.Pending, label: 'bekleyen' },
      { pattern: /\b(tamam|biten|bitmis)/, status: TaskStatus.Completed, label: 'tamamlanan' },
    ].find((item) => item.pattern.test(normalized))

    if (statusRequest) {
      const result = await taskService.getAll({
        status: statusRequest.status,
        pageNumber: 1,
        pageSize: 3,
      })

      return result.totalCount === 0
        ? { role: 'assistant', text: `Şu anda ${statusRequest.label} görevin bulunmuyor.` }
        : {
            role: 'assistant',
            text: `${result.totalCount} ${statusRequest.label} görevin var. İlk sıradakiler:`,
            tasks: getTaskLinks(result.items),
            action: {
              label: `${statusRequest.label.charAt(0).toLocaleUpperCase('tr-TR')}${statusRequest.label.slice(1)} görevleri aç`,
              to: getStatusPath(statusRequest.status),
            },
          }
    }

    if (/\b(selam|merhaba|hey)\b/.test(normalized)) {
      return {
        role: 'assistant',
        text: `Merhaba${user?.firstName ? ` ${user.firstName}` : ''}! Görev özeti, gecikenler, bekleyenler veya devam eden görevler hakkında sorabilirsin.`,
      }
    }

    return {
      role: 'assistant',
      text: 'Şimdilik görev özeti, gecikenler, bekleyenler, devam edenler ve tamamlanan görevler konusunda yardımcı olabiliyorum.',
    }
  }

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim()
    if (!message || isReplying) return

    addMessage({ role: 'user', text: message })
    setInput('')
    setIsReplying(true)

    try {
      addMessage(await createAssistantReply(message))
    } catch (error) {
      addMessage({
        role: 'assistant',
        text: getApiErrorMessage(error, 'Görev bilgilerini şu anda okuyamadım. Biraz sonra tekrar deneyebilirsin.'),
      })
    } finally {
      setIsReplying(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(input)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') setIsOpen(false)
  }

  return (
    <aside className={`chat-widget${isOpen ? ' is-open' : ''}`} aria-label="Görev asistanı">
      {isOpen && (
        <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
          <header className="chat-header">
            <span className="chat-avatar" aria-hidden="true"><i className="pi pi-sparkles" /></span>
            <div>
              <div className="chat-title-row">
                <strong id="chat-title">Görev Asistanı</strong>
                <small>Beta</small>
              </div>
              <span><i aria-hidden="true" /> Çevrimiçi · Salt okunur</span>
            </div>
            <button type="button" aria-label="Asistanı kapat" onClick={() => setIsOpen(false)}>
              <i className="pi pi-times" aria-hidden="true" />
            </button>
          </header>

          <div className="chat-feed" ref={feedRef} aria-live="polite">
            {messages.map((message) => (
              <article className={`chat-message is-${message.role}`} key={message.id}>
                {message.role === 'assistant' && (
                  <span className="chat-message-avatar" aria-hidden="true"><i className="pi pi-sparkles" /></span>
                )}
                <div className="chat-bubble">
                  <p>{message.text}</p>
                  {message.tasks && message.tasks.length > 0 && (
                    <div className="chat-task-links">
                      {message.tasks.map((task) => (
                        <Link key={task.id} to={`/tasks/${task.id}`} onClick={() => setIsOpen(false)}>
                          <i className="pi pi-check-square" aria-hidden="true" />
                          <span>{task.title}</span>
                          <i className="pi pi-angle-right" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.action && (
                    <Link className="chat-action-link" to={message.action.to} onClick={() => setIsOpen(false)}>
                      {message.action.label}<i className="pi pi-arrow-right" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
            {isReplying && (
              <div className="chat-message is-assistant" aria-label="Asistan yanıt hazırlıyor">
                <span className="chat-message-avatar" aria-hidden="true"><i className="pi pi-sparkles" /></span>
                <span className="chat-typing" aria-hidden="true"><i /><i /><i /></span>
              </div>
            )}
          </div>

          <div className="chat-quick-prompts" aria-label="Hızlı sorular">
            {quickPrompts.map((item) => (
              <button key={item.label} type="button" disabled={isReplying} onClick={() => void sendMessage(item.prompt)}>
                <i className={`pi ${item.icon}`} aria-hidden="true" /> {item.label}
              </button>
            ))}
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              disabled={isReplying}
              maxLength={180}
              aria-label="Asistana mesaj yaz"
              placeholder="Görevlerin hakkında sor..."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <button type="submit" disabled={!input.trim() || isReplying} aria-label="Mesajı gönder">
              <i className="pi pi-send" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        className="chat-launcher"
        type="button"
        aria-label={isOpen ? 'Görev asistanını kapat' : 'Görev asistanını aç'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <i className={`pi ${isOpen ? 'pi-times' : 'pi-comments'}`} aria-hidden="true" />
        {!isOpen && <span>Asistan</span>}
      </button>
    </aside>
  )
}
