import { redirect } from "next/navigation";
import PredictionsPageClient from "@/components/PredictionsPageClient";

type Props = {
  searchParams: Promise<{
    entryId?: string;
  }>;
};

export default async function PredictionsPage({ searchParams }: Props) {
  const { entryId } = await searchParams;

  if (!entryId) {
    redirect("/post-login");
  }

  return <PredictionsPageClient entryId={entryId} />;
}