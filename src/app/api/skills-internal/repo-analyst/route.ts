import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_REPO = 'https://github.com/garrytan/gbrain';
const MAX_README_CHARS = 45_000;

type RepoInput = {
  repo_url?: string;
  repo?: string;
  question?: string;
};

function parseGitHubRepo(raw: string) {
  const normalized = raw.includes('://') ? raw : `https://github.com/${raw}`;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  if (url.hostname !== 'github.com') return null;
  const [owner, repo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) return null;

  return {
    owner,
    repo: repo.replace(/\.git$/, ''),
    webUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, '')}`,
  };
}

function extractSection(readme: string, heading: string, fallbackLength = 900) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = readme.match(new RegExp(`(^|\\n)#{1,3}\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s+|$)`, 'i'));
  if (match?.[2]) return match[2].trim().slice(0, fallbackLength);
  return readme.slice(0, fallbackLength).trim();
}

function hasAny(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

async function fetchReadme(owner: string, repo: string) {
  const candidates = ['README.md', 'readme.md'];
  const branches = ['master', 'main'];

  for (const branch of branches) {
    for (const filename of candidates) {
      const res = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`,
        {
          headers: { Accept: 'text/plain' },
          signal: AbortSignal.timeout(12_000),
        },
      );
      if (res.ok) {
        return {
          branch,
          filename,
          text: (await res.text()).slice(0, MAX_README_CHARS),
        };
      }
    }
  }

  throw new Error('README not found on main or master');
}

/**
 * POST /api/skills-internal/repo-analyst
 *
 * Live public-repo analyst workflow for the VC demo. It reads a public GitHub
 * README, extracts agent-builder signals, and returns a structured clearing
 * result. Default input points at Garry Tan's public GBrain repo.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as RepoInput;
  const repoInput = body.repo_url ?? body.repo ?? DEFAULT_REPO;
  const parsed = parseGitHubRepo(repoInput);

  if (!parsed) {
    return NextResponse.json(
      { error: 'repo_url must be a public github.com owner/repo URL' },
      { status: 400 },
    );
  }

  try {
    const readme = await fetchReadme(parsed.owner, parsed.repo);
    const text = readme.text;
    const overview = extractSection(text, 'GBrain');
    const install = extractSection(text, 'Install');
    const architecture = extractSection(text, 'Architecture');

    const signals = [
      hasAny(text, ['MCP', 'Model Context Protocol']) && 'MCP-compatible agent memory surface',
      hasAny(text, ['skill', 'skills']) && 'workflow encoded as reusable skills',
      hasAny(text, ['cron', 'overnight', 'autonomously']) && 'recurring autonomous maintenance loop',
      hasAny(text, ['knowledge graph', 'typed links', 'backlink']) && 'graph-backed memory and retrieval',
      hasAny(text, ['eval', 'benchmark', 'P@5', 'R@5']) && 'evaluation-backed retrieval quality claims',
    ].filter(Boolean);

    const risks = [
      'Public README analysis only; private deployment data is not accessed.',
      'Install and API-key setup still require operator approval.',
      'Repo-level claims should be verified against a running deployment before production use.',
    ];

    const fitScore = Math.min(1, 0.55 + signals.length * 0.09);
    const verdict = fitScore >= 0.82 ? 'strong_fit_for_agent_memory' : 'promising_requires_validation';

    return NextResponse.json({
      workflow: 'agent-repo-analyst',
      repo: parsed.webUrl,
      question:
        body.question ??
        'Is this useful for building persistent-memory agents?',
      verdict,
      fit_score: Number(fitScore.toFixed(2)),
      summary:
        'GBrain is a public agent-memory stack that packages persistent knowledge, skills, MCP access, ingestion, and maintenance loops for AI agents.',
      signals,
      install_path: install
        ? install.split('\n').slice(0, 8).join('\n')
        : 'Follow the repository README install instructions.',
      architecture_notes: architecture || overview,
      risks,
      sources: [
        {
          title: `${parsed.owner}/${parsed.repo} README`,
          url: `${parsed.webUrl}/blob/${readme.branch}/${readme.filename}`,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Repo analysis failed';
    return NextResponse.json(
      { error: message, repo: parsed.webUrl },
      { status: 502 },
    );
  }
}
