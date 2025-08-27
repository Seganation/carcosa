import { AppSettings } from "../../../../../components/dashboard/app-settings";

export default async function AppSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppSettings appId={id} />;
}
