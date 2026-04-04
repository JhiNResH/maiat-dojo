"use client";

import { useState } from "react";
import { Copy, Layers } from "lucide-react";
import { SkillCard, type SkillCardData } from "@/components/SkillCard";
import CopyBuildModal from "@/components/CopyBuildModal";
import type { AgentSkillData } from "./page";

interface EquippedBuildProps {
  agentId: string;
  agentName: string;
  skills: AgentSkillData[];
}

export default function EquippedBuild({ agentId, agentName, skills }: EquippedBuildProps) {
  const [showModal, setShowModal] = useState(false);

  // Transform to SkillCardData
  const cardSkills: SkillCardData[] = skills.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    category: s.category,
    rating: s.rating,
    installs: s.installs,
    price: s.price,
  }));

  return (
    <section className="mb-8">
      {/* Header with Copy Build button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-[#1a1a1a]/50" />
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50">
            Equipped Build ({skills.length} skills)
          </h2>
        </div>

        {skills.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs px-4 py-2 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider"
          >
            <Copy size={12} />
            COPY BUILD
          </button>
        )}
      </div>

      {/* Skill Cards Grid */}
      {skills.length === 0 ? (
        <p className="font-mono text-sm text-[#1a1a1a]/40 italic">
          No skills equipped yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {cardSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              size="sm"
              showPrice={false}
              href={`/skill/${skill.id}`}
            />
          ))}
        </div>
      )}

      {/* Copy Build Modal */}
      {showModal && (
        <CopyBuildModal
          agentName={agentName}
          skills={skills}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}
