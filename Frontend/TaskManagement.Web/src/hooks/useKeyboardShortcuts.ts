import { useEffect, useRef } from 'react'

export interface KeyboardShortcut {
  /** `event.key` değeri (büyük/küçük harf duyarsız karşılaştırılır). */
  key: string
  ctrl?: boolean
  /** Yalnızca yardım penceresinde gösterim içindir; `key` zaten shift'li karakteri taşır. */
  shift?: boolean
  description: string
  handler: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Sayfa genelinde klavye kısayollarını dinler. Kullanıcı bir form alanına
 * yazarken kısayollar devre dışı kalır; `Escape` her zaman çalışır.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], isEnabled = true) {
  // Dinleyicinin her kısayol değişiminde yeniden bağlanmaması için ref kullanılır.
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    if (!isEnabled) return

    function handleKeyDown(event: KeyboardEvent) {
      const isEscape = event.key === 'Escape'
      if (!isEscape && isTypingTarget(event.target)) return
      if (event.altKey || event.metaKey) return

      // `event.key` shift'li karakteri zaten içerdiği için (ör. "?" ve "/")
      // ayrıca shift durumu karşılaştırılmaz; klavye düzeninden bağımsız çalışır.
      const matched = shortcutsRef.current.find((shortcut) =>
        shortcut.key.toLowerCase() === event.key.toLowerCase()
        && Boolean(shortcut.ctrl) === event.ctrlKey)

      if (!matched) return

      event.preventDefault()
      matched.handler()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled])
}
