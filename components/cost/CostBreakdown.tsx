'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Package,
  Hammer,
  Percent,
  Truck,
  Shield,
  Wrench,
  Lightbulb,
  Droplets,
  PaintBucket,
  Sofa,
  Layers,
  Info
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'

import type {
  UICostEstimate,
  UICostCategory,
  UICostLineItem
} from '@/types/cost'

/* ---------------------------------------------
   Props
--------------------------------------------- */

interface CostBreakdownProps {
  estimate: UICostEstimate | null
  currency: 'INR' | 'USD'
  isLoading: boolean
  formatCurrency: (amount: number) => string
  includeGST: boolean
  onToggleGST: (value: boolean) => void
}

/* ---------------------------------------------
   Icons & Colors
--------------------------------------------- */

const categoryIcons: Record<string, React.ReactNode> = {
  flooring: <Layers className="h-4 w-4" />,
  painting: <PaintBucket className="h-4 w-4" />,
  electrical: <Lightbulb className="h-4 w-4" />,
  plumbing: <Droplets className="h-4 w-4" />,
  furniture: <Sofa className="h-4 w-4" />,
  fixtures: <Wrench className="h-4 w-4" />,
  labor: <Hammer className="h-4 w-4" />,
  transport: <Truck className="h-4 w-4" />,
  warranty: <Shield className="h-4 w-4" />,
  materials: <Package className="h-4 w-4" />,
  tax: <Percent className="h-4 w-4" />
}

const categoryColors: Record<string, string> = {
  flooring: 'bg-amber-500',
  painting: 'bg-blue-500',
  electrical: 'bg-yellow-500',
  plumbing: 'bg-cyan-500',
  furniture: 'bg-purple-500',
  fixtures: 'bg-pink-500',
  labor: 'bg-orange-500',
  transport: 'bg-slate-500',
  warranty: 'bg-green-500',
  materials: 'bg-indigo-500',
  tax: 'bg-red-500'
}

/* ---------------------------------------------
   Component
--------------------------------------------- */

export function CostBreakdown({
  estimate,
  currency,
  isLoading,
  formatCurrency,
  includeGST,
  onToggleGST
}: CostBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  /* ---------------------------------------------
     Loading State
  --------------------------------------------- */

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  /* ---------------------------------------------
     Empty State
  --------------------------------------------- */

  if (!estimate) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>No estimate available</p>
          <p className="text-sm">
            Select materials and options to see breakdown
          </p>
        </CardContent>
      </Card>
    )
  }

  const total = estimate.total

  /* ---------------------------------------------
     Render
  --------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* GST Toggle */}
      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="gst-toggle" className="text-sm">
                Include 18% GST
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Goods and Services Tax applicable in India
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="gst-toggle"
              checked={includeGST}
              onCheckedChange={onToggleGST}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-2">
        {estimate.categories.map(
          (category: UICostCategory, index: number) => {
            const isExpanded = expandedCategories.includes(category.id)
            const percentage =
              total > 0 ? (category.amount / total) * 100 : 0

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    isExpanded && 'ring-2 ring-primary/20'
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'rounded-lg bg-opacity-20 p-2',
                            categoryColors[category.id] ?? 'bg-gray-500'
                          )}
                        >
                          {categoryIcons[category.id] ?? (
                            <Package className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {category.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category.itemCount ?? 0} items
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(category.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <Progress value={percentage} className="h-1.5" />
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2 border-t pt-3">
                            {category.items.map(
                              (item: UICostLineItem, itemIndex: number) => (
                                <div
                                  key={itemIndex}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {item.name}
                                    </span>
                                    {item.quantity && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        x{item.quantity}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="font-medium">
                                    {formatCurrency(item.total)}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          }
        )}
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="space-y-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(estimate.subtotal)}</span>
          </div>

          {estimate.discount && estimate.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(estimate.discount)}</span>
            </div>
          )}

          {includeGST && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>{formatCurrency(estimate.tax)}</span>
            </div>
          )}

          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span className="text-green-600">
              {formatCurrency(estimate.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Price per sq.ft */}
      {estimate.pricePerSqFt && (
        <div className="text-center">
          <Badge variant="outline">
            {formatCurrency(estimate.pricePerSqFt)} per sq.ft
          </Badge>
        </div>
      )}
    </div>
  )
}
