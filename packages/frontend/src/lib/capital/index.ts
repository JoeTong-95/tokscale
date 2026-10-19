/**
 * Capital research section: tracked managers' 13F holdings.
 *
 * Content lives in src/content/capital (JSON, validated with zod at load).
 * Pages import only from "@/lib/capital".
 */
export { capital, createCapitalModel, getFeaturedCapital } from "./model";
export type {
  CapitalModel,
  ChangeKind,
  CompanyView,
  ExitView,
  FeaturedCapitalItem,
  FundView,
  HoldingChange,
  HoldingView,
  QuarterRef,
  QuarterView,
} from "./model";
export * from "./format";
export * from "./urls";
export { sectorForSic, readableSicDescription } from "./sectors";
export type { StoryRecord, StoryClaim, PublishedFundRecord, FundRecord } from "./schema";
