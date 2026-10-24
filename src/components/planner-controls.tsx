import { forwardRef, type ReactNode } from 'react'
import { Button, type ButtonProps } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { cn } from '../lib/utils'

type IconButtonProps = Omit<ButtonProps, 'asChild'> & { label: string; tooltipSide?: 'top' | 'right' | 'bottom' | 'left' }

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, className, variant = 'ghost', tooltipSide = 'top', ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button ref={ref} type="button" variant={variant} size="icon" className={cn('icon-control', variant === 'ghost' && 'text-muted-foreground hover:text-foreground', className)} aria-label={label} {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  )
)
IconButton.displayName = 'IconButton'
export function Modal({ title, description, children, onClose, className, hideHeader = false, headerContent }: { title: string; description?: string; children: ReactNode; onClose: () => void; className?: string; hideHeader?: boolean; headerContent?: ReactNode }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}><DialogContent className={cn('planner-dialog', className)} headerContent={headerContent} onEscapeKeyDown={event => { if (event.isComposing) event.preventDefault() }}><DialogHeader className={hideHeader ? 'sr-only' : undefined}><DialogTitle>{title}</DialogTitle><DialogDescription className={description ? '' : 'sr-only'}>{description || title}</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>
}
export function SelectField({ label, value, onChange, items, className }: { label: string; value: string; onChange: (value: string) => void; items: { value: string; label: string }[]; className?: string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className={cn('planner-select', className)}><SelectValue /></SelectTrigger><SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
}
