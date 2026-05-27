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
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
    portfolioImages: [''],
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
            portfolioImages:  d.portfolioImages?.length ? d.portfolioImages : [''],
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
    const imgs = form.portfolioImages.filter(u => u.trim());
    if (imgs.length > 10) e.portfolioImages = 'Maximum 10 portfolio images';
    return e;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function toggleSpecialty(slug: string) {
    setSelectedSpecialties(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  }

  function updateImage(index: number, value: string) {
    const imgs = [...form.portfolioImages];
    imgs[index] = value;
    setForm(f => ({ ...f, portfolioImages: imgs }));
  }

  function addImageField() {
    if (form.portfolioImages.length < 10) {
      setForm(f => ({ ...f, portfolioImages: [...f.portfolioImages, ''] }));
    }
  }

  function removeImageField(index: number) {
    if (form.portfolioImages.length > 1) {
      setForm(f => ({
        ...f,
        portfolioImages: f.portfolioImages.filter((_, i) => i !== index),
      }));
    }
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
          portfolioImages:    form.portfolioImages.filter(u => u.trim()),
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

        {/* Portfolio Images */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-600" />
            Portfolio Images
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Paste public image URLs (max 10).{' '}
            {/* TODO: Replace with real uploader via Uploadthing once integrated */}
            <span className="text-violet-500">Image upload coming soon.</span>
          </p>
          <div className="space-y-2">
            {form.portfolioImages.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  id={`portfolio-image-${idx}`}
                  type="url"
                  placeholder={`https://your-portfolio.com/image-${idx + 1}.jpg`}
                  value={url}
                  onChange={e => updateImage(idx, e.target.value)}
                  className="border-gray-200 focus-visible:ring-violet-500"
                />
                {form.portfolioImages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {form.portfolioImages.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImageField}
                className="border-dashed border-gray-300 text-gray-500 hover:text-violet-600 hover:border-violet-300"
              >
                + Add another image
              </Button>
            )}
          </div>
          {errors.portfolioImages && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
            disabled={isSubmitting}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 gap-2 rounded-xl"
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
