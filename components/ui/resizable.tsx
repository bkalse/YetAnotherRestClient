"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical"
}

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  ({ className, direction = "horizontal", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full data-[panel-group]:overflow-hidden",
          direction === "horizontal" ? "flex-row" : "flex-col",
          className,
        )}
        data-panel-group=""
        {...props}
      >
        {children}
      </div>
    )
  },
)
ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, defaultSize, minSize, maxSize, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex-1", className)}
        data-panel=""
        style={{
          flexBasis: defaultSize ? `${defaultSize}%` : undefined,
          minWidth: minSize ? `${minSize}%` : undefined,
          maxWidth: maxSize ? `${maxSize}%` : undefined,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ className, withHandle = false, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const [startX, setStartX] = React.useState(0)
    const [startWidths, setStartWidths] = React.useState<number[]>([])

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      setStartX(e.clientX)

      const handle = e.currentTarget
      const panelGroup = handle.closest("[data-panel-group]") as HTMLElement
      if (panelGroup) {
        const panels = Array.from(panelGroup.querySelectorAll("[data-panel]")) as HTMLElement[]
        const widths = panels.map((panel) => panel.getBoundingClientRect().width)
        setStartWidths(widths)
      }
    }

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return

        const handles = document.querySelectorAll("[data-panel-resize-handle]")
        const currentHandle = Array.from(handles).find(
          (handle) => handle.getAttribute("data-dragging") === "true",
        ) as HTMLElement

        if (!currentHandle) return

        const panelGroup = currentHandle.closest("[data-panel-group]") as HTMLElement
        if (!panelGroup) return

        const panels = Array.from(panelGroup.querySelectorAll("[data-panel]")) as HTMLElement[]
        if (panels.length !== 2) return

        const deltaX = e.clientX - startX
        const groupWidth = panelGroup.getBoundingClientRect().width
        const deltaPercent = (deltaX / groupWidth) * 100

        const leftPanel = panels[0]
        const rightPanel = panels[1]

        const currentLeftPercent = (startWidths[0] / groupWidth) * 100
        const newLeftPercent = Math.max(20, Math.min(80, currentLeftPercent + deltaPercent))
        const newRightPercent = 100 - newLeftPercent

        leftPanel.style.flexBasis = `${newLeftPercent}%`
        rightPanel.style.flexBasis = `${newRightPercent}%`
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        // Remove dragging attribute from all handles
        document.querySelectorAll("[data-panel-resize-handle]").forEach((handle) => {
          handle.removeAttribute("data-dragging")
        })
      }

      if (isDragging) {
        // Mark this handle as being dragged
        const handles = document.querySelectorAll("[data-panel-resize-handle]")
        handles.forEach((handle) => handle.removeAttribute("data-dragging"))
        document.querySelector("[data-panel-resize-handle]")?.setAttribute("data-dragging", "true")

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = "col-resize"
        document.body.style.userSelect = "none"
      }

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }, [isDragging, startX, startWidths])

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
          isDragging && "bg-primary",
          className,
        )}
        data-panel-resize-handle=""
        onMouseDown={handleMouseDown}
        style={{ cursor: "col-resize" }}
        {...props}
      >
        {withHandle && (
          <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
            <div className="h-2.5 w-[3px] rounded-[1px] bg-foreground/25" />
          </div>
        )}
      </div>
    )
  },
)
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
