import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SkillPageClient from './SkillPageClient';

export const dynamic = 'force-dynamic';

export default async function SkillPage({ params }: { params: { id: string } }) {
  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
    include: {
      creator: true,
      sessions: {
        where: { status: { in: ['settled', 'refunded'] } },
        select: { callCount: true, status: true },
      },
    },
  });

  if (!skill) notFound();

  const totalCalls = skill.sessions.reduce((sum, s) => sum + s.callCount, 0);
  const totalSessions = skill.sessions.length;
  const passedSessions = skill.sessions.filter((s) => s.status === 'settled').length;
  const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

  return (
    <SkillPageClient
      skill={{
        id: skill.id,
        name: skill.name,
        description: skill.description,
        longDescription: skill.longDescription,
        category: skill.category,
        pricePerCall: skill.pricePerCall,
        price: skill.price,
        skillType: skill.skillType,
        gatewaySlug: skill.gatewaySlug,
        fileContent: skill.fileContent,
        evaluationScore: skill.evaluationScore,
        createdAt: skill.createdAt.toISOString(),
        updatedAt: skill.updatedAt.toISOString(),
        creator: {
          id: skill.creator.id,
          displayName: skill.creator.displayName,
          walletAddress: skill.creator.walletAddress,
        },
      }}
      totalCalls={totalCalls}
      totalSessions={totalSessions}
      passRate={passRate}
    />
  );
}
