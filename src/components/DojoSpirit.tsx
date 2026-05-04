import Image from "next/image";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function levelFrom(receipts: number, passRate: number) {
  const trustBoost = Math.round(clamp(passRate, 0, 1) * 4);
  return clamp(Math.max(1, Math.floor(receipts / 3) + trustBoost), 1, 99);
}

export function DojoSpirit({
  name = "Dojo Spirit",
  receipts = 0,
  passRate = 1,
  forks = 0,
  status = "fed by cleared receipts",
  compact = false,
}: {
  name?: string;
  receipts?: number;
  passRate?: number;
  forks?: number;
  status?: string;
  compact?: boolean;
}) {
  const level = levelFrom(receipts, passRate);
  const mood = passRate >= 0.95 ? "focused" : passRate >= 0.8 ? "training" : "needs review";
  const sync = clamp(Math.round(passRate * 100), 0, 100);

  return (
    <div className={`dojo-spirit ${compact ? "dojo-spirit-compact" : ""}`}>
      <div className="dojo-spirit-screen">
        <div className="dojo-spirit-scanline" />
        <div className="dojo-spirit-avatar">
          <Image
            src="/brand/dojo-mantis-logo.png"
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="dojo-spirit-shadow" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              reputation pet
            </div>
            <div className="mt-1 truncate text-[14px] font-semibold text-[var(--text)]">
              {name}
            </div>
          </div>
          <div className="dojo-spirit-level">Lv.{level}</div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="dojo-spirit-stat">
            <span>Receipts</span>
            <strong>{receipts}</strong>
          </div>
          <div className="dojo-spirit-stat">
            <span>Pass</span>
            <strong>{sync}%</strong>
          </div>
          <div className="dojo-spirit-stat">
            <span>Forks</span>
            <strong>{forks}</strong>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] text-[var(--text-muted)]">
          <span className="min-w-0 truncate">{status}</span>
          <span className="font-semibold text-[var(--signal-deep)]">{mood}</span>
        </div>
      </div>
    </div>
  );
}

export default DojoSpirit;
