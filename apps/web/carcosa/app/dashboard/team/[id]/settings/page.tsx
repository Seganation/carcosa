import { TeamSettings } from "../../../../../components/dashboard/team-settings";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamSettings teamId={id} />;
}
