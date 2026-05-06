import type { CSSProperties } from "react";
import {
  buildWorkflowSpiritProfile,
  type WorkflowSpiritProfile,
} from "@/lib/workflow-spirit";

type DojoPetAvatarSize = "sm" | "md" | "lg";
type DojoPetKind = "novice" | "bandana" | "horned" | "sage" | "crest";

const petKinds: readonly DojoPetKind[] = ["novice", "bandana", "horned", "sage", "crest"];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function Rect({
  x,
  y,
  width,
  height,
  fill,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}) {
  return <rect x={x} y={y} width={width} height={height} fill={fill} />;
}

function Accessory({ kind, accent, paper, ink }: { kind: DojoPetKind; accent: string; paper: string; ink: string }) {
  if (kind === "bandana") {
    return (
      <>
        <Rect x={18} y={19} width={28} height={4} fill={paper} />
        <Rect x={44} y={17} width={3} height={3} fill={ink} />
        <Rect x={47} y={14} width={3} height={3} fill={ink} />
        <Rect x={47} y={20} width={3} height={3} fill={ink} />
        <Rect x={44} y={18} width={5} height={1} fill={paper} />
      </>
    );
  }

  if (kind === "horned") {
    return (
      <>
        <Rect x={18} y={11} width={3} height={5} fill={ink} />
        <Rect x={21} y={8} width={3} height={5} fill={ink} />
        <Rect x={43} y={11} width={3} height={5} fill={ink} />
        <Rect x={40} y={8} width={3} height={5} fill={ink} />
        <Rect x={19} y={11} width={2} height={4} fill={paper} />
        <Rect x={43} y={11} width={2} height={4} fill={paper} />
      </>
    );
  }

  if (kind === "sage") {
    return (
      <>
        <Rect x={14} y={16} width={36} height={3} fill={ink} />
        <Rect x={18} y={13} width={28} height={3} fill={ink} />
        <Rect x={22} y={10} width={20} height={3} fill={ink} />
        <Rect x={26} y={7} width={12} height={3} fill={ink} />
        <Rect x={18} y={16} width={28} height={2} fill={paper} />
        <Rect x={22} y={13} width={20} height={2} fill={paper} />
        <Rect x={26} y={10} width={12} height={2} fill={paper} />
      </>
    );
  }

  if (kind === "crest") {
    return (
      <>
        <Rect x={30} y={10} width={4} height={5} fill={ink} />
        <Rect x={27} y={13} width={10} height={4} fill={ink} />
        <Rect x={31} y={10} width={2} height={7} fill={accent} />
        <Rect x={28} y={14} width={8} height={2} fill={accent} />
      </>
    );
  }

  return null;
}

export function DojoPetAvatar({
  profile,
  name = "Dojo Spirit",
  workflowId,
  slug,
  category,
  creatorId,
  receipts = 0,
  passRate = 1,
  forks = 0,
  royaltyBps = 0,
  size = "md",
}: {
  profile?: WorkflowSpiritProfile;
  name?: string;
  workflowId?: string;
  slug?: string;
  category?: string | null;
  creatorId?: string | null;
  receipts?: number;
  passRate?: number;
  forks?: number;
  royaltyBps?: number | null;
  size?: DojoPetAvatarSize;
}) {
  const spirit = profile ?? buildWorkflowSpiritProfile({
    workflowId: workflowId ?? slug ?? name,
    slug: slug ?? slugify(name),
    name,
    category: category ?? null,
    creatorId,
    runCount: receipts,
    forkCount: forks,
    trustScore: passRate,
    royaltyBps,
  });
  const petKind = petKinds[hashSeed(`${spirit.profileId}:${spirit.discipline}:${spirit.pattern}`) % petKinds.length];
  const accent = spirit.palette.accent;
  const mat = spirit.palette.mat;
  const ink = "#11140f";
  const paper = "#f4f1dc";
  const style = {
    "--pet-accent": accent,
    "--pet-mat": mat,
    "--pet-ink": ink,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`dojo-pet-avatar dojo-pet-avatar-${size} dojo-pet-${spirit.pattern} dojo-pet-aura-${spirit.aura}`}
      data-belt={spirit.belt}
      data-kind={petKind}
      style={style}
    >
      <svg className="dojo-pixel-pet" viewBox="0 0 64 64" role="presentation" shapeRendering="crispEdges">
        <Rect x={14} y={18} width={4} height={22} fill={ink} />
        <Rect x={46} y={18} width={4} height={22} fill={ink} />
        <Rect x={18} y={14} width={28} height={4} fill={ink} />
        <Rect x={18} y={40} width={28} height={4} fill={ink} />
        <Rect x={18} y={18} width={28} height={22} fill={mat} />
        <Rect x={22} y={18} width={20} height={4} fill="#b9e2c2" />
        <Rect x={14} y={26} width={4} height={8} fill={mat} />
        <Rect x={46} y={26} width={4} height={8} fill={mat} />
        <Rect x={11} y={28} width={3} height={4} fill={ink} />
        <Rect x={50} y={28} width={3} height={4} fill={ink} />
        <Rect x={24} y={28} width={3} height={4} fill={ink} />
        <Rect x={37} y={28} width={3} height={4} fill={ink} />
        <Rect x={30} y={34} width={4} height={2} fill={accent} />
        <Rect x={27} y={37} width={10} height={2} fill={ink} />
        <Accessory kind={petKind} accent={accent} paper={paper} ink={ink} />
      </svg>
    </div>
  );
}

export default DojoPetAvatar;
