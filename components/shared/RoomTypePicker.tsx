import React, { useState, useMemo } from 'react';
import { Search, Home, Building, Trees, Check, X, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ROOM_TYPES, RoomType, getRoomsByVastuImportance } from '@/constants/room-types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import Image from 'next/image';

interface RoomTypePickerProps {
  selectedRoomType?: string;
  onRoomTypeSelect: (roomTypeId: string) => void;
  className?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showVastuHighlights?: boolean;
  compact?: boolean;
  maxHeight?: number;
}

export function RoomTypePicker({
  selectedRoomType,
  onRoomTypeSelect,
  className,
  showSearch = true,
  showCategories = true,
  showVastuHighlights = true,
  compact = false,
  maxHeight = 600,
}: RoomTypePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'indoor' | 'outdoor' | 'high-vastu'>('all');
  const { t, language } = useLanguage();

  const categories = [
    { id: 'all' as const, label: t('all_rooms'), icon: <Home className="w-4 h-4" /> },
    { id: 'indoor' as const, label: t('indoor_rooms'), icon: <Building className="w-4 h-4" /> },
    { id: 'outdoor' as const, label: t('outdoor_rooms'), icon: <Trees className="w-4 h-4" /> },
    { id: 'high-vastu' as const, label: t('high_vastu'), icon: <Sparkles className="w-4 h-4" /> },
  ];

  const highVastuRooms = useMemo(() => getRoomsByVastuImportance('high'), []);

  const filteredRooms = useMemo(() => {
    let rooms = ROOM_TYPES;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      rooms = rooms.filter(room =>
        room.name.toLowerCase().includes(query) ||
        room.nameHi.toLowerCase().includes(query) ||
        room.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory === 'indoor') {
      rooms = rooms.filter(room =>
        ['living-room', 'bedroom', 'kitchen', 'bathroom', 'dining-room', 'home-office', 'pooja-room',
          'foyer', 'study-room', 'wardrobe', 'media-room', 'bar', 'laundry', 'kids-playroom'].includes(room.id)
      );
    } else if (selectedCategory === 'outdoor') {
      rooms = rooms.filter(room =>
        ['balcony', 'outdoor', 'patio', 'garden', 'terrace'].includes(room.id)
      );
    } else if (selectedCategory === 'high-vastu') {
      rooms = highVastuRooms;
    }

    return rooms;
  }, [searchQuery, selectedCategory, highVastuRooms]);

  const getRoomById = (id: string) => {
    return ROOM_TYPES.find(room => room.id === id);
  };

  const selectedRoomData = selectedRoomType ? getRoomById(selectedRoomType) : null;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const hasFilters = searchQuery || selectedCategory !== 'all';

  // Helper function to get category based on room ID
  const getRoomCategory = (roomId: string): 'indoor' | 'outdoor' => {
    const outdoorRooms = ['balcony', 'outdoor', 'patio', 'garden', 'terrace'];
    return outdoorRooms.includes(roomId) ? 'outdoor' : 'indoor';
  };

  // Helper function to check if room has sub-types
  const hasSubTypes = (room: RoomType): boolean => {
    return !!(room.subTypes && room.subTypes.length > 0);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected Room Preview */}
      {selectedRoomData && !compact && (
        <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-4xl">{selectedRoomData.icon}</span>
              </div>
              {selectedRoomData.vastuImportance === 'high' && (
                <div className="absolute top-1 right-1">
                  <Badge className="bg-amber-500 text-white px-2 py-0.5 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t('high_vastu')}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedRoomData.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRoomData.nameHi}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRoomTypeSelect('')}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm mt-2">
                {language === 'hi' ? selectedRoomData.descriptionHi : selectedRoomData.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  {getRoomCategory(selectedRoomData.id) === 'indoor' ? t('indoor') : t('outdoor')}
                </Badge>
                <Badge variant={
                  selectedRoomData.vastuImportance === 'high' ? 'default' :
                    selectedRoomData.vastuImportance === 'medium' ? 'secondary' : 'outline'
                } className="text-xs">
                  {selectedRoomData.vastuImportance} {t('vastu_importance')}
                </Badge>
                {hasSubTypes(selectedRoomData) && (
                  <Badge variant="outline" className="text-xs">
                    {selectedRoomData.subTypes!.length} {t('sub_types')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('search_rooms_placeholder')}
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

      {/* Filter Info */}
      {hasFilters && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredRooms.length} {t('room', { count: String(filteredRooms.length) })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-8"
          >
            <X className="w-3 h-3 mr-1" />
            {t('clear_filters')}
          </Button>
        </div>
      )}

      {/* Category Tabs */}
      {showCategories && (
        <Tabs
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as typeof selectedCategory)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 h-10">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2"
              >
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Rooms Grid */}
      <ScrollArea className="w-full" style={{ maxHeight }}>
        <div className={cn(
          "grid gap-3 p-1",
          compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        )}>
          {filteredRooms.map((room) => {
            const isSelected = selectedRoomType === room.id;
            const isOutdoor = getRoomCategory(room.id) === 'outdoor';

            return (
              <button
                key={room.id}
                onClick={() => onRoomTypeSelect(room.id)}
                className={cn(
                  "group relative flex flex-col items-center p-3 rounded-lg border transition-all duration-200",
                  "hover:border-primary hover:shadow-md",
                  isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5",
                  "focus:outline-none focus:ring-2 focus:ring-primary"
                )}
              >
                <div className={cn(
                  "relative w-16 h-16 rounded-full mb-3 flex items-center justify-center text-2xl",
                  isOutdoor
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                )}>
                  {room.icon}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="w-full text-center">
                  <h4 className="font-medium text-sm mb-1 line-clamp-1">
                    {language === 'hi' ? room.nameHi : room.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {language === 'hi' ? room.descriptionHi : room.description}
                  </p>
                  <div className="flex flex-col items-center gap-1">
                    {room.vastuImportance === 'high' && showVastuHighlights && (
                      <Badge variant="default" className="text-xs py-0.5">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        {t('high_vastu')}
                      </Badge>
                    )}
                    {hasSubTypes(room) && (
                      <span className="text-xs text-muted-foreground">
                        {room.subTypes!.length} {t('variants')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">{t('no_rooms_found')}</h3>
          <p className="text-muted-foreground">{t('try_different_search')}</p>
        </div>
      )}

      {/* Popular Rooms Quick Picks */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('popular_picks')}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['living-room', 'bedroom', 'kitchen', 'pooja-room'].map((roomId) => {
              const room = getRoomById(roomId);
              if (!room) return null;

              return (
                <button
                  key={room.id}
                  onClick={() => onRoomTypeSelect(room.id)}
                  className="group p-3 rounded-lg border hover:border-primary transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-2xl mb-2">{room.icon}</div>
                    <h4 className="font-medium text-sm truncate">
                      {language === 'hi' ? room.nameHi : room.name}
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}