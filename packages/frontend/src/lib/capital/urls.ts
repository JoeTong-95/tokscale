import { getPublicOrigin } from "@/lib/seo/urls";

/** Path builders for the capital section. Absolute variants share the site's canonical origin. */
export const capitalPath = () => "/capital";
export const portfoliosPath = (view?: "table") => (view ? `/capital/portfolios?view=${view}` : "/capital/portfolios");
export const fundPath = (fund: string) => `/capital/funds/${encodeURIComponent(fund)}`;
export const quarterPath = (fund: string, quarter: string) =>
  `${fundPath(fund)}/holdings/${encodeURIComponent(quarter)}`;
export const companyPath = (slug: string) => `/companies/${encodeURIComponent(slug)}`;
/** 1200x630 Open Graph card for a quarter page (route handler next to the page). */
export const quarterOgImagePath = (fund: string, quarter: string) => `${quarterPath(fund, quarter)}/og`;

export const absoluteUrl = (path: string) => `${getPublicOrigin()}${path}`;
export const capitalUrl = () => absoluteUrl(capitalPath());
export const portfoliosUrl = () => absoluteUrl(portfoliosPath());
export const fundUrl = (fund: string) => absoluteUrl(fundPath(fund));
export const quarterUrl = (fund: string, quarter: string) => absoluteUrl(quarterPath(fund, quarter));
export const companyUrl = (slug: string) => absoluteUrl(companyPath(slug));

/** SEC EDGAR company page for a CIK. */
export const edgarCompanyUrl = (cik: string) =>
  `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=13F&dateb=&owner=include&count=40`;
