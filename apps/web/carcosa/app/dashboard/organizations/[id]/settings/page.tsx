import { OrganizationSettings } from "../../../../../components/dashboard/organization-settings";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationSettings organizationId={id} />;
}
