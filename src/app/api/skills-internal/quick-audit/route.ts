import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Finding = {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  evidence: string;
};

function classifyTarget(target: string): Finding[] {
  const normalized = target.toLowerCase();
  const findings: Finding[] = [
    {
      id: 'QA-001',
      severity: 'medium',
      title: 'Privileged controls require review',
      evidence: 'Fast triage assumes owner/admin paths must be manually checked before production use.',
    },
  ];

  if (normalized.includes('proxy') || normalized.includes('upgrade')) {
    findings.push({
      id: 'QA-002',
      severity: 'high',
      title: 'Upgradeable surface detected',
      evidence: 'Target hint includes proxy/upgrade semantics; verify initializer, admin, and implementation controls.',
    });
  }

  if (normalized.includes('token') || normalized.includes('erc20')) {
    findings.push({
      id: 'QA-003',
      severity: 'medium',
      title: 'Token mechanics need abuse-path review',
      evidence: 'Token targets should be checked for mint, blacklist, fee, pause, and transfer restriction paths.',
    });
  }

  return findings;
}

/**
 * POST /api/skills-internal/quick-audit
 *
 * MVP security workflow. It returns a deterministic triage report so the
 * workflow marketplace has a real first wedge before the full scanner exists.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { target, chain = 'bsc' } = body as { target?: string; chain?: string };

  if (!target || typeof target !== 'string') {
    return NextResponse.json({ error: 'target is required' }, { status: 400 });
  }

  const findings = classifyTarget(target);
  const severityWeight = findings.reduce((acc, finding) => {
    if (finding.severity === 'high') return acc + 35;
    if (finding.severity === 'medium') return acc + 18;
    return acc + 8;
  }, 0);
  const riskScore = Math.min(100, 20 + severityWeight);
  const verdict =
    riskScore >= 75 ? 'high_risk' :
    riskScore >= 45 ? 'medium_risk' :
    'low_risk';

  return NextResponse.json({
    workflow: 'quick-audit-workflow',
    target,
    chain,
    risk_score: riskScore,
    verdict,
    confidence: 0.64,
    findings,
    next_actions: [
      'Run a full manual review before handling user funds',
      'Check privileged functions and upgrade controls',
      'Add invariant tests for value-moving paths',
    ],
    generated_at: new Date().toISOString(),
  });
}
