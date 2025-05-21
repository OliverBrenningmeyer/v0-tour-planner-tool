"use client"

import { useState, useCallback } from "react"

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState)
  const [history, setHistory] = useState<T[]>([initialState])
  const [pointer, setPointer] = useState(0)

  // Update state and add to history
  const updateState = useCallback(
    (newState: T) => {
      // If we're not at the end of the history, truncate it
      const newHistory = history.slice(0, pointer + 1)

      // Only add to history if the state is different
      if (JSON.stringify(newState) !== JSON.stringify(state)) {
        setHistory([...newHistory, newState])
        setPointer(newHistory.length)
        setState(newState)
      }
    },
    [history, pointer, state],
  )

  // Undo action
  const undo = useCallback(() => {
    if (pointer > 0) {
      setPointer(pointer - 1)
      setState(history[pointer - 1])
      return true
    }
    return false
  }, [history, pointer])

  // Redo action
  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      setPointer(pointer + 1)
      setState(history[pointer + 1])
      return true
    }
    return false
  }, [history, pointer])

  // Check if undo/redo are available
  const canUndo = pointer > 0
  const canRedo = pointer < history.length - 1

  return {
    state,
    updateState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentPosition: pointer + 1,
  }
}
