import { config } from "@/lib/config";
import { PublicMenuClient } from "./PublicMenuClient";

type PublicMenuResponse = any;

const buildPublicMenuUrl = (params: { business_id?: string; slug?: string }) => {
  const base = config.api.baseUrl.endsWith("/") ? config.api.baseUrl : `${config.api.baseUrl}/`;
  const query = new URLSearchParams();
  if (params.business_id) query.set("business_id", params.business_id);
  if (params.slug) query.set("slug", params.slug);
  return `${base}public/menu?${query.toString()}`;
};

async function fetchPublicMenu(args: { business_id?: string; slug?: string }): Promise<PublicMenuResponse | null> {
  try {
    const resp = await fetch(buildPublicMenuUrl(args), {
      method: "GET",
      // Público: no auth. Cache desactivado por ahora.
      cache: "no-store",
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export default async function PublicMenuPage({
  params,
}: {
  params: { slug: string };
}) {
  const slugOrId = params.slug;
  const businessIdFromParam = /^\d+$/.test(slugOrId) ? slugOrId : undefined;

  return (
    <PublicMenuClient
      slug={slugOrId}
      businessId={businessIdFromParam}
      apiBaseUrl={config.api.baseUrl}
    />
  );
}

