"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { hasDb, prisma } from "@/lib/db";
import { snowmobileCatalog } from "@/lib/fitment/catalog";
import { validateConfig, type ListingConfigInput, type ValidationError } from "@/lib/fitment/engine";

export interface ListingFormState {
  errors: ValidationError[];
}

const GRADES = ["New", "Excellent", "Very good", "Good", "Fair"];
const RECORDS = ["full", "partial", "none"];
const STATUSES = ["active", "pending", "sold", "expired"] as const;
const POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

/** Re-checks the whole configuration against the catalog on the server. The form's filtering is a convenience, not the gate. */
export async function createSnowmobileListing(_prev: ListingFormState, fd: FormData): Promise<ListingFormState> {
  await requireAdmin();
  if (!hasDb) return { errors: [{ field: "form", message: "Connect a database first (see the admin overview)." }] };

  let config: ListingConfigInput;
  try {
    config = JSON.parse(String(fd.get("config") ?? ""));
  } catch {
    return { errors: [{ field: "form", message: "The form data was incomplete. Reload the page and try again." }] };
  }
  const result = validateConfig(snowmobileCatalog, {
    selection: config.selection ?? {},
    factory: config.factory ?? {},
    factoryAftermarket: config.factoryAftermarket ?? {},
    aftermarket: Array.isArray(config.aftermarket) ? config.aftermarket : [],
  });
  const errors = [...result.errors];

  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const n = (k: string) => (s(k) === "" ? NaN : Number(s(k)));
  const price = n("price");
  const km = n("km");
  const owners = n("owners");
  if (!Number.isInteger(price) || price <= 0) errors.push({ field: "price", message: "Enter the asking price in dollars." });
  if (!Number.isInteger(km) || km < 0) errors.push({ field: "km", message: "Enter the kilometres (0 for new)." });
  if (!Number.isInteger(owners) || owners < 0 || owners > 20) errors.push({ field: "owners", message: "Enter the number of previous owners (0 for new)." });
  if (!GRADES.includes(s("grade"))) errors.push({ field: "grade", message: "Choose the condition." });
  if (!RECORDS.includes(s("serviceRecords"))) errors.push({ field: "serviceRecords", message: "Choose the service records." });
  if (!s("dealer")) errors.push({ field: "dealer", message: "Enter the dealership name." });
  if (!POSTAL.test(s("postalCode"))) errors.push({ field: "postalCode", message: "Enter a Canadian postal code, e.g. T2P 1J9." });
  const vin = s("vin").toUpperCase();
  if (vin && !/^[A-HJ-NPR-Z0-9]{8,17}$/.test(vin)) errors.push({ field: "vin", message: "VIN or serial: 8–17 letters and numbers (no I, O or Q)." });
  const status = STATUSES.find((x) => x === s("status")) ?? "active";

  if (errors.length) return { errors };

  const sel = result.selection;
  const pc = s("postalCode").toUpperCase().replace(/\s+/g, "");
  const row = await prisma.snowmobileListing.create({
    data: {
      catalogVersion: result.catalogVersion,
      year: sel.year!,
      manufacturer: sel.manufacturer!,
      family: sel.family ?? null,
      trim: sel.trim ?? null,
      package: sel.package ?? null,
      title: result.identity.title,
      verification: result.verification,
      identity: result.identity,
      equipment: result.equipment as object[],
      aftermarket: result.aftermarket as object[],
      vin: vin || null,
      price,
      priceType: s("priceType") === "fixed" ? "fixed" : "negotiable",
      km,
      grade: s("grade"),
      titleStatus: s("titleStatus") === "Rebuilt" ? "Rebuilt" : "Clean",
      owners,
      serviceRecords: s("serviceRecords"),
      colour: s("colour"),
      financing: fd.get("financing") === "on",
      delivery: fd.get("delivery") === "on",
      dealer: s("dealer"),
      postalCode: `${pc.slice(0, 3)} ${pc.slice(3)}`,
      notes: s("notes"),
      status,
    },
  });
  redirect(`/admin/listings/${row.id}?created=1`);
}

export async function setListingStatus(fd: FormData) {
  await requireAdmin();
  const status = STATUSES.find((x) => x === String(fd.get("status")));
  const id = String(fd.get("id") ?? "");
  if (status && id) await prisma.snowmobileListing.update({ where: { id }, data: { status } });
  redirect(`/admin/listings/${id}`);
}

export async function deleteListing(fd: FormData) {
  await requireAdmin();
  await prisma.snowmobileListing.delete({ where: { id: String(fd.get("id") ?? "") } });
  redirect("/admin/listings?deleted=1");
}
