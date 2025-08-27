import { AppOverview } from "../../../../components/dashboard/app-overview";

export default async function AppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppOverview appId={id} />;
}
