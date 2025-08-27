import { AppApiKeys } from "../../../../../components/dashboard/app-api-keys";

export default async function AppApiKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppApiKeys appId={id} />;
}
