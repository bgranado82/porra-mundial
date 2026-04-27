type Props = {
  title: string;
  points: number;
};

export default function TotalPointsCard({ title, points }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--iberdrola-green)] bg-[var(--iberdrola-forest)] p-6 shadow-lg">
      {/* Background glow */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--iberdrola-green)] opacity-20 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[var(--iberdrola-green)] opacity-10 blur-xl" />

      <div className="relative">
        <div className="text-xs font-bold uppercase tracking-widest text-white/50">
          {title}
        </div>

        <div className="mt-1 flex items-end gap-2">
          <span className="text-6xl font-black leading-none tracking-tight text-[var(--iberdrola-green)] sm:text-7xl">
            {points}
          </span>
          <span className="mb-1 text-sm font-bold text-white/40">pts</span>
        </div>
      </div>
    </div>
  );
}
