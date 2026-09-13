import type { Guest } from "./data";

export type ImportedGuest = Pick<
  Guest,
  "full_name" | "phone" | "email" | "category"
>;

const XLSX_REQUIRED_FILES = [
  "xl/sharedStrings.xml",
  "xl/worksheets/sheet1.xml",
];

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeGuestCategory(value?: string) {
  const text = String(value ?? "").trim().toLowerCase();

  if (text === "vip") return "VIP";
  if (text === "couple" || text === "double" || text === "doublecouple") {
    return "Double/Couple";
  }

  return "Single";
}

export function guestKey(guest: Pick<Guest, "full_name"> & { phone?: string }) {
  return `${guest.full_name.trim().toLowerCase()}::${String(
    guest.phone ?? "",
  ).trim()}`;
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function columnIndex(cellRef: string) {
  const letters = cellRef.replace(/[0-9]/g, "");

  return letters.split("").reduce((total, letter) => {
    return total * 26 + letter.charCodeAt(0) - 64;
  }, 0) - 1;
}

function xmlText(node: Element) {
  return Array.from(node.getElementsByTagName("t"))
    .map((item) => item.textContent ?? "")
    .join("");
}

async function inflateZipEntry(bytes: Uint8Array, method: number) {
  if (method === 0) return bytes;

  if (method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("This Excel file compression is not supported here.");
  }

  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const stream = new Blob([buffer]).stream().pipeThrough(
    new DecompressionStream("deflate-raw"),
  );
  const inflatedBuffer = await new Response(stream).arrayBuffer();

  return new Uint8Array(inflatedBuffer);
}

async function unzipSelectedFiles(buffer: ArrayBuffer, wanted: string[]) {
  const data = new Uint8Array(buffer);
  const files = new Map<string, string>();
  const decoder = new TextDecoder();
  let offset = 0;

  while (offset + 30 < data.length) {
    const view = new DataView(data.buffer, data.byteOffset + offset);
    const signature = view.getUint32(0, true);

    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const flags = view.getUint16(6, true);
    const method = view.getUint16(8, true);
    const compressedSize = view.getUint32(18, true);
    const fileNameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const fileName = decoder.decode(data.slice(nameStart, nameEnd));
    const bodyStart = nameEnd + extraLength;
    const bodyEnd = bodyStart + compressedSize;

    if (flags & 0x08) {
      throw new Error(
        "This Excel file uses a ZIP format that is not supported here. Please save it again from Excel or Google Sheets and retry.",
      );
    }

    if (wanted.includes(fileName)) {
      const inflated = await inflateZipEntry(data.slice(bodyStart, bodyEnd), method);
      files.set(fileName, decoder.decode(inflated));
    }

    offset = bodyEnd;

    if (wanted.every((file) => files.has(file))) break;
  }

  return files;
}

function rowsToGuests(rows: string[][]) {
  if (rows.length === 0) return [];

  const firstRow = rows[0].map(normalizeHeader);
  const hasHeader = firstRow.some((header) =>
    ["fullname", "name", "guestname", "phone", "phonenumber", "email"].includes(
      header,
    ),
  );
  const headers = hasHeader ? firstRow : ["fullname", "phone", "email", "category"];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const findIndex = (...names: string[]) =>
    headers.findIndex((header) => names.includes(header));

  const nameIndex = findIndex("fullname", "name", "guestname", "guest");
  const phoneIndex = findIndex("phone", "phonenumber", "mobile", "telephone");
  const emailIndex = findIndex("email", "emailaddress");
  const categoryIndex = findIndex("category", "type", "group");

  return dataRows
    .map((row) => ({
      full_name: String(row[nameIndex] ?? "").trim(),
      phone: phoneIndex >= 0 ? String(row[phoneIndex] ?? "").trim() : "",
      email: emailIndex >= 0 ? String(row[emailIndex] ?? "").trim() : "",
      category: normalizeGuestCategory(
        categoryIndex >= 0 ? String(row[categoryIndex] ?? "") : "",
      ),
    }))
    .filter((guest) => guest.full_name);
}

async function parseXlsxRows(file: File) {
  const files = await unzipSelectedFiles(
    await file.arrayBuffer(),
    XLSX_REQUIRED_FILES,
  );
  const sharedXml = files.get("xl/sharedStrings.xml") ?? "";
  const sheetXml = files.get("xl/worksheets/sheet1.xml");

  if (!sheetXml) {
    throw new Error("Could not find the first worksheet in this Excel file.");
  }

  const parser = new DOMParser();
  const sharedDoc = parser.parseFromString(sharedXml, "application/xml");
  const sharedStrings = Array.from(sharedDoc.getElementsByTagName("si")).map(
    xmlText,
  );
  const sheetDoc = parser.parseFromString(sheetXml, "application/xml");

  return Array.from(sheetDoc.getElementsByTagName("row")).map((rowNode) => {
    const row: string[] = [];

    Array.from(rowNode.getElementsByTagName("c")).forEach((cellNode) => {
      const index = columnIndex(cellNode.getAttribute("r") ?? "A");
      const type = cellNode.getAttribute("t");
      const rawValue = cellNode.getElementsByTagName("v")[0]?.textContent ?? "";

      if (type === "s") {
        row[index] = sharedStrings[Number(rawValue)] ?? "";
      } else if (type === "inlineStr") {
        row[index] = xmlText(cellNode);
      } else {
        row[index] = rawValue;
      }
    });

    return row;
  });
}

export async function parseGuestImportFile(
  file: File,
): Promise<ImportedGuest[]> {
  const rows = file.name.toLowerCase().endsWith(".csv")
    ? parseCsvRows(await file.text())
    : await parseXlsxRows(file);

  return rowsToGuests(rows);
}
