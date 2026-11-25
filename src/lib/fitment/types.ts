/**
 * Snowmobile fitment catalog: what each year / make / model / trim / package
 * could have come with. The catalog is data, not code, so it can be corrected
 * and versioned without touching the form.
 */

/** Where a piece of equipment came from. */
export type Origin =
  | "factory_standard"
  | "factory_option"
  | "factory_package"
  | "dealer_accessory"
  | "aftermarket"
  | "unknown";

/** How much we trust a catalog fact or a listing entry. */
export type Confidence =
  | "verified_manufacturer_source"
  | "verified_dealer_catalog"
  | "verified_spec_database"
  | "admin_verified"
  | "seller_reported"
  | "seed_unverified"
  | "unknown";

export const VERIFIED: Confidence[] = ["verified_manufacturer_source", "verified_dealer_catalog", "verified_spec_database", "admin_verified"];

export interface Manufacturer {
  key: string;
  label: string;
}

export interface FeatureValue {
  value: string;
  label: string;
}

export interface FeatureDef {
  key: string;
  label: string;
  /** Shown under the field. */
  help?: string;
  values: FeatureValue[];
  /** Offer "Aftermarket / added later" inside this factory field (e.g. a display swapped later). */
  aftermarketChoice?: string;
}

/** One exact model/trim, with the years it was sold and its packages (usually track lengths). */
export interface TrimRecord {
  id: string;
  manufacturer: string;
  family: string;
  familyLabel: string;
  trim: string;
  trimLabel: string;
  years: number[];
  engine: string;
  packages: { key: string; label: string; years?: number[] }[];
  market: string[];
  source: string;
  status: Confidence;
}

/** Which selections a rule applies to. Every key given must match. */
export interface Conditions {
  years?: number[];
  yearRange?: [number, number];
  manufacturer?: string[];
  family?: string[];
  trim?: string[];
  package?: string[];
  market?: string[];
}

export interface Rule {
  id: string;
  feature: string;
  when: Conditions;
  /** Values this rule makes available, with where they come from. */
  allow?: { value: string; origin: Exclude<Origin, "aftermarket" | "unknown"> }[];
  /** Values this rule removes. Beats any allow rule that is less specific. */
  exclude?: string[];
  source: string;
  status: Confidence;
  note?: string;
}

export interface Source {
  id: string;
  label: string;
  url?: string;
  status: Confidence;
  note?: string;
}

export interface Catalog {
  version: string;
  market: string;
  note: string;
  manufacturers: Manufacturer[];
  features: FeatureDef[];
  trims: TrimRecord[];
  rules: Rule[];
  aftermarket: FeatureValue[];
  sources: Source[];
}

/** What the seller has picked so far. "unknown" is allowed for trim, package and feature values. */
export interface Selection {
  year?: number;
  manufacturer?: string;
  family?: string;
  trim?: string;
  package?: string;
  market?: string;
}

export const UNKNOWN = "unknown";
export const AFTERMARKET = "__aftermarket";

/** One equipment line as stored on a listing. */
export interface EquipmentEntry {
  feature: string;
  value: string;
  origin: Origin;
  catalog_status: Confidence;
  source_reference?: string;
}
