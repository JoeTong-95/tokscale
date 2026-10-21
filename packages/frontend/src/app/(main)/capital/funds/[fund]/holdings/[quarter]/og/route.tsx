import { legacyCapitalRedirect } from "@/lib/capital/redirects";

/** Moved to /capital/investors/[slug]/13f/[quarter]/og. Old image links get a 308. */
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ fund: string; quarter: string }> }) {
  const { fund, quarter } = await params;
  const target = legacyCapitalRedirect(`/capital/funds/${fund}/holdings/${quarter}/og`);
  if (!target) return new Response("Not found", { status: 404 });
  return Response.redirect(new URL(target, request.url), 308);
}
