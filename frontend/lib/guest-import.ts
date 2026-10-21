import { strFromU8, unzipSync } from "fflate";
import type { Guest } from "./data";

export const MAX_EVENT_GUESTS = 500;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_XML_BYTES = 10 * 1024 * 1024;
const SPREADSHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELATIONSHIP_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export type ImportedGuest = Pick<Guest, "full_name" | "phone" | "email" | "category" | "notes">;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeGuestCategory(value?: string) {
  const text = normalizeHeader(String(value ?? "").trim());
  if (text === "vip") return "VIP";
  if (["couple", "double", "doublecouple"].includes(text)) return "Double/Couple";
  return "Single";
}

export function guestKey(guest: Pick<Guest, "full_name"> & { phone?: string }) {
  return `${guest.full_name.trim().toLowerCase()}::${String(guest.phone ?? "").trim()}`;
}

/** Remove duplicates before checking the event's remaining capacity; never truncate. */
export function prepareGuestImport(imported: ImportedGuest[], existing: Guest[]) {
  const keys = new Set(existing.map(guestKey));
  const guests = imported.filter((guest) => {
    const key = guestKey(guest);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
  const remaining = Math.max(0, MAX_EVENT_GUESTS - existing.length);
  if (guests.length > remaining) {
    throw new Error(`This event supports a maximum of ${MAX_EVENT_GUESTS} guests. It already has ${existing.length}; only ${remaining} spaces remain, but this file adds ${guests.length} new guests. Nothing was imported.`);
  }
  return { guests, skipped_count: imported.length - guests.length };
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("This CSV has an unclosed quoted field. Fix the file and try again.");
  row.push(cell.trim());
  rows.push(row);
  return rows;
}

function elements(node: Document | Element, name: string) {
  // Namespace-aware lookup supports both <row> and <x:row> in valid XLSX files.
  return Array.from(node.getElementsByTagNameNS(SPREADSHEET_NS, name));
}

function xmlText(node: Element) {
  return elements(node, "t").map((item) => item.textContent ?? "").join("");
}

function parseXml(xml: string, description: string) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagNameNS("*", "parsererror").length) {
    throw new Error(`The Excel ${description} is invalid. Save it as a new XLSX file and retry.`);
  }
  return doc;
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/i)?.[0].toUpperCase();
  if (!letters) return -1;
  const index = [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  if (index > 16383) throw new Error("The Excel worksheet contains an invalid cell reference.");
  return index;
}

const NAME_HEADERS = ["fullname", "name", "guestname", "guest", "jina", "jinalamgeni"];
const PHONE_HEADERS = ["phone", "phonenumber", "mobile", "mobilenumber", "telephone", "simu"];
const EMAIL_HEADERS = ["email", "emailaddress"];
const CATEGORY_HEADERS = ["category", "type", "group"];
const NOTES_HEADERS = ["notes", "note", "remarks"];
const ALL_HEADERS = [...NAME_HEADERS, ...PHONE_HEADERS, ...EMAIL_HEADERS, ...CATEGORY_HEADERS, ...NOTES_HEADERS];

function rowsToGuests(rows: string[][]) {
  const firstIndex = rows.findIndex((row) => row.some((cell) => cell?.trim()));
  if (firstIndex < 0) return [];
  const first = rows[firstIndex].map(normalizeHeader);
  const hasHeader = first.some((header) => ALL_HEADERS.includes(header));
  const headers = hasHeader ? first : ["fullname", "phone", "email", "category", "notes"];
  const findIndex = (names: string[]) => headers.findIndex((header) => names.includes(header));
  const nameIndex = findIndex(NAME_HEADERS);
  if (nameIndex < 0) throw new Error("Include a Full Name column in your guest file. Nothing was imported.");
  const phoneIndex = findIndex(PHONE_HEADERS);
  const emailIndex = findIndex(EMAIL_HEADERS);
  const categoryIndex = findIndex(CATEGORY_HEADERS);
  const notesIndex = findIndex(NOTES_HEADERS);
  const start = firstIndex + (hasHeader ? 1 : 0);
  const guests: ImportedGuest[] = [];
  for (let index = start; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row.some((cell) => cell?.trim())) continue;
    const value = (column: number) => column < 0 ? "" : String(row[column] ?? "").trim();
    const name = value(nameIndex);
    if (!name) throw new Error(`Row ${index + 1} has no guest name. Add a Full Name or remove the row. Nothing was imported.`);
    if (name.length > 200) throw new Error(`Row ${index + 1}: Full Name must be 200 characters or fewer.`);
    const phone = value(phoneIndex);
    if (phone.length > 30) throw new Error(`Row ${index + 1}: Phone must be 30 characters or fewer.`);
    guests.push({ full_name: name, phone, email: value(emailIndex), category: normalizeGuestCategory(value(categoryIndex)), notes: value(notesIndex) });
  }
  return guests;
}

function worksheetRows(xml: string, sharedStrings: string[]) {
  const sheet = parseXml(xml, "worksheet");
  return elements(sheet, "row").map((rowNode) => {
    const row: string[] = [];
    elements(rowNode, "c").forEach((cell, position) => {
      const reference = cell.getAttribute("r");
      const index = reference ? columnIndex(reference) : position;
      if (index < 0) return;
      const type = cell.getAttribute("t");
      const raw = elements(cell, "v")[0]?.textContent ?? "";
      if (type === "e") throw new Error(`Cell ${reference || ""} contains an Excel error. Correct it before importing.`);
      row[index] = type === "s" ? sharedStrings[Number(raw)] ?? "" : type === "inlineStr" ? xmlText(cell) : raw;
    });
    return row;
  });
}

function worksheetPaths(files: Record<string, Uint8Array>) {
  const workbook = files["xl/workbook.xml"];
  const relationships = files["xl/_rels/workbook.xml.rels"];
  if (!workbook || !relationships) throw new Error("This file is not a valid XLSX workbook.");
  const relations = Array.from(parseXml(strFromU8(relationships), "relationships").getElementsByTagNameNS("*", "Relationship"));
  const targets = new Map(relations.filter((node) => node.getAttribute("TargetMode") !== "External").map((node) => [node.getAttribute("Id"), node.getAttribute("Target") || ""]));
  return elements(parseXml(strFromU8(workbook), "workbook"), "sheet")
    .filter((node) => !["hidden", "veryHidden"].includes(node.getAttribute("state") || ""))
    .map((node) => {
      const target = targets.get(node.getAttributeNS(RELATIONSHIP_NS, "id")) || "";
      if (!target) return "";
      const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
      const normalized: string[] = [];
      for (const part of path.split("/")) {
        if (part === "..") normalized.pop(); else if (part && part !== ".") normalized.push(part);
      }
      return normalized.join("/");
    }).filter(Boolean);
}

async function parseXlsxRows(file: File) {
  let files: Record<string, Uint8Array>;
  let totalSize = 0;
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) => {
        const wanted = ["xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/sharedStrings.xml"].includes(entry.name) || /^xl\/worksheets\/[^/]+\.xml$/.test(entry.name);
        if (!wanted) return false;
        totalSize += entry.originalSize;
        if (totalSize > MAX_XML_BYTES) throw new Error("The Excel workbook is too large. Keep only your guest sheet and retry.");
        return true;
      },
    });
  } catch (failure) {
    if (failure instanceof Error && failure.message.includes("too large")) throw failure;
    throw new Error("Could not read this Excel file. Upload a valid .xlsx file, or export it as CSV and retry.");
  }
  const shared = files["xl/sharedStrings.xml"];
  const sharedStrings = shared ? elements(parseXml(strFromU8(shared), "shared strings"), "si").map(xmlText) : [];
  const sheets = worksheetPaths(files).filter((path) => files[path]).map((path) => worksheetRows(strFromU8(files[path]), sharedStrings));
  // Prefer a guest sheet over a cover/instructions sheet; worksheet names and order are retained.
  const withNameHeader = sheets.find((rows) => rows.some((row) => row.map(normalizeHeader).some((cell) => NAME_HEADERS.includes(cell))));
  const rows = withNameHeader ?? sheets.find((sheet) => sheet.some((row) => row.some(Boolean)));
  if (!rows) throw new Error("No guest worksheet was found in this Excel file.");
  return rows;
}

export async function parseGuestImportFile(file: File): Promise<ImportedGuest[]> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("Guest files must be 5 MB or smaller.");
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) throw new Error("Upload an XLSX or CSV guest file.");
  const rows = name.endsWith(".csv") ? parseCsvRows((await file.text()).replace(/^\uFEFF/, "")) : await parseXlsxRows(file);
  return rowsToGuests(rows);
}
