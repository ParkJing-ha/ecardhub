import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

type StoredUser = PublicUser & {
  passwordHash: string;
  salt: string;
};

type Session = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type Database = {
  users: StoredUser[];
  sessions: Session[];
};

const dbPath = path.join(process.cwd(), ".data", "auth-db.json");
const sessionDays = 7;

function emptyDb(): Database {
  return { users: [], sessions: [] };
}

async function readDb(): Promise<Database> {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyDb();
  }
}

async function writeDb(db: Database) {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const passwordHash = pbkdf2Sync(password, salt, 120000, 64, "sha512").toString(
    "hex",
  );
  return { salt, passwordHash };
}

function verifyPassword(password: string, user: StoredUser) {
  const attempted = hashPassword(password, user.salt).passwordHash;
  return timingSafeEqual(
    Buffer.from(attempted, "hex"),
    Buffer.from(user.passwordHash, "hex"),
  );
}

function validateCredentials(input: {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}) {
  if (input.name !== undefined && input.name.trim().length < 2) {
    return "Enter your full name.";
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Enter a valid email address.";
  }
  if (!input.password || input.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (input.confirm !== undefined && input.password !== input.confirm) {
    return "Passwords do not match.";
  }
  return "";
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirm: string;
}) {
  const validationError = validateCredentials(input);
  if (validationError) {
    return { error: validationError };
  }

  const db = await readDb();
  const email = normalizeEmail(input.email);
  if (db.users.some((user) => user.email === email)) {
    return { error: "An account with this email already exists." };
  }

  const password = hashPassword(input.password);
  const user: StoredUser = {
    id: randomBytes(12).toString("hex"),
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() ?? "",
    createdAt: new Date().toISOString(),
    ...password,
  };

  db.users.push(user);
  await writeDb(db);
  return { user: toPublicUser(user) };
}

export async function loginUser(input: { email: string; password: string }) {
  const validationError = validateCredentials(input);
  if (validationError) {
    return { error: validationError };
  }

  const db = await readDb();
  const email = normalizeEmail(input.email);
  const user = db.users.find((candidate) => candidate.email === email);
  if (!user || !verifyPassword(input.password, user)) {
    return { error: "Email or password is incorrect." };
  }

  return { user: toPublicUser(user) };
}

export async function createSession(userId: string) {
  const db = await readDb();
  const now = Date.now();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now + sessionDays * 24 * 60 * 60 * 1000);

  db.sessions = db.sessions.filter(
    (session) => new Date(session.expiresAt).getTime() > now,
  );
  db.sessions.push({
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  await writeDb(db);

  return { token, expiresAt };
}

export async function getUserBySession(token?: string) {
  if (!token) return null;

  const db = await readDb();
  const now = Date.now();
  const session = db.sessions.find(
    (candidate) =>
      candidate.token === token && new Date(candidate.expiresAt).getTime() > now,
  );
  if (!session) return null;

  const user = db.users.find((candidate) => candidate.id === session.userId);
  return user ? toPublicUser(user) : null;
}

export async function deleteSession(token?: string) {
  if (!token) return;
  const db = await readDb();
  db.sessions = db.sessions.filter((session) => session.token !== token);
  await writeDb(db);
}
