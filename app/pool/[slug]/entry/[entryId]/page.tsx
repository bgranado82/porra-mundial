import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    slug: string;
    entryId: string;
  }>;
};

export default async function EntryPage({ params }: Props) {
  const { entryId } = await params;
  redirect(`/predictions?entryId=${entryId}`);
}