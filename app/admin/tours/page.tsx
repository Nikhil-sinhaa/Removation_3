'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Play,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  XCircle,
  RefreshCw,
  Eye,
  Check,
  X,
  Compass,
  Layout,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourStats {
  totalStarts: number;
  completions: number;
  dismissals: number;
}

interface Tour {
  id: string;
  name: string;
  description?: string;
  pages: string[];
  steps: TourStep[];
  isActive: boolean;
  isDismissible: boolean;
  priority: number;
  stats?: TourStats;
  createdAt?: string;
  updatedAt?: string;
}

export default function ToursAdminPage() {
  const { toast } = useToast();
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewStepsOpen, setIsViewStepsOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);

  // Edit/Create form state
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    description: string;
    pages: string;
    isActive: boolean;
    isDismissible: boolean;
    priority: number;
    steps: TourStep[];
  }>({
    id: '',
    name: '',
    description: '',
    pages: '',
    isActive: true,
    isDismissible: true,
    priority: 10,
    steps: [],
  });

  const fetchTours = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/tours');
      if (!response.ok) throw new Error('Failed to fetch tours');
      const data = await response.json();
      setTours(data);
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load guided tours.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  // Compute metrics summaries
  const globalStats = useMemo(() => {
    let totalTours = tours.length;
    let activeTours = tours.filter(t => t.isActive).length;
    let totalStarts = 0;
    let totalCompletions = 0;
    let totalDismissals = 0;

    tours.forEach(t => {
      if (t.stats) {
        totalStarts += t.stats.totalStarts || 0;
        totalCompletions += t.stats.completions || 0;
        totalDismissals += t.stats.dismissals || 0;
      }
    });

    const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0;

    return {
      totalTours,
      activeTours,
      totalStarts,
      totalCompletions,
      totalDismissals,
      completionRate
    };
  }, [tours]);

  // Open Form for Create
  const handleCreateOpen = () => {
    setFormMode('create');
    setFormData({
      id: '',
      name: '',
      description: '',
      pages: '',
      isActive: true,
      isDismissible: true,
      priority: 10,
      steps: [
        {
          target: 'body',
          title: 'Welcome',
          content: 'Welcome to this page! Here is a guided tour.',
          placement: 'center'
        }
      ],
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleEditOpen = (tour: Tour) => {
    setFormMode('edit');
    setSelectedTour(tour);
    setFormData({
      id: tour.id,
      name: tour.name,
      description: tour.description || '',
      pages: tour.pages.join(', '),
      isActive: tour.isActive,
      isDismissible: tour.isDismissible,
      priority: tour.priority || 10,
      steps: [...tour.steps],
    });
    setIsFormOpen(true);
  };

  // Save Tour (Create or Edit)
  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Tour ID is required and must be unique.',
      });
      return;
    }
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Tour Name is required.',
      });
      return;
    }
    if (formData.steps.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Tour must contain at least one step.',
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      id: formData.id.trim().toLowerCase().replace(/\s+/g, '-'),
      name: formData.name.trim(),
      description: formData.description.trim(),
      pages: formData.pages.split(',').map(p => p.trim()).filter(Boolean),
      isActive: formData.isActive,
      isDismissible: formData.isDismissible,
      priority: Number(formData.priority) || 0,
      steps: formData.steps,
    };

    try {
      const url = formMode === 'create' ? '/api/admin/tours' : `/api/admin/tours/${selectedTour?.id}`;
      const method = formMode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save tour');
      }

      toast({
        title: 'Success',
        description: `Tour successfully ${formMode === 'create' ? 'created' : 'updated'}.`,
      });

      setIsFormOpen(false);
      fetchTours();
    } catch (error: any) {
      console.error('Error saving tour:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save tour.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active directly
  const handleToggleActive = async (tour: Tour) => {
    try {
      const response = await fetch(`/api/admin/tours/${tour.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tour.isActive }),
      });
      if (!response.ok) throw new Error('Failed to toggle active state');

      // Optimistic update
      setTours(prev => prev.map(t => t.id === tour.id ? { ...t, isActive: !t.isActive } : t));
      toast({
        title: 'Updated',
        description: `Tour "${tour.name}" is now ${!tour.isActive ? 'active' : 'inactive'}.`,
      });
    } catch (error) {
      console.error('Error toggling active:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update tour status.',
      });
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!tourToDelete) return;
    try {
      const response = await fetch(`/api/admin/tours/${tourToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete tour');

      toast({
        title: 'Deleted',
        description: `Tour "${tourToDelete.name}" has been deleted.`,
      });
      setTourToDelete(null);
      fetchTours();
    } catch (error) {
      console.error('Error deleting tour:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete tour.',
      });
    }
  };

  // Steps Editor logic
  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          target: '',
          title: '',
          content: '',
          placement: 'bottom'
        }
      ]
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleStepChange = (index: number, field: keyof TourStep, value: string) => {
    setFormData(prev => {
      const updatedSteps = [...prev.steps];
      updatedSteps[index] = {
        ...updatedSteps[index],
        [field]: value
      };
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.steps.length - 1) return;

    setFormData(prev => {
      const updatedSteps = [...prev.steps];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = updatedSteps[index];
      updatedSteps[index] = updatedSteps[targetIndex];
      updatedSteps[targetIndex] = temp;
      return { ...prev, steps: updatedSteps };
    });
  };

  return (
    <div className="space-y-8 p-6 text-white min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <HelpCircle className="w-8 h-8 text-violet-500 animate-pulse" />
            Guided Tours System
          </h1>
          <p className="text-neutral-400 mt-1">
            Create, manage, and monitor database-driven interactive walkthroughs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
            onClick={fetchTours}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleCreateOpen}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-800/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Tour
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Tours</p>
                <h3 className="text-3xl font-bold text-white mt-1">{globalStats.totalTours}</h3>
                <p className="text-xs text-neutral-400 mt-1">{globalStats.activeTours} active onboarding flows</p>
              </div>
              <div className="p-3 bg-violet-600/10 rounded-xl text-violet-400">
                <Compass className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Starts</p>
                <h3 className="text-3xl font-bold text-white mt-1">{globalStats.totalStarts.toLocaleString()}</h3>
                <p className="text-xs text-neutral-400 mt-1">Tour sessions triggered</p>
              </div>
              <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Completion Rate</p>
                <h3 className="text-3xl font-bold text-white mt-1">{globalStats.completionRate}%</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {globalStats.totalCompletions.toLocaleString()} completed sessions
                </p>
              </div>
              <div className="p-3 bg-green-600/10 rounded-xl text-green-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Dismissal Rate</p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {globalStats.totalStarts > 0 ? Math.round((globalStats.totalDismissals / globalStats.totalStarts) * 100) : 0}%
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {globalStats.totalDismissals.toLocaleString()} dismissals tracked
                </p>
              </div>
              <div className="p-3 bg-red-600/10 rounded-xl text-red-400">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tours Table */}
      <Card className="border-neutral-800 bg-neutral-900/40">
        <CardHeader className="border-b border-neutral-800 px-6 py-4">
          <CardTitle className="text-lg font-bold">Active Guided Onboarding Tours</CardTitle>
          <CardDescription className="text-neutral-400 text-xs">
            Toggle, edit, or view detailed steps and completion metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-neutral-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Retrieving guided tour schemas...</p>
            </div>
          ) : tours.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-12 h-12 text-neutral-600" />
              <h3 className="text-lg font-semibold text-neutral-300">No Tours Found</h3>
              <p className="text-sm max-w-md mx-auto">
                No guided tours exist in the database. Use the button above to create one or trigger the seeding process.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/60 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Tour Definition</th>
                    <th className="p-4">Target Pages</th>
                    <th className="p-4">Steps</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Engagement Analytics</th>
                    <th className="p-4 pr-6 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {tours.map((tour) => {
                    const starts = tour.stats?.totalStarts || 0;
                    const completions = tour.stats?.completions || 0;
                    const dismissals = tour.stats?.dismissals || 0;
                    const complRate = starts > 0 ? Math.round((completions / starts) * 100) : 0;

                    return (
                      <tr key={tour.id} className="hover:bg-neutral-800/10 transition-colors">
                        <td className="p-4 pl-6">
                          <div>
                            <span className="font-bold text-white text-base">{tour.name}</span>
                            <span className="block text-xs text-neutral-500 font-mono mt-0.5">ID: {tour.id}</span>
                            {tour.description && (
                              <p className="text-xs text-neutral-400 mt-1 max-w-xs truncate">{tour.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {tour.pages.map((p, idx) => (
                              <Badge key={idx} variant="outline" className="bg-neutral-800/80 text-neutral-300 border-neutral-700 text-xs font-mono">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-white">
                          {tour.steps.length} steps
                        </td>
                        <td className="p-4 font-mono text-neutral-300">
                          {tour.priority}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={tour.isActive}
                              onCheckedChange={() => handleToggleActive(tour)}
                              className="data-[state=checked]:bg-violet-600"
                            />
                            <Badge className={tour.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-neutral-800 text-neutral-400'}>
                              {tour.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1.5 max-w-[200px]">
                            <div className="flex justify-between text-xs text-neutral-400">
                              <span>Starts: <strong>{starts}</strong></span>
                              <span>Comp: <strong>{complRate}%</strong></span>
                            </div>
                            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-violet-500 h-full rounded-full"
                                style={{ width: `${Math.min(complRate, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                              <span>Completions: {completions}</span>
                              <span>Dismissals: {dismissals}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 hover:bg-neutral-800 hover:text-white"
                              title="View Steps"
                              onClick={() => {
                                setSelectedTour(tour);
                                setIsViewStepsOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 text-neutral-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 hover:bg-neutral-800 hover:text-white"
                              title="Edit Tour"
                              onClick={() => handleEditOpen(tour)}
                            >
                              <Edit className="w-4 h-4 text-neutral-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 hover:bg-red-950/40 hover:text-red-400"
                              title="Delete Tour"
                              onClick={() => setTourToDelete(tour)}
                            >
                              <Trash2 className="w-4 h-4 text-neutral-500 hover:text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW STEPS MODAL */}
      <Dialog open={isViewStepsOpen} onOpenChange={setIsViewStepsOpen}>
        <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-500" />
              Tour Steps Preview
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Steps for onboarding tour: <strong>{selectedTour?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4 mt-4 space-y-4">
            <div className="space-y-4">
              {selectedTour?.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{step.title}</span>
                      <Badge variant="outline" className="text-[10px] bg-neutral-800 border-neutral-700 text-neutral-400 py-0 px-2 font-mono capitalize">
                        {step.placement}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 font-mono break-all bg-neutral-900/60 p-1.5 rounded border border-neutral-800/80">
                      Selector: <span className="text-amber-500">{step.target}</span>
                    </p>
                    <p className="text-sm text-neutral-300 mt-2 leading-relaxed">{step.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6 border-t border-neutral-800 pt-4">
            <Button
              className="bg-neutral-800 hover:bg-neutral-700 text-white"
              onClick={() => setIsViewStepsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE & EDIT FORM MODAL */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800 text-white">
          <form onSubmit={handleSaveTour}>
            <DialogHeader className="border-b border-neutral-800 pb-4 mb-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Compass className="w-5 h-5 text-violet-500 animate-spin" />
                {formMode === 'create' ? 'Create New Guided Tour' : 'Edit Guided Onboarding Tour'}
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                Configure tour metadata and interactive highlighted steps targeting elements.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Row 1: Slug ID & Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tourId" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Tour ID (Slug) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tourId"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g. room-changer-intro"
                    disabled={formMode === 'edit'}
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-violet-500 focus:ring-0"
                    required
                  />
                  <p className="text-[10px] text-neutral-500">
                    A unique URL-friendly key identifier, e.g. <code>dream-room-flow</code>.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tourName" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Tour Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tourName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Dream Room Walkthrough"
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-violet-500 focus:ring-0"
                    required
                  />
                  <p className="text-[10px] text-neutral-500">
                    A friendly title for the dropdown help list.
                  </p>
                </div>
              </div>

              {/* Row 2: Description */}
              <div className="space-y-2">
                <Label htmlFor="tourDesc" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Description</Label>
                <Textarea
                  id="tourDesc"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the objective of this onboarding tour..."
                  rows={2}
                  className="bg-neutral-950 border-neutral-800 text-white focus:border-violet-500 focus:ring-0"
                />
              </div>

              {/* Row 3: Target Pages, Priority, Switches */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="tourPages" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Trigger Routes <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tourPages"
                    value={formData.pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                    placeholder="/dream-room, /dashboard"
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-violet-500 focus:ring-0 font-mono text-xs"
                    required
                  />
                  <p className="text-[10px] text-neutral-500">
                    Comma-separated list of paths where this tour is active.
                  </p>
                </div>

                <div className="space-y-2 col-span-1">
                  <Label htmlFor="tourPriority" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Priority (Order)</Label>
                  <Input
                    id="tourPriority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-violet-500 focus:ring-0"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Higher values run first when multiple tours match a route.
                  </p>
                </div>

                <div className="flex gap-6 mt-6 col-span-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="tourActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      className="data-[state=checked]:bg-violet-600"
                    />
                    <Label htmlFor="tourActive" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider cursor-pointer">
                      Active
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="tourDismissible"
                      checked={formData.isDismissible}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDismissible: checked }))}
                      className="data-[state=checked]:bg-violet-600"
                    />
                    <Label htmlFor="tourDismissible" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider cursor-pointer">
                      Dismissible
                    </Label>
                  </div>
                </div>
              </div>

              {/* Steps Management section */}
              <div className="border-t border-neutral-800 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-violet-500" />
                    Tour Flow Steps ({formData.steps.length})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    onClick={handleAddStep}
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5 text-violet-500" />
                    Add Flow Step
                  </Button>
                </div>

                {formData.steps.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                    No steps added yet. A tour needs at least one highlighted target step.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 relative space-y-4"
                      >
                        {/* Step Header with Reorder Actions & Delete */}
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                          <span className="text-xs font-bold text-neutral-400 uppercase flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            Step Properties
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 hover:bg-neutral-800"
                              disabled={idx === 0}
                              onClick={() => handleMoveStep(idx, 'up')}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 hover:bg-neutral-800"
                              disabled={idx === formData.steps.length - 1}
                              onClick={() => handleMoveStep(idx, 'down')}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-neutral-500 hover:text-red-500 hover:bg-red-950/20"
                              onClick={() => handleRemoveStep(idx)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Step Form Rows */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold text-neutral-500 uppercase">Target CSS Selector</Label>
                            <Input
                              value={step.target}
                              onChange={(e) => handleStepChange(idx, 'target', e.target.value)}
                              placeholder="e.g. [data-tour='sidebar-btn'] or body"
                              className="bg-neutral-950 border-neutral-800 text-white text-xs font-mono"
                              required
                            />
                            <p className="text-[9px] text-neutral-600 leading-tight">
                              Use <code>body</code> for a fullscreen dialog spotlight overlay.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold text-neutral-500 uppercase">Tooltip Title</Label>
                            <Input
                              value={step.title}
                              onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                              placeholder="Title of this highlight step"
                              className="bg-neutral-950 border-neutral-800 text-white text-xs"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold text-neutral-500 uppercase">Tooltip Placement</Label>
                            <Select
                              value={step.placement}
                              onValueChange={(val) => handleStepChange(idx, 'placement', val)}
                            >
                              <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white text-xs h-9">
                                <SelectValue placeholder="Select placement" />
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="bottom">Bottom</SelectItem>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                                <SelectItem value="center">Center (Full Screen)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold text-neutral-500 uppercase">Tooltip Content Description</Label>
                          <Textarea
                            value={step.content}
                            onChange={(e) => handleStepChange(idx, 'content', e.target.value)}
                            placeholder="Type explanations, tutorials, actions, or details..."
                            rows={2}
                            className="bg-neutral-950 border-neutral-800 text-white text-xs"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-8 border-t border-neutral-800 pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                className="bg-neutral-800 hover:bg-neutral-700 text-white"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-800/10"
                disabled={isSubmitting}
              >
                {isSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                {formMode === 'create' ? 'Create Tour' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={!!tourToDelete} onOpenChange={(open) => !open && setTourToDelete(null)}>
        <DialogContent className="max-w-md bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              Confirm Delete Tour
            </DialogTitle>
            <DialogDescription className="text-neutral-400 mt-2">
              Are you sure you want to delete tour <strong>{tourToDelete?.name}</strong> (<code>{tourToDelete?.id}</code>)?
              <span className="block text-red-400 mt-1 font-semibold">This will permanently delete the tour schema and reset user analytics. This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex gap-3">
            <Button
              className="bg-neutral-800 hover:bg-neutral-700 text-white"
              onClick={() => setTourToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
            >
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
