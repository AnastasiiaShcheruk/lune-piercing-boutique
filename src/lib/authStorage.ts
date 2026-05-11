import type { SessionUser } from "@/lib/types";

export type StoredUser = SessionUser & {
  password: string;
};

const USERS_KEY = "lune-auth-users";
const SESSION_KEY = "lune-auth-session";

export const defaultAdmin: StoredUser = {
  id: "lune-admin",
  role: "admin",
  firstName: "Адміністратор",
  lastName: "LUNÉ",
  name: "Адміністратор LUNÉ",
  email: "admin@lune.ua",
  password: "adminNa55",
  photo: "/logo-pic.png",
  phone: "",
  city: "",
  address: "",
  createdAt: new Date().toISOString()
};

export const demoUser: StoredUser = {
  id: "lune-demo-user",
  role: "user",
  firstName: "Анастасія",
  lastName: "Щерук",
  name: "Анастасія Щерук",
  email: "nastay.sheruk05@gmail.com",
  password: "183249700Na",
  photo: "/logo-pic.png",
  phone: "+380688252737",
  city: "Миколаїв",
  address: "",
  createdAt: new Date().toISOString()
};

export function createUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function getFullName(user: Pick<SessionUser, "firstName" | "lastName"> & { name?: string }) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return fullName || user.name || "Користувач LUNÉ";
}

function splitName(user: Partial<SessionUser>) {
  const oldName = String(user.name || "").trim();
  const parts = oldName.split(" ").filter(Boolean);
  const firstName = String(user.firstName || parts[0] || "").trim();
  const lastName = String(user.lastName || parts.slice(1).join(" ") || "").trim();

  return { firstName, lastName };
}

export function normalizePhoto(photo: string) {
  return photo.trim() || "/logo-pic.png";
}

export function normalizeSession(user: Partial<SessionUser> | null) {
  if (!user) return null;

  const names = splitName(user);
  const role = user.role === "admin" ? "admin" : "user";

  const session: SessionUser = {
    id: String(user.id || createUserId()),
    role,
    firstName: names.firstName || (role === "admin" ? "Адміністратор" : "Користувач"),
    lastName: names.lastName || (role === "admin" ? "LUNÉ" : ""),
    name: "",
    email: String(user.email || "").trim().toLowerCase(),
    photo: normalizePhoto(String(user.photo || "")),
    phone: String(user.phone || "").trim(),
    city: String(user.city || "").trim(),
    address: String(user.address || "").trim(),
    createdAt: String(user.createdAt || new Date().toISOString())
  };

  session.name = getFullName(session);

  return session;
}

export function normalizeStoredUser(user: Partial<StoredUser> | null) {
  if (!user) return null;

  const session = normalizeSession(user);
  if (!session) return null;

  const stored: StoredUser = {
    ...session,
    password: String(user.password || "")
  };

  return stored;
}

export function getUsers() {
  const defaultUsers = [defaultAdmin, demoUser];

  if (typeof window === "undefined") return defaultUsers;

  const raw = window.localStorage.getItem(USERS_KEY);
  let users: StoredUser[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<StoredUser>[];
      users = parsed.map((user) => normalizeStoredUser(user)).filter(Boolean) as StoredUser[];
    } catch {
      users = [];
    }
  }

  defaultUsers.forEach((defaultUser) => {
    const exists = users.some((user) => user.id === defaultUser.id || user.email === defaultUser.email);

    if (!exists) {
      users = [defaultUser, ...users];
    }
  });

  saveUsers(users);

  return users;
}

export function saveUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function toSession(user: StoredUser) {
  const session = normalizeSession(user);
  if (!session) throw new Error("Invalid user session");
  return session;
}

export function setAuthCookie(user: SessionUser) {
  if (typeof document === "undefined") return;
  document.cookie = `lune-auth-role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = `lune-auth-id=${encodeURIComponent(user.id)}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "lune-auth-role=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "lune-auth-id=; path=/; max-age=0; SameSite=Lax";
}

export function getSession() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return normalizeSession(JSON.parse(raw) as Partial<SessionUser>);
  } catch {
    return null;
  }
}

export function saveSession(user: SessionUser) {
  if (typeof window === "undefined") return;

  const session = normalizeSession(user);
  if (!session) return;

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setAuthCookie(session);
  window.dispatchEvent(new Event("lune-auth-updated"));
}

export function clearSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_KEY);
  clearAuthCookies();
  window.dispatchEvent(new Event("lune-auth-updated"));
}

export function updateStoredUser(user: SessionUser) {
  const session = normalizeSession(user);
  if (!session) return;

  const users = getUsers().map((storedUser) => {
    if (storedUser.id !== session.id) return storedUser;

    return {
      ...storedUser,
      ...session,
      password: storedUser.password
    };
  });

  saveUsers(users);
  saveSession(session);
}