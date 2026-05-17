import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div className={cn(
          "w-9 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-neutral-900/10 dark:peer-focus:ring-neutral-50/10 peer-checked:after:translate-x-full peer-checked:after:left-[4px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-neutral-950 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-50 border border-transparent peer-focus:border-neutral-300 dark:peer-focus:border-neutral-700",
          className
        )} />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
