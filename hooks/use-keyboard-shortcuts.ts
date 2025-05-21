"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcutsProps {
  onUndo: () => void
  onRedo: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({ onUndo, onRedo, enabled = true }: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Check for Ctrl+Z (Undo)
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault()
        onUndo()
      }

      // Check for Ctrl+Y or Ctrl+Shift+Z (Redo)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z")
      ) {
        event.preventDefault()
        onRedo()
      }
    },
    [enabled, onUndo, onRedo],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}
