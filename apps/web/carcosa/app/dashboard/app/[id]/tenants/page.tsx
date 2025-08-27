import { AppTenants } from "@/components/dashboard/app-tenants";

interface AppTenantsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AppTenantsPage({ params }: AppTenantsPageProps) {
  const { id } = await params;
  return <AppTenants projectId={id} projectSlug="" />;
}
