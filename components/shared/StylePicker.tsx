import React, { useState, useMemo } from 'react';
import { Check, Search, Sparkles, TrendingUp, Crown, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DESIGN_STYLES, STYLE_CATEGORIES, StyleCategory, getStylesByCategory, getPopularStyles, getIndianStyles } from '@/constants/styles-400';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface StylePickerProps {
  selectedStyle?: string;
  onStyleSelect: (styleId: string) => void;
  className?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showPopular?: boolean;
  showIndian?: boolean;
  compact?: boolean;
  maxHeight?: number;
}

export function StylePicker({
  selectedStyle,
  onStyleSelect,
  className,
  showSearch = true,
  showCategories = true,
  showPopular = true,
  showIndian = true,
  compact = false,
  maxHeight = 600,
}: StylePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory | 'all' | 'popular' | 'indian'>('all');

  const categories = useMemo(() => {
    const items = [
      { id: 'all' as const, label: 'All Styles', labelHi: 'सभी शैलियाँ' },
      { id: 'popular' as const, label: 'Popular', labelHi: 'लोकप्रिय' },
      ...Object.entries(STYLE_CATEGORIES).map(([id, { name, nameHi }]) => ({
        id: id as StyleCategory,
        label: name,
        labelHi: nameHi,
      })),
    ];
    
    if (showIndian) {
      items.splice(2, 0, {
        id: 'indian' as const,
        label: 'Indian Styles',
        labelHi: 'भारतीय शैलियाँ',
      });
    }
    
    return items;
  }, [showIndian]);

  const filteredStyles = useMemo(() => {
    let styles = DESIGN_STYLES;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      styles = styles.filter(style =>
        style.name.toLowerCase().includes(query) ||
        style.nameHi.includes(query) ||
        style.keywords.some(k => k.includes(query)) ||
        style.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory === 'popular') {
      styles = getPopularStyles(20);
    } else if (selectedCategory === 'indian') {
      styles = getIndianStyles();
    } else if (selectedCategory !== 'all') {
      styles = getStylesByCategory(selectedCategory);
    }
    
    return styles;
  }, [searchQuery, selectedCategory]);

  const getStyleById = (id: string) => {
    return DESIGN_STYLES.find(style => style.id === id);
  };

  const selectedStyleData = selectedStyle ? getStyleById(selectedStyle) : null;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const hasFilters = searchQuery || selectedCategory !== 'all';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected Style Preview */}
      {selectedStyleData && !compact && (
        <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={selectedStyleData.thumbnail}
                alt={selectedStyleData.name}
                fill
                className="object-cover"
              />
              {selectedStyleData.premium && (
                <div className="absolute top-1 right-1">
                  <Badge className="bg-amber-500 text-white px-2 py-0.5 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedStyleData.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStyleData.nameHi}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onStyleSelect('')}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm mt-2">{selectedStyleData.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  {STYLE_CATEGORIES[selectedStyleData.category].name}
                </Badge>
                {selectedStyleData.premium && (
                  <Badge className="bg-amber-500 text-white text-xs">
                    Premium
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {selectedStyleData.popularity}% Popular
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search styles (modern, indian, luxury...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {hasFilters && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredStyles.length} style{filteredStyles.length !== 1 ? 's' : ''} found
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-8"
          >
            <X className="w-3 h-3 mr-1" />
            Clear filters
          </Button>
        </div>
      )}

      {/* Category Tabs */}
      {showCategories && (
        <ScrollArea className="w-full">
          <Tabs
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as typeof selectedCategory)}
            className="w-full"
          >
            <TabsList className="h-auto p-1 flex flex-wrap justify-start bg-transparent">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className={cn(
                    "data-[state=active]:bg-primary data-[state=active]:text-white",
                    "px-3 py-2 text-sm h-auto",
                    "whitespace-nowrap"
                  )}
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </ScrollArea>
      )}

      {/* Styles Grid */}
      <ScrollArea className="w-full" style={{ maxHeight }}>
        <div className={cn(
          "grid gap-3 p-1",
          compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        )}>
          {filteredStyles.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => onStyleSelect(style.id)}
                className={cn(
                  "group relative flex flex-col items-center p-3 rounded-lg border transition-all duration-200",
                  "hover:border-primary hover:shadow-md",
                  isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5",
                  "focus:outline-none focus:ring-2 focus:ring-primary"
                )}
              >
                <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3">
                  <Image
                    src={style.thumbnail}
                    alt={style.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {style.premium && (
                    <div className="absolute top-2 right-2">
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="bg-primary text-white p-2 rounded-full">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full text-left">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {style.name}
                    </h4>
                    {style.popularity > 80 && (
                      <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {style.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        style.premium && "border-amber-500 text-amber-600"
                      )}
                    >
                      {STYLE_CATEGORIES[style.category].name}
                    </Badge>
                    {style.premium ? (
                      <span className="text-xs text-amber-600 font-medium">
                        Pro
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Free
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {filteredStyles.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No styles found</h3>
          <p className="text-muted-foreground">
            Try a different search or category
          </p>
        </div>
      )}

      {/* Popular Styles Quick Picks */}
      {showPopular && selectedCategory === 'all' && !searchQuery && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Popular Picks
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory('popular')}
              className="text-xs"
            >
              View all
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {getPopularStyles(4).map((style) => (
              <button
                key={style.id}
                onClick={() => onStyleSelect(style.id)}
                className="group relative p-3 rounded-lg border hover:border-primary transition-all"
              >
                <div className="relative aspect-square rounded-md overflow-hidden mb-2">
                  <Image
                    src={style.thumbnail}
                    alt={style.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h4 className="font-medium text-sm truncate">{style.name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {style.popularity}% popular
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}