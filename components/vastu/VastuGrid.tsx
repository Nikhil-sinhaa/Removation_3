"use client";

import React, { useState } from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle, ArrowRight, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { VastuAnalysis, VastuZone, CompassDirection, VastuSuggestion } from '@/types/vastu';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface VastuGridProps {
  analysis: VastuAnalysis;
  className?: string;
  onSelectSuggestion?: (suggestion: VastuSuggestion) => void;
  onSelectZone?: (zone: VastuZone) => void;
  compact?: boolean;
}

// Updated DIRECTIONS to match the new CompassDirection type
const DIRECTIONS: CompassDirection[] = ['NORTH', 'NORTHEAST', 'EAST', 'SOUTHEAST', 'SOUTH', 'SOUTHWEST', 'WEST', 'NORTHWEST'];

// Zone colors based on status
const getZoneColor = (status: VastuZone['status']) => {
  switch (status) {
    case 'compliant': return 'bg-emerald-500 text-white';
    case 'partial': return 'bg-amber-500 text-white';
    case 'non-compliant': return 'bg-rose-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

// Zone icons
const getZoneIcon = (status: VastuZone['status']) => {
  switch (status) {
    case 'compliant': return <CheckCircle className="w-5 h-5" />;
    case 'partial': return <AlertTriangle className="w-5 h-5" />;
    case 'non-compliant': return <XCircle className="w-5 h-5" />;
    default: return <Info className="w-5 h-5" />;
  }
};

export function VastuGrid({
  analysis,
  className,
  onSelectSuggestion,
  onSelectZone,
  compact = false
}: VastuGridProps) {
  const { t, language } = useLanguage();
  const [selectedDirection, setSelectedDirection] = useState<CompassDirection | null>(null);
  
  // Get zones from analysis or use default
  const zones: VastuZone[] = analysis.compass?.zones || [];

  // Find selected zone
  const selectedZone = selectedDirection 
    ? zones.find(z => z.direction === selectedDirection)
    : null;

  // Get suggestions for selected zone
  const zoneSuggestions = selectedZone 
    ? analysis.suggestions.filter(s => 
        s.affectedElement?.toLowerCase().includes(selectedZone.direction.toLowerCase()) ||
        s.title.toLowerCase().includes(selectedZone.direction.toLowerCase())
      )
    : [];

  // Render a single zone cell
  const renderZoneCell = (zone: VastuZone) => {
    const isSelected = selectedDirection === zone.direction;
    
    return (
      <button
        key={zone.direction}
        onClick={() => {
          setSelectedDirection(zone.direction);
          onSelectZone?.(zone);
        }}
        className={cn(
          "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200",
          "hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary",
          getZoneColor(zone.status),
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <div className="mb-2">
          {getZoneIcon(zone.status)}
        </div>
        <div className="text-xs font-semibold">{zone.direction}</div>
        <div className="text-xs opacity-90">{zone.name}</div>
      </button>
    );
  };

  // Grid layout for 3x3 compass - updated to use full direction names
  const gridLayout = [
    ['NORTHWEST', 'NORTH', 'NORTHEAST'],
    ['WEST', null, 'EAST'], // Center is typically handled separately in Vastu
    ['SOUTHWEST', 'SOUTH', 'SOUTHEAST']
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Compass Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5" />
            {t('vastu_compass') || 'Vastu Compass'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 3x3 Grid Display */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {gridLayout.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.map((direction, colIndex) => {
                  if (!direction) {
                    // Center cell - special handling
                    return (
                      <div
                        key="center"
                        className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-dashed border-muted"
                      >
                        <div className="text-sm font-semibold text-muted-foreground">Center</div>
                        <div className="text-xs text-muted-foreground">Brahmasthan</div>
                      </div>
                    );
                  }
                  
                  const zone = zones.find(z => z.direction === direction);
                  if (!zone) {
                    return (
                      <div
                        key={direction}
                        className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted text-muted-foreground"
                      >
                        <div className="text-xs font-semibold">{direction}</div>
                        <div className="text-xs opacity-90">N/A</div>
                      </div>
                    );
                  }
                  
                  return renderZoneCell(zone);
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">{t('legend') || 'Legend'}</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs">{t('compliant') || 'Compliant'}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs">{t('partial') || 'Partial'}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span className="text-xs">{t('non_compliant') || 'Non-Compliant'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Details */}
      {selectedZone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedZone.name} ({selectedZone.direction})</span>
              <Badge className={getZoneColor(selectedZone.status)}>
                {selectedZone.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zone Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('element') || 'Element'}</p>
                <p className="font-medium">{selectedZone.element}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('deity') || 'Deity'}</p>
                <p className="font-medium">{selectedZone.deity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('ideal_colors') || 'Ideal Colors'}</p>
                <p className="font-medium">{selectedZone.colors.join(', ')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('ideal_for') || 'Ideal For'}</p>
                <p className="font-medium">{selectedZone.idealFor.join(', ')}</p>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium mb-2">{t('recommendations') || 'Recommendations'}</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">{t('do') || 'Do:'}</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {selectedZone.idealFor.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('avoid') || 'Avoid:'}</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {selectedZone.avoidFor.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Suggestions for this zone */}
            {zoneSuggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {t('suggestions_for_zone') || 'Suggestions for this zone'} ({zoneSuggestions.length})
                </h4>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {zoneSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => onSelectSuggestion?.(suggestion)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{suggestion.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {suggestion.description}
                            </p>
                          </div>
                          <Badge variant={
                            suggestion.priority === 'critical' ? 'destructive' :
                            suggestion.priority === 'high' ? 'default' :
                            suggestion.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSuggestion?.(suggestion);
                          }}
                        >
                          {t('view_details') || 'View Details'}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{analysis.overallScore.value}</p>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {zones.filter(z => z.status === 'compliant').length}
                </p>
                <p className="text-sm text-muted-foreground">Compliant Zones</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {zones.filter(z => z.status === 'partial').length}
                </p>
                <p className="text-sm text-muted-foreground">Partial Zones</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-rose-600">
                  {zones.filter(z => z.status === 'non-compliant').length}
                </p>
                <p className="text-sm text-muted-foreground">Non-Compliant Zones</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}