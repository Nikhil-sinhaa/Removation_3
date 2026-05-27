// app/(app)/designer/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Briefcase,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
  User,
  X,
  Image as ImageIcon,
  ChevronRight,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUpload } from '@/hooks/useUpload';

// ── Types ──────────────────────────────────────────────────────────────────────
const SPECIALTIES = [
  { slug: 'modular-kitchen',    label: 'Modular Kitchen' },
  { slug: 'bedroom',            label: 'Bedroom' },
  { slug: 'living-room',        label: 'Living Room' },
  { slug: 'bathroom',           label: 'Bathroom' },
  { slug: 'office',             label: 'Office' },
  { slug: 'vastu',              label: 'Vastu' },
  { slug: 'luxury',             label: 'Luxury' },
  { slug: 'budget',             label: 'Budget' },
  { slug: 'minimalist',         label: 'Minimalist' },
  { slug: 'traditional',        label: 'Traditional' },
  { slug: 'contemporary',       label: 'Contemporary' },
  { slug: 'kids-room',          label: "Kids' Room" },
  { slug: 'renovation',         label: 'Renovation' },
  { slug: 'lighting-design',    label: 'Lighting Design' },
  { slug: '3d-visualization',   label: '3D Visualization' },
] as const;

// ── Animation variants ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── Form field wrapper ──────────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DesignerRegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    phone: '',
    city: '',
    yearsOfExperience: '',
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Portfolio upload — pointed at the auth-gated designerPortfolio UploadThing route
  const portfolioUpload = useUpload({
    endpoint: 'designerPortfolio',
    maxFiles: 10,
    maxSize: 4 * 1024 * 1024, // 4MB, matches core.ts
    autoUpload: true,
  });
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user already has a profile
  useEffect(() => {
    if (!user || isLoading) return;

    (async () => {
      try {
        const res = await fetch('/api/designer/me');
        if (res.ok) {
          const data = await res.json();
          // Already registered — if rejected, let them edit. Otherwise redirect.
          if (!data.designer.rejectionReason) {
            router.replace('/designer/dashboard');
            return;
          }
          // Pre-fill form for resubmission
          const d = data.designer;
          setForm({
            displayName:      d.displayName || '',
            bio:              d.bio || '',
            phone:            d.phone || '',
            city:             d.city || '',
            yearsOfExperience: d.yearsOfExperience?.toString() || '',
          });
          setSelectedSpecialties(d.specialties || []);
        }
      } catch {
        // 404 = no profile, that's fine
      } finally {
        setCheckingProfile(false);
      }
    })();
  }, [user, isLoading, router]);

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!form.displayName.trim() || form.displayName.trim().length < 2)
      e.displayName = 'Display name must be at least 2 characters';
    if (!form.phone.trim() || form.phone.trim().length < 5)
      e.phone = 'Enter a valid phone number';
    if (!form.city.trim() || form.city.trim().length < 2)
      e.city = 'Enter your city';
    if (form.yearsOfExperience && (isNaN(Number(form.yearsOfExperience)) || Number(form.yearsOfExperience) < 0 || Number(form.yearsOfExperience) > 60))
      e.yearsOfExperience = 'Enter a number between 0 and 60';
    if (portfolioUpload.uploadedFiles.length === 0)
      e.portfolioImages = 'Upload at least one portfolio image';
    return e;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function toggleSpecialty(slug: string) {
    setSelectedSpecialties(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/designer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName:        form.displayName.trim(),
          bio:                form.bio.trim() || undefined,
          phone:              form.phone.trim(),
          city:               form.city.trim(),
          specialties:        selectedSpecialties,
          portfolioImages:    portfolioUpload.uploadedFiles.map(f => f.url),
          yearsOfExperience:  form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Application submitted!', description: "We'll review your profile shortly." });
      router.push('/designer/dashboard');
    } catch {
      toast({ title: 'Network error', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading states ────────────────────────────────────────────────────────────
  if (isLoading || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/25">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Join as a Designer</h1>
            <p className="text-sm text-gray-500">Create your professional profile to be listed publicly</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-100 rounded-xl">
          <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0" />
          <p className="text-sm text-violet-700">
            Your profile will be reviewed by our team before going live. This usually takes 24–48 hours.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
      >
        {/* Basic Info */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-600" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <Field label="Display Name" required error={errors.displayName}>
              <Input
                id="designer-displayName"
                placeholder="e.g. Priya Sharma Interiors"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="border-gray-200 focus-visible:ring-violet-500"
              />
            </Field>

            <Field label="Bio" error={errors.bio}>
              <Textarea
                id="designer-bio"
                placeholder="Briefly describe your design philosophy and expertise (optional, max 1000 chars)..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                maxLength={1000}
                rows={3}
                className="border-gray-200 focus-visible:ring-violet-500 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{form.bio.length}/1000</p>
            </Field>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Contact & Location */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-600" />
            Contact & Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" required error={errors.phone}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="designer-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="pl-10 border-gray-200 focus-visible:ring-violet-500"
                />
              </div>
            </Field>

            <Field label="City" required error={errors.city}>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="designer-city"
                  placeholder="e.g. Bangalore"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="pl-10 border-gray-200 focus-visible:ring-violet-500"
                />
              </div>
            </Field>

            <Field label="Years of Experience" error={errors.yearsOfExperience}>
              <Input
                id="designer-experience"
                type="number"
                min={0}
                max={60}
                placeholder="e.g. 5"
                value={form.yearsOfExperience}
                onChange={e => setForm(f => ({ ...f, yearsOfExperience: e.target.value }))}
                className="border-gray-200 focus-visible:ring-violet-500"
              />
            </Field>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Specialties */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            Specialties
          </h2>
          <p className="text-xs text-gray-500 mb-4">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map(({ slug, label }) => {
              const selected = selectedSpecialties.includes(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  id={`specialty-${slug}`}
                  onClick={() => toggleSpecialty(slug)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-200',
                    selected
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                  )}
                >
                  {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
                  {label}
                </button>
              );
            })}
          </div>
          {selectedSpecialties.length > 0 && (
            <p className="text-xs text-violet-600 mt-2">
              {selectedSpecialties.length} specialty selected
            </p>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Portfolio Images — real uploader via designerPortfolio UploadThing route */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-600" />
              Portfolio Images
            </h2>
            <span className={cn(
              'text-xs font-medium tabular-nums',
              portfolioUpload.uploadedFiles.length >= 10 ? 'text-amber-600' : 'text-gray-400'
            )}>
              {portfolioUpload.uploadedFiles.length}/10 images
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Upload up to 10 images (4 MB each). Files upload automatically when added.</p>

          {/* Thumbnail grid of uploaded files */}
          {portfolioUpload.uploadedFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {portfolioUpload.uploadedFiles.map((file, idx) => (
                <div key={file.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    id={`portfolio-remove-${idx}`}
                    onClick={() => portfolioUpload.removeFile(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Drop zone / add button — hidden once at 10 */}
          {portfolioUpload.uploadedFiles.length < 10 && (
            <div
              id="portfolio-dropzone"
              onDragEnter={portfolioUpload.handleDragEnter}
              onDragLeave={portfolioUpload.handleDragLeave}
              onDragOver={portfolioUpload.handleDragOver}
              onDrop={portfolioUpload.handleDrop}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 transition-all duration-200 cursor-pointer',
                portfolioUpload.isDragging
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
              )}
              onClick={portfolioUpload.openFileDialog}
            >
              {portfolioUpload.isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                  <p className="text-xs text-violet-600 font-medium">
                    Uploading… {portfolioUpload.progress.percentage}%
                  </p>
                  <div className="w-32 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${portfolioUpload.progress.percentage}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-violet-600">Click to add</span> or drag &amp; drop
                  </p>
                  <p className="text-xs text-gray-400">JPEG · PNG · WebP · up to 4 MB each</p>
                </>
              )}
              {/* Hidden file input wired to the hook */}
              <input
                ref={portfolioUpload.inputRef}
                type="file"
                id="portfolio-file-input"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={portfolioUpload.handleFileChange}
              />
            </div>
          )}

          {errors.portfolioImages && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.portfolioImages}
            </p>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">
            By submitting you agree to our marketplace terms.
          </p>
          <Button
            id="designer-register-submit"
            type="submit"
            disabled={isSubmitting || portfolioUpload.isUploading || portfolioUpload.uploadedFiles.length === 0}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit for Review
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
