// app/(app)/vendor/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Store,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
  User,
  X,
  Plus,
  ChevronRight,
  AlertCircle,
  Image,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUpload } from '@/hooks/useUpload';

// ── Types ──────────────────────────────────────────────────────────────────────
const SPECIALTIES = [
  { slug: 'tile-shop', label: 'Tile Shop' },
  { slug: 'paint-store', label: 'Paint Store' },
  { slug: 'furniture-seller', label: 'Furniture Seller' },
  { slug: 'hardware-store', label: 'Hardware Store' },
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

export default function VendorRegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    phone: '',
    city: '',
    storeAddress: '',
    website: '',
    yearsOfExperience: '',
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Portfolio/store photos upload
  const portfolioUpload = useUpload({
    endpoint: 'vendorPortfolio',
    maxFiles: 10,
    maxSize: 4 * 1024 * 1024,
    autoUpload: true,
  });
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user already has a profile
  useEffect(() => {
    if (!user || isLoading) return;

    (async () => {
      try {
        const res = await fetch('/api/vendor/me');
        if (res.ok) {
          const data = await res.json();
          // Already registered — if rejected, let them edit. Otherwise redirect.
          if (!data.vendor.rejectionReason) {
            router.replace('/designers?tab=vendors');
            return;
          }
          // Pre-fill form for resubmission
          const v = data.vendor;
          setForm({
            displayName: v.displayName || '',
            bio: v.bio || '',
            phone: v.phone || '',
            city: v.city || '',
            storeAddress: v.storeAddress || '',
            website: v.website || '',
            yearsOfExperience: v.yearsOfExperience !== undefined ? String(v.yearsOfExperience) : '',
          });
          setSelectedSpecialties(v.specialties || []);
        }
      } catch {
        // 404 = no profile
      } finally {
        setCheckingProfile(false);
      }
    })();
  }, [user, isLoading, router]);

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!form.displayName.trim() || form.displayName.trim().length < 2)
      e.displayName = 'Store name must be at least 2 characters';
    if (!form.phone.trim() || form.phone.trim().length < 5)
      e.phone = 'Enter a valid phone number';
    if (!form.city.trim() || form.city.trim().length < 2)
      e.city = 'Enter your city';
    if (!form.storeAddress.trim() || form.storeAddress.trim().length < 5)
      e.storeAddress = 'Store address must be at least 5 characters';
    if (form.yearsOfExperience.trim()) {
      const y = Number(form.yearsOfExperience);
      if (isNaN(y) || !Number.isInteger(y) || y < 0 || y > 100) {
        e.yearsOfExperience = 'Enter an integer between 0 and 100';
      }
    }
    if (portfolioUpload.uploadedFiles.length === 0)
      e.portfolioImages = 'Upload at least one store photo';
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
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName:     form.displayName.trim(),
          bio:             form.bio.trim() || undefined,
          phone:           form.phone.trim(),
          city:            form.city.trim(),
          storeAddress:    form.storeAddress.trim(),
          website:         form.website.trim() || undefined,
          yearsOfExperience: form.yearsOfExperience.trim() ? Number(form.yearsOfExperience) : undefined,
          specialties:     selectedSpecialties,
          portfolioImages: portfolioUpload.uploadedFiles.map(f => f.url),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Application submitted!', description: "We'll review your profile shortly." });
      router.push('/designers?tab=vendors');
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
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
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Register as a Vendor</h1>
            <p className="text-sm text-gray-500">List your store in the marketplace to receive quote requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">
            Your store profile will be reviewed by our team before going live. This usually takes 24–48 hours.
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
            <User className="w-4 h-4 text-emerald-600" />
            Store Information
          </h2>
          <div className="space-y-4">
            <Field label="Store Name" required error={errors.displayName}>
              <Input
                id="vendor-displayName"
                placeholder="e.g. Royal Marble & Tiles"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="border-gray-200 focus-visible:ring-emerald-500"
              />
            </Field>

            <Field label="Description / Bio" error={errors.bio}>
              <Textarea
                id="vendor-bio"
                placeholder="Describe the products you offer, brands you work with, and any specializations..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                maxLength={1000}
                rows={3}
                className="border-gray-200 focus-visible:ring-emerald-500 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{form.bio.length}/1000</p>
            </Field>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Contact & Location */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Contact & Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" required error={errors.phone}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="vendor-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="pl-9 border-gray-200 focus-visible:ring-emerald-500"
                />
              </div>
            </Field>

            <Field label="City" required error={errors.city}>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="vendor-city"
                  placeholder="e.g. Bangalore"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="pl-9 border-gray-200 focus-visible:ring-emerald-500"
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Website (Optional)" error={errors.website}>
              <Input
                id="vendor-website"
                type="url"
                placeholder="e.g. https://royalmarble.com"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className="border-gray-200 focus-visible:ring-emerald-500"
              />
            </Field>

            <Field label="Years of Experience (Optional)" error={errors.yearsOfExperience}>
              <Input
                id="vendor-yearsOfExperience"
                type="number"
                placeholder="e.g. 5"
                value={form.yearsOfExperience}
                onChange={e => setForm(f => ({ ...f, yearsOfExperience: e.target.value }))}
                className="border-gray-200 focus-visible:ring-emerald-500"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Full Store Address" required error={errors.storeAddress}>
              <Input
                id="vendor-storeAddress"
                placeholder="e.g. 123 Main Road, Near Metro Station, Sector 4"
                value={form.storeAddress}
                onChange={e => setForm(f => ({ ...f, storeAddress: e.target.value }))}
                className="border-gray-200 focus-visible:ring-emerald-500"
              />
            </Field>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Store Type / Specialties */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Store Type &amp; Specialties
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Specialties</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(spec => {
                  const active = selectedSpecialties.includes(spec.slug);
                  return (
                    <Badge
                      key={spec.slug}
                      id={`specialty-${spec.slug}`}
                      variant={active ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer select-none py-1.5 px-3 rounded-lg text-xs transition-all duration-150',
                        active
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                          : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => toggleSpecialty(spec.slug)}
                    >
                      {spec.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Store Photos Upload */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              Store / Product Gallery
            </h2>
            <span className="text-xs text-gray-400">
              {portfolioUpload.uploadedFiles.length} of 10 images
            </span>
          </div>

          {/* Uploaded images list */}
          {portfolioUpload.uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              {portfolioUpload.uploadedFiles.map((file, idx) => (
                <div key={file.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
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
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              )}
              onClick={portfolioUpload.openFileDialog}
            >
              {portfolioUpload.isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <p className="text-xs text-emerald-600 font-medium">
                    Uploading… {portfolioUpload.progress.percentage}%
                  </p>
                  <div className="w-32 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${portfolioUpload.progress.percentage}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-emerald-600">Click to add</span> or drag &amp; drop
                  </p>
                  <p className="text-xs text-gray-400">JPEG · PNG · WebP · up to 4 MB each</p>
                </>
              )}
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
            id="vendor-register-submit"
            type="submit"
            disabled={isSubmitting || portfolioUpload.isUploading || portfolioUpload.uploadedFiles.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
