import React from "react";
import { PublicPageRenderer } from "@/components/builder/PublicPageRenderer";
import { UniERPClient } from "@unerp/sdk";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const sdk = new UniERPClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

/**
 * Loads the published page + theme settings for the system tenant. Returns
 * null for anything that should 404, including an unreachable/unconfigured
 * database — a public page that can't be looked up is indistinguishable from
 * one that doesn't exist, and must never surface as a 500.
 */
async function loadPublicPage(slug: string) {
  try {
    const res = await sdk.public.getPage(slug);
    if (!res.success || !res.data) return null;
    return res.data;
  } catch (err) {
    console.error(
      "[public-page] lookup failed, serving 404 for slug",
      slug,
      err,
    );
    return null;
  }
}

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Asset-like paths (favicon.ico, robots.txt, source maps…) can never be CMS
  // page slugs — reject them before spending database queries on them.
  if (slug.includes(".")) return notFound();

  const data = await loadPublicPage(slug);
  if (!data) return notFound();

  return <PublicPageRenderer page={data.page} settings={data.settings} />;
}
