import { permanentRedirect } from "next/navigation";
import { legacyCapitalRedirect } from "@/lib/capital/redirects";

/** Moved: 13F managers are listed in the investors directory. Old links get a 308. */
export const dynamic = "force-dynamic";

export default function LegacyPortfoliosPage() {
  permanentRedirect(legacyCapitalRedirect("/capital/portfolios")!);
}
