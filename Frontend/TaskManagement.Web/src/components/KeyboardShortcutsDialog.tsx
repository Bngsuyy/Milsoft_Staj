import { Dialog } from 'primereact/dialog'
import type { KeyboardShortcut } from '../hooks/useKeyboardShortcuts'

interface KeyboardShortcutsDialogProps {
  shortcuts: KeyboardShortcut[]
  onHide: () => void
}

function formatShortcut(shortcut: KeyboardShortcut): string[] {
  const keys: string[] = []
  if (shortcut.ctrl) keys.push('Ctrl')
  if (shortcut.shift) keys.push('Shift')
  keys.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase())
  return keys
}

export function KeyboardShortcutsDialog({ shortcuts, onHide }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog
      className="shortcuts-dialog"
      header="Klavye kısayolları"
      visible
      modal
      draggable={false}
      style={{ width: '30rem' }}
      breakpoints={{ '640px': 'calc(100vw - 2rem)' }}
      onHide={onHide}
    >
      <ul className="shortcut-list">
        {shortcuts.map((shortcut) => (
          <li key={`${shortcut.ctrl ? 'ctrl-' : ''}${shortcut.shift ? 'shift-' : ''}${shortcut.key}`}>
            <span>{shortcut.description}</span>
            <span className="shortcut-keys">
              {formatShortcut(shortcut).map((key) => <kbd key={key}>{key}</kbd>)}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
