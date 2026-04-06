type Props = {
  title: string;
  points: number;
};

export default function TotalPointsCard({ title, points }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-[var(--iberdrola-forest)]">
        {title}
      </div>

      <div className="mt-2 text-5xl font-bold text-[var(--iberdrola-green)]">
        {points}
      </div>
    </div>
  );
}