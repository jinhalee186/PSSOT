"use client";

import { useParams } from "next/navigation";
import { renderSection } from "@/components/views";
import { useSSOT } from "@/components/SSOTProvider";

export default function SectionPage() {
  const params = useParams<{ section: string }>();
  const { ssot } = useSSOT();
  return renderSection(params.section, ssot);
}
