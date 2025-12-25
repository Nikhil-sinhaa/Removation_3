import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  showCount?: boolean
  maxLength?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, showCount, maxLength, onChange, ...props }, ref) => {
    const [count, setCount] = React.useState(0)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCount(e.target.value.length)
      onChange?.(e)
    }

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-none",
            error && "border-destructive focus-visible:ring-destructive",
            showCount && "pb-6",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {showCount && maxLength && (
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {count}/{maxLength}
          </span>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// Auto-resize textarea
const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => textareaRef.current!)

    const adjustHeight = () => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }

    React.useEffect(() => {
      adjustHeight()
    }, [props.value])

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none overflow-hidden min-h-[40px]",
          className
        )}
        onInput={adjustHeight}
        {...props}
      />
    )
  }
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { Textarea, AutoResizeTextarea }