import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShareCard } from '@/lib/share/read';
import { ShareCard } from '@/components/share/ShareCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const card = await getShareCard(token);
  if (!card) return { title: 'Ava' };
  const who = card.displayName ? `${card.displayName}'s` : 'My';
  return {
    title: `${who} wellness baseline · Ava`,
    description: `${who} wellness baseline is ${card.overall}/100 — map your six with Ava.`,
  };
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await getShareCard(token);
  if (!card) notFound();
  return <ShareCard overall={card.overall} silhouette={card.silhouette} displayName={card.displayName} />;
}
