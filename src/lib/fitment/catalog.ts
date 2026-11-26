import data from "../../data/fitment/snowmobile-catalog.json";
import type { Catalog } from "./types";

/** The current snowmobile fitment catalog. Listings store its version so later edits don't rewrite them. */
export const snowmobileCatalog = data as unknown as Catalog;
