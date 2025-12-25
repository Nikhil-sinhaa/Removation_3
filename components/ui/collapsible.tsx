'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

import { cn } from '@/lib/utils'

/* --------------------------------------------
 * Collapsible Root
 * -------------------------------------------- */

const Collapsible = CollapsiblePrimitive.Root

/* --------------------------------------------
 * Collapsible Trigger
 * -------------------------------------------- */

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn(
      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium',
      'transition-colors hover:bg-muted',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
))

CollapsibleTrigger.displayName = 'CollapsibleTrigger'

/* --------------------------------------------
 * Collapsible Content
 * -------------------------------------------- */

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-sm text-muted-foreground',
      'data-[state=open]:animate-collapsible-down',
      'data-[state=closed]:animate-collapsible-up',
      className
    )}
    {...props}
  />
))

CollapsibleContent.displayName = 'CollapsibleContent'

/* --------------------------------------------
 * Exports
 * -------------------------------------------- */

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
}
