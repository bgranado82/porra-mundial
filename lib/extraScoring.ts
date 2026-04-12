
export function normalizeValue(value: string | null | undefined) {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function calculateExtraScore({
  predicted,
  official,
  points,
}: {
  predicted: string | null;
  official: string | null;
  points: number;
}) {
  if (!official) {
    return {
      isResolved: false,
      isHit: false,
      points: 0,
    };
  }

  const normalizedPredicted = normalizeValue(predicted);
  const normalizedOfficial = normalizeValue(official);

  const isHit = normalizedPredicted === normalizedOfficial;

  return {
    isResolved: true,
    isHit,
    points: isHit ? points : 0,
  };
}