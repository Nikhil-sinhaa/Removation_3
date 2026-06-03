import { Suspense } from 'react';
import type { Metadata } from 'next';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
import { Review } from '@/lib/db/models/Review';
import { User } from '@/lib/db/models/User';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPersonSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import DesignerDetailClient, { DetailSkeleton } from './DesignerDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

const BASE_URL = 'https://removation.ai';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectToDatabase();
    const designer = await Designer.findById(id).populate('userId', 'firstName lastName imageUrl').lean();
    if (!designer) return { title: 'Designer Not Found' };

    const d = designer as Record<string, unknown>;
    const name = String(d.displayName || '');
    const bio  = String(d.bio || '').slice(0, 160);
    const userId = d.userId as { imageUrl?: string } | null;

    return {
      title:       `${name} — Interior Designer`,
      description: bio || `Book ${name}, a verified interior designer on Removation.ai.`,
      openGraph: {
        title:       `${name} — Interior Designer on Removation.ai`,
        description: bio,
        url:         `${BASE_URL}/designers/${id}`,
        images:      userId?.imageUrl ? [{ url: userId.imageUrl }] : [],
      },
    };
  } catch {
    return { title: 'Interior Designer | Removation.ai' };
  }
}

export default async function DesignerDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch data server-side for JSON-LD schema (client component refetches for interactivity)
  let personSchema: Record<string, unknown> | null = null;
  let breadcrumbSchema: Record<string, unknown> | null = null;
  let initialDesigner = null;
  let initialReviews: Array<{
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    designerReply?: string;
    designerRepliedAt?: string;
    createdAt: string;
    reviewer: { name: string; imageUrl: string | null };
  }> = [];
  let totalReviewsCountInitial = 0;
  let hasMoreReviewsInitial = false;

  try {
    await connectToDatabase();

    const [designer, reviewDocs] = await Promise.all([
      Designer.findById(id).populate('userId', 'firstName lastName imageUrl').lean(),
      Review.find({ designerId: id, isVisible: true })
        .sort({ createdAt: -1 })
        .limit(11)
        .populate('customerId', 'firstName lastName imageUrl')
        .lean(),
    ]);

    if (designer) {
      const d = designer as Record<string, unknown>;
      const userId = d.userId as { _id: string; firstName?: string; lastName?: string; imageUrl?: string } | null;
      const displayName = String(d.displayName || '');
      const profileUrl  = `${BASE_URL}/designers/${id}`;

      // Build initial designer shape for client component
      initialDesigner = {
        _id:                         String(d._id),
        displayName,
        bio:                         d.bio as string | undefined,
        city:                        String(d.city || ''),
        phone:                       d.phone as string | undefined,
        specialties:                 (d.specialties as string[]) || [],
        portfolioImages:             (d.portfolioImages as string[]) || [],
        yearsOfExperience:           d.yearsOfExperience as number | undefined,
        consultationFee:             d.consultationFee as { amount: number; currency: string } | undefined,
        projectMinFee:               d.projectMinFee as { amount: number; currency: string } | undefined,
        acceptsConsultations:        Boolean(d.acceptsConsultations),
        acceptsProjects:             Boolean(d.acceptsProjects),
        consultationDurationMinutes: d.consultationDurationMinutes as number | undefined,
        createdAt:                   String(d.createdAt),
        averageRating:               d.averageRating as number | undefined,
        totalReviews:                d.totalReviews as number | undefined,
        userId:                      userId ? {
          _id:      String(userId._id),
          firstName: userId.firstName,
          lastName:  userId.lastName,
          imageUrl:  userId.imageUrl,
        } : undefined,
      };

      // Map reviews for client component
      const PAGE_SIZE = 10;
      initialReviews = reviewDocs.slice(0, PAGE_SIZE).map(r => {
        const rv = r as Record<string, unknown>;
        const customer = rv.customerId as { firstName?: string; lastName?: string; imageUrl?: string } | null;
        const name = customer
          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer'
          : 'Customer';
        return {
          id:               String(rv._id),
          rating:           Number(rv.rating),
          title:            rv.title as string | undefined,
          comment:          rv.comment as string | undefined,
          designerReply:    rv.designerReply as string | undefined,
          designerRepliedAt: rv.designerRepliedAt ? String(rv.designerRepliedAt) : undefined,
          createdAt:        String(rv.createdAt),
          reviewer:         { name, imageUrl: customer?.imageUrl || null },
        };
      });
      totalReviewsCountInitial = reviewDocs.length;
      hasMoreReviewsInitial    = reviewDocs.length > PAGE_SIZE;

      // Build Person schema with aggregate rating
      personSchema = buildPersonSchema({
        name:            displayName,
        image:           userId?.imageUrl,
        description:     d.bio as string | undefined,
        addressLocality: String(d.city || ''),
        url:             profileUrl,
        ratingValue:     d.averageRating as number | undefined,
        ratingCount:     d.totalReviews as number | undefined,
        reviews:         initialReviews.slice(0, 5).map(r => ({
          author:        r.reviewer.name,
          datePublished: r.createdAt.split('T')[0],
          reviewBody:    r.comment || '',
          reviewRating:  r.rating,
        })),
      });

      breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Home',      item: '/' },
        { name: 'Designers', item: '/designers' },
        { name: displayName, item: `/designers/${id}` },
      ]);
    }
  } catch { /* non-blocking — client component still renders */ }

  return (
    <>
      {personSchema    && <JsonLd schema={personSchema} />}
      {breadcrumbSchema && <JsonLd schema={breadcrumbSchema} />}
      <Suspense fallback={<DetailSkeleton />}>
        <DesignerDetailClient
          initialDesigner={initialDesigner}
          initialReviews={initialReviews}
          totalReviewsCountInitial={totalReviewsCountInitial}
          hasMoreReviewsInitial={hasMoreReviewsInitial}
        />
      </Suspense>
    </>
  );
}
