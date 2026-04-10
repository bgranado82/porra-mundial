import PredictionsPageClient from "@/components/PredictionsPageClient";

type Props = {
  params: Promise<{
    slug: string;
    entryId: string;
  }>;
};

export default async function EntryPage({ params }: Props) {
  const { entryId } = await params;
  return <PredictionsPageClient entryId={entryId} />;
}