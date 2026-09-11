import { SSOTProvider } from "@/components/SSOTProvider";
import { ProjectChrome } from "@/components/ProjectChrome";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SSOTProvider id={id}>
      <ProjectChrome>{children}</ProjectChrome>
    </SSOTProvider>
  );
}
