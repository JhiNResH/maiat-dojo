import type { CSSProperties } from "react";
import Image from "next/image";
import {
  buildWorkflowSpiritProfile,
  type WorkflowSpiritProfile,
} from "@/lib/workflow-spirit";

type DojoPetAvatarSize = "sm" | "md" | "lg";
type DojoPetKind = "mantis" | "leaf" | "orb" | "mask" | "spark";

const petKinds: readonly DojoPetKind[] = ["mantis", "leaf", "orb", "mask", "spark"];

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
  const style = {
    "--pet-accent": spirit.palette.accent,
    "--pet-mat": spirit.palette.mat,
    "--pet-ink": spirit.palette.ink,
  } as CSSProperties;
  const petKind = petKinds[hashSeed(`${spirit.profileId}:${spirit.discipline}:${spirit.pattern}`) % petKinds.length];

  return (
    <div
      aria-hidden="true"
      className={`dojo-pet-avatar dojo-pet-avatar-${size} dojo-pet-${spirit.pattern} dojo-pet-aura-${spirit.aura} dojo-pet-kind-${petKind}`}
      data-belt={spirit.belt}
      data-kind={petKind}
      style={style}
    >
      <div className="dojo-pet-ear dojo-pet-ear-left" />
      <div className="dojo-pet-ear dojo-pet-ear-right" />
      <div className="dojo-pet-head">
        <Image
          className="dojo-pet-logo"
          src="/brand/dojo-mantis-logo.png"
          alt=""
          width={225}
          height={210}
          sizes="74px"
        />
        <div className="dojo-pet-crest" />
        <div className="dojo-pet-eye dojo-pet-eye-left" />
        <div className="dojo-pet-eye dojo-pet-eye-right" />
        <div className="dojo-pet-nose" />
        <div className="dojo-pet-mouth" />
        <div className="dojo-pet-belt" />
      </div>
      <div className="dojo-pet-shadow" />
    </div>
  );
}

export default DojoPetAvatar;
