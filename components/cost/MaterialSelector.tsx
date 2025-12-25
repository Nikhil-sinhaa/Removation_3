"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  X,
  Filter,
  SortAsc,
  Star,
  Leaf,
  Shield,
  Clock,
  TrendingUp,
  Package,
  ChevronDown,
  Info,
  Plus,
  Minus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MaterialGrade } from "@/types/cost";
import { 
  MATERIALS,
  type Material, 
  type MaterialCategory 
} from "@/constants/materials";

interface MaterialSelectorProps {
  roomType: string;
  styleType: string;
  grade: MaterialGrade;
  currency: "INR" | "USD";
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
  className?: string;
}

interface SelectedMaterial {
  materialId: string;
  quantity: number;
  variant?: string;
}

interface MaterialCategoryItem {
  id: MaterialCategory | 'all';
  name: string;
  icon: string;
}

const MATERIAL_CATEGORIES: MaterialCategoryItem[] = [
  { id: 'all', name: 'All Materials', icon: 'grid' },
  { id: 'flooring', name: 'Flooring', icon: 'grid' },
  { id: 'wall_finishes', name: 'Wall Finishes', icon: 'paintbrush' },
  { id: 'ceiling', name: 'Ceiling', icon: 'square' },
  { id: 'kitchen', name: 'Kitchen', icon: 'tree' },
  { id: 'bathroom', name: 'Bathroom', icon: 'wrench' },
  { id: 'doors_windows', name: 'Doors & Windows', icon: 'lightbulb' },
  { id: 'electrical', name: 'Electrical', icon: 'sofa' },
  { id: 'plumbing', name: 'Plumbing', icon: 'droplet' },
  { id: 'furniture', name: 'Furniture', icon: 'zap' },
  { id: 'lighting', name: 'Lighting', icon: 'square' },
  { id: 'outdoor', name: 'Outdoor', icon: 'square' },
  { id: 'structural', name: 'Structural', icon: 'square' },
];

export function MaterialSelector({
  roomType,
  styleType,
  grade,
  currency,
  onMaterialsChange,
  className,
}: MaterialSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [sortBy, setSortBy] = useState<"price" | "popularity" | "rating">("popularity");
  const [filterEco, setFilterEco] = useState(false);
  const [filterBudget, setFilterBudget] = useState<[number, number]>([0, 100000]);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  // Get materials based on filters
  const materials = useMemo(() => {
    let filtered = MATERIALS.filter((material: Material) => {
      // Category filter
      if (selectedCategory !== 'all' && material.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchIn = [
          material.name.toLowerCase(),
          material.nameHi.toLowerCase(),
          material.description.toLowerCase(),
          ...(material.brands || []).map(brand => brand.toLowerCase())
        ].join(' ');
        
        if (!searchIn.includes(query)) {
          return false;
        }
      }

      // Quality/grade filter - map MaterialGrade to quality levels
      const qualityMap: Record<MaterialGrade, Material['quality'][]> = {
        budget: ['economy'],
        standard: ['standard'],
        premium: ['premium'],
        luxury: ['luxury']
      };
      
      const allowedQualities = qualityMap[grade] || ['standard'];
      if (!allowedQualities.includes(material.quality)) {
        return false;
      }

      // Eco filter
      if (filterEco) {
        const isEco = material.advantages?.some(adv => 
          adv.toLowerCase().includes('eco') || 
          adv.toLowerCase().includes('green') ||
          adv.toLowerCase().includes('sustainable') ||
          adv.toLowerCase().includes('environment')
        );
        if (!isEco) return false;
      }

      // Budget filter - use average price
      const avgPrice = (material.priceRange.min + material.priceRange.max) / 2;
      const price = currency === 'INR' ? avgPrice : avgPrice / 83;
      if (price < filterBudget[0] || price > filterBudget[1]) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a: Material, b: Material) => {
      const avgPriceA = (a.priceRange.min + a.priceRange.max) / 2;
      const avgPriceB = (b.priceRange.min + b.priceRange.max) / 2;
      
      switch (sortBy) {
        case "price":
          return avgPriceA - avgPriceB;
        case "rating":
          const ratingA = a.quality === 'luxury' ? 5 : a.quality === 'premium' ? 4 : a.quality === 'standard' ? 3 : 2;
          const ratingB = b.quality === 'luxury' ? 5 : b.quality === 'premium' ? 4 : b.quality === 'standard' ? 3 : 2;
          return ratingB - ratingA;
        case "popularity":
        default:
          const popA = a.quality === 'luxury' ? 4 : a.quality === 'premium' ? 3 : a.quality === 'standard' ? 2 : 1;
          const popB = b.quality === 'luxury' ? 4 : b.quality === 'premium' ? 3 : b.quality === 'standard' ? 2 : 1;
          return popB - popA;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, grade, filterEco, filterBudget, currency, sortBy]);

  const formatPrice = (material: Material) => {
    const avgPrice = (material.priceRange.min + material.priceRange.max) / 2;
    const price = currency === "INR" ? avgPrice : avgPrice / 83;
    
    if (currency === "INR") {
      return `₹${Math.round(price).toLocaleString("en-IN")}`;
    }
    return `$${Math.round(price).toLocaleString("en-US")}`;
  };

  const handleMaterialSelect = (materialId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedMaterials((prev) => [...prev, { materialId, quantity: 1 }]);
    } else {
      setSelectedMaterials((prev) =>
        prev.filter((m) => m.materialId !== materialId)
      );
    }
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    setSelectedMaterials((prev) =>
      prev.map((m) =>
        m.materialId === materialId ? { ...m, quantity: Math.max(1, quantity) } : m
      )
    );
  };

  const isSelected = (materialId: string) => {
    return selectedMaterials.some((m) => m.materialId === materialId);
  };

  const getSelectedQuantity = (materialId: string) => {
    return selectedMaterials.find((m) => m.materialId === materialId)?.quantity || 1;
  };

  const calculateTotal = () => {
    return selectedMaterials.reduce((total, selected) => {
      const material = MATERIALS.find((m: Material) => m.id === selected.materialId);
      if (!material) return total;
      
      const avgPrice = (material.priceRange.min + material.priceRange.max) / 2;
      const price = currency === "INR" ? avgPrice : avgPrice / 83;
      
      return total + price * selected.quantity;
    }, 0);
  };

  // Update parent when selection changes
  React.useEffect(() => {
    onMaterialsChange(selectedMaterials);
  }, [selectedMaterials, onMaterialsChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Pills */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {MATERIAL_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-xs"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Sort and Filter Controls */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SortAsc className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={filterEco ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterEco(!filterEco)}
            className="text-xs"
          >
            <Leaf className="h-3 w-3 mr-1" />
            Eco-Friendly
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                More Filters
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Materials</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Budget Range ({currency})</Label>
                  <Slider
                    value={filterBudget}
                    min={0}
                    max={100000}
                    step={1000}
                    onValueChange={(value) => setFilterBudget(value as [number, number])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currency === "INR" ? "₹" : "$"}{filterBudget[0].toLocaleString()}</span>
                    <span>{currency === "INR" ? "₹" : "$"}{filterBudget[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Materials List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          {materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No materials found</p>
              <p className="text-xs">Try adjusting your filters</p>
            </div>
          ) : (
            materials.map((material: Material) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3 rounded-lg border transition-all cursor-pointer",
                  isSelected(material.id)
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                )}
              >
                <div
                  className="flex gap-3"
                  onClick={() => setExpandedMaterial(
                    expandedMaterial === material.id ? null : material.id
                  )}
                >
                  {/* Material Image */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {material.image ? (
                      <img
                        src={material.image}
                        alt={material.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {material.advantages?.some(adv => 
                      adv.toLowerCase().includes('eco') || 
                      adv.toLowerCase().includes('green')
                    ) && (
                      <div className="absolute top-1 left-1 p-1 bg-green-500 rounded-full">
                        <Leaf className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Material Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {material.name}
                          </span>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {material.quality}
                          </Badge>
                        </div>
                        {material.brands && material.brands.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Brands: {material.brands.slice(0, 2).join(', ')}
                            {material.brands.length > 2 && '...'}
                          </p>
                        )}
                      </div>
                      <Checkbox
                        checked={isSelected(material.id)}
                        onCheckedChange={(checked) =>
                          handleMaterialSelect(material.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-semibold text-primary">
                        {formatPrice(material)}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{material.priceRange.unit}
                        </span>
                      </span>
                      {material.lifespan && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {material.lifespan}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedMaterial === material.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t space-y-3"
                    >
                      <p className="text-xs text-muted-foreground">
                        {material.description}
                      </p>

                      {/* Specifications */}
                      {material.specifications && Object.keys(material.specifications).length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(material.specifications).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground capitalize">
                                {key}:
                              </span>{" "}
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Advantages */}
                      {material.advantages && material.advantages.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium mb-1">Advantages</h4>
                          <ul className="text-xs space-y-1">
                            {material.advantages.slice(0, 3).map((adv, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Quantity Selector */}
                      {isSelected(material.id) && (
                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span className="text-sm">Quantity ({material.priceRange.unit})</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(
                                  material.id,
                                  getSelectedQuantity(material.id) - 1
                                );
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={getSelectedQuantity(material.id)}
                              onChange={(e) =>
                                handleQuantityChange(
                                  material.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 h-7 text-center text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(
                                  material.id,
                                  getSelectedQuantity(material.id) + 1
                                );
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Selected Summary */}
      {selectedMaterials.length > 0 && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">
                {selectedMaterials.length} Materials Selected
              </span>
              <p className="text-xs text-muted-foreground">
                {selectedMaterials.reduce((sum, m) => sum + m.quantity, 0)} total items
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-primary">
                {currency === "INR" ? "₹" : "$"}
                {Math.round(calculateTotal()).toLocaleString(currency === "INR" ? "en-IN" : "en-US")}
              </div>
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setSelectedMaterials([])}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialSelector;