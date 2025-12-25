'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Search, TrendingUp, TrendingDown, Check, ChevronDown, Info, Building2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ALL_CITIES, type City } from '@/constants/cities';

// Define city tier types based on your constants file
type CityTier = 1 | 2 | 3;

interface CitySelectorProps {
  value: string;
  onChange: (cityId: string) => void;
  currency: 'INR' | 'USD';
  showCostIndex?: boolean;
  className?: string;
}

const TIER_COLORS: Record<CityTier, string> = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-orange-500',
};

const TIER_LABELS: Record<CityTier, string> = {
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
};

export function CitySelector({
  value,
  onChange,
  currency,
  showCostIndex = true,
  className,
}: CitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get cities based on currency
  const cities = useMemo(() => {
    if (currency === 'INR') {
      return ALL_CITIES.filter(city => city.country === 'IN');
    }
    return ALL_CITIES;
  }, [currency]);

  // Filter cities by search
  const filteredCities = useMemo(() => {
    if (!searchQuery) return cities;
    const query = searchQuery.toLowerCase();
    return cities.filter(
      (city) =>
        city.name.toLowerCase().includes(query) ||
        city.state?.toLowerCase().includes(query) ||
        city.id.toLowerCase().includes(query) ||
        city.nameHindi?.toLowerCase().includes(query)
    );
  }, [cities, searchQuery]);

  // Group cities by tier
  const groupedCities = useMemo(() => {
    const groups: Record<CityTier, City[]> = {
      1: [],
      2: [],
      3: [],
    };

    filteredCities.forEach((city) => {
      if (city.tier === 1 || city.tier === 2 || city.tier === 3) {
        groups[city.tier].push(city);
      }
    });

    return groups;
  }, [filteredCities]);

  // Get selected city
  const selectedCity = useMemo(() => {
    return cities.find((c) => c.id === value) || cities[0];
  }, [cities, value]);

  const formatCostIndex = (multiplier: number) => {
    if (multiplier > 1.5) return { label: 'High Cost', color: 'text-red-500' };
    if (multiplier > 1.2) return { label: 'Above Average', color: 'text-orange-500' };
    if (multiplier >= 0.9) return { label: 'Average', color: 'text-yellow-500' };
    return { label: 'Below Average', color: 'text-green-500' };
  };

  const getCostMultiplier = (city: City) => {
    return city.costMultiplier || 1.0;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Location
        {showCostIndex && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">
                Cost multiplier affects labor and material rates. Metro cities typically have higher costs.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-2"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  TIER_COLORS[selectedCity.tier as CityTier]
                )}
              />
              <div className="text-left">
                <div className="font-medium">{selectedCity.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedCity.state}, {selectedCity.country === 'IN' ? 'India' : selectedCity.country}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showCostIndex && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    formatCostIndex(getCostMultiplier(selectedCity)).color
                  )}
                >
                  {getCostMultiplier(selectedCity).toFixed(1)}x
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search city..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>
              <ScrollArea className="h-[300px]">
                {Object.entries(groupedCities).map(([tier, tierCities]) => {
                  const tierNum = parseInt(tier) as CityTier;
                  if (tierCities.length === 0) return null;
                  return (
                    <CommandGroup
                      key={tier}
                      heading={
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              TIER_COLORS[tierNum]
                            )}
                          />
                          {TIER_LABELS[tierNum]} Cities
                        </div>
                      }
                    >
                      {tierCities.map((city) => (
                        <CommandItem
                          key={city.id}
                          value={city.id}
                          onSelect={() => {
                            onChange(city.id);
                            setOpen(false);
                          }}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{city.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {city.state}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {showCostIndex && (
                              <span
                                className={cn(
                                  'text-xs',
                                  formatCostIndex(getCostMultiplier(city)).color
                                )}
                              >
                                {getCostMultiplier(city).toFixed(1)}x
                              </span>
                            )}
                            {value === city.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Cost Index Indicator */}
      {showCostIndex && selectedCity && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Cost Multiplier</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  formatCostIndex(getCostMultiplier(selectedCity)).color
                )}
              >
                {formatCostIndex(getCostMultiplier(selectedCity)).label}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getCostMultiplier(selectedCity) > 1.5
                    ? 'bg-red-500'
                    : getCostMultiplier(selectedCity) > 1.2
                    ? 'bg-orange-500'
                    : getCostMultiplier(selectedCity) >= 0.9
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                )}
                style={{
                  width: `${Math.min(100, (getCostMultiplier(selectedCity) / 2.0) * 100)}%`,
                }}
              />
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                {getCostMultiplier(selectedCity) > 1 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-bold">
                  {((getCostMultiplier(selectedCity) - 1) * 100).toFixed(0)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {getCostMultiplier(selectedCity) > 1
                  ? `${((getCostMultiplier(selectedCity) - 1) * 100).toFixed(0)}% above national average`
                  : `${((1 - getCostMultiplier(selectedCity)) * 100).toFixed(0)}% below national average`}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Quick Stats for Selected City */}
      {selectedCity && selectedCity.laborRatePerSqft && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Basic Labor</div>
            <div className="text-sm font-medium">
              {selectedCity.currency === 'INR' ? '₹' : '$'}
              {selectedCity.laborRatePerSqft.basic}/sqft
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Premium Labor</div>
            <div className="text-sm font-medium">
              {selectedCity.currency === 'INR' ? '₹' : '$'}
              {selectedCity.laborRatePerSqft.premium}/sqft
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Markup</div>
            <div className="text-sm font-medium">
              {selectedCity.materialMarkup || 15}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}