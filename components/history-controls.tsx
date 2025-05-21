"use client"

import { Button } from "@/components/ui/button"
import { Undo, Redo } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HistoryControlsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  historyLength: number
  currentPosition: number
}

export function HistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyLength,
  currentPosition,
}: HistoryControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              className="h-8 w-8"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
              className="h-8 w-8"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <span className="text-xs text-muted-foreground ml-1">
        {currentPosition} / {historyLength}
      </span>
    </div>
  )
}
