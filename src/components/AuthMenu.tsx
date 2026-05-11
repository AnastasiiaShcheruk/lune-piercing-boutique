"use client";

import Link from "next/link";
import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearSession,
  createUserId,
  getFullName,
  getSession,
  getUsers,
  saveSession,
  saveUsers,
  toSession,
  type StoredUser
} from "../lib/authStorage";
import type { SessionUser } from "../lib/types";

type AuthRole = "user" | "admin";
type AuthView = "login" | "register";

type OpenAuthDetail = {
  role?: AuthRole;
  view?: AuthView;
  redirectTo?: string;
};

function clearGuestShopData() {
  window.localStorage.removeItem("lune-cart");
  window.localStorage.removeItem("lune-favorites");
  window.dispatchEvent(new Event("lune-cart-updated"));
  window.dispatchEvent(new Event("lune-favorites-updated"));
}

export default function AuthMenu() {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<AuthRole>("user");
  const [view, setView] = useState<AuthView>("login");
  const [message, setMessage] = useState("");
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);

  function openRequestedAuth(detail?: OpenAuthDetail) {
    const nextRole: AuthRole = detail?.role === "admin" ? "admin" : "user";
    const nextView: AuthView = nextRole === "admin" ? "login" : detail?.view || "login";
    const nextRedirect = detail?.redirectTo || null;
    const currentSession = getSession();

    if (currentSession && currentSession.role === nextRole && nextRedirect) {
      router.push(nextRedirect);
      return;
    }

    if (currentSession && currentSession.role !== nextRole) {
      clearSession();
      clearGuestShopData();
      setSession(null);
    }

    setRole(nextRole);
    setView(nextView);
    setRedirectAfterAuth(nextRedirect);
    setAuthOpen(true);
    setMenuOpen(false);
    setMessage("");
  }

  function finishAuth(currentSession: SessionUser) {
    const target = redirectAfterAuth;

    saveSession(currentSession);
    setSession(currentSession);
    setAuthOpen(false);
    setMessage("");
    setRedirectAfterAuth(null);

    if (target) {
      setMenuOpen(false);
      router.push(target);
      router.refresh();
      return;
    }

    setMenuOpen(true);
    router.refresh();
  }

  useEffect(() => {
    const update = () => setSession(getSession());

    getUsers();
    update();

    window.addEventListener("lune-auth-updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("lune-auth-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    function openAuthFromPage(event: Event) {
      const customEvent = event as CustomEvent<OpenAuthDetail>;
      openRequestedAuth(customEvent.detail || {});
    }

    window.addEventListener("lune-open-auth", openAuthFromPage);

    return () => {
      window.removeEventListener("lune-open-auth", openAuthFromPage);
    };
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    const redirectTo = params.get("redirect");

    if (auth === "user" || auth === "admin") {
      openRequestedAuth({
        role: auth,
        view: "login",
        redirectTo: redirectTo || undefined
      });

      params.delete("auth");
      params.delete("redirect");

      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;

      window.history.replaceState(null, "", nextUrl);
    }
  });

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (!shellRef.current || shellRef.current.contains(target)) return;

      setAuthOpen(false);
      setMenuOpen(false);
      setMessage("");
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setAuthOpen(false);
      setMenuOpen(false);
      setMessage("");
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function openAuth(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setAuthOpen((current) => !current);
    setMenuOpen(false);
    setRedirectAfterAuth(null);
    setMessage("");
  }

  function chooseRole(nextRole: AuthRole) {
    setRole(nextRole);
    setView("login");
    setMessage("");
  }

  function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();

    if (!email || !password) {
      setMessage("Заповни email та пароль");
      return;
    }

    const users = getUsers();

    if (view === "login") {
      const foundUser = users.find((user) => user.role === role && user.email.toLowerCase() === email && user.password === password);

      if (!foundUser) {
        setMessage("Невірний email або пароль");
        return;
      }

      finishAuth(toSession(foundUser));
      return;
    }

    if (role === "admin") {
      setMessage("Реєстрація адміністратора на сайті недоступна");
      return;
    }

    if (!firstName || !lastName) {
      setMessage("Введи ім’я та прізвище");
      return;
    }

    const exists = users.some((user) => user.role === "user" && user.email.toLowerCase() === email);

    if (exists) {
      setMessage("Користувач з таким email вже існує");
      return;
    }

    const newUser: StoredUser = {
      id: createUserId(),
      role: "user",
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
      photo: "/logo-pic.png",
      phone: "",
      city: "",
      address: "",
      createdAt: new Date().toISOString()
    };

    saveUsers([newUser, ...users]);
    finishAuth(toSession(newUser));
  }

  function logout() {
    clearSession();
    clearGuestShopData();
    setSession(null);
    setMenuOpen(false);
    setAuthOpen(false);
    setMessage("");
    setRedirectAfterAuth(null);
    router.push("/");
    router.refresh();
  }

  if (!session) {
    return (
      <div className="auth-shell" ref={shellRef}>
        <button type="button" className="auth-trigger" onClick={openAuth}>
          Кабінет
        </button>

        {authOpen && (
          <div className="auth-popover">
            <div className="auth-modal auth-modal-compact">
              <div className="auth-modal-head">
                <div>
                  <p className="eyebrow">LUNÉ account</p>
                  <h2>{role === "admin" ? "Вхід адміністратора" : view === "login" ? "Вхід" : "Реєстрація"}</h2>
                </div>
                <button type="button" className="auth-close" onClick={() => setAuthOpen(false)}>
                  ×
                </button>
              </div>

              <div className="auth-switch">
                <button type="button" className={role === "user" ? "active" : ""} onClick={() => chooseRole("user")}>
                  Користувач
                </button>
                <button type="button" className={role === "admin" ? "active" : ""} onClick={() => chooseRole("admin")}>
                  Адмін
                </button>
              </div>

              {role === "user" && (
                <div className="auth-switch auth-switch-small">
                  <button type="button" className={view === "login" ? "active" : ""} onClick={() => setView("login")}>
                    Авторизація
                  </button>
                  <button type="button" className={view === "register" ? "active" : ""} onClick={() => setView("register")}>
                    Реєстрація
                  </button>
                </div>
              )}

              <form key={`${role}-${view}`} className="auth-form" onSubmit={handleAuth}>
                {role === "user" && view === "register" && (
                  <div className="auth-form-grid">
                    <label>
                      Ім’я
                      <input name="firstName" required placeholder="Ім'я" />
                    </label>

                    <label>
                      Прізвище
                      <input name="lastName" required placeholder="Прізвище" />
                    </label>
                  </div>
                )}

                <label>
                  Email
                  <input name="email" type="email" required placeholder="lune@gmail.com"/>
                </label>

                <label>
                  Пароль
                  <input name="password" type="password" required placeholder="+380********"/>
                </label>

                <button className="btn btn-primary" type="submit">
                  {view === "login" || role === "admin" ? "Увійти" : "Створити акаунт"}
                </button>

                {message && <p className="auth-message">{message}</p>}
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-shell" ref={shellRef}>
      <button type="button" className="auth-user-button" onClick={() => setMenuOpen((current) => !current)}>
        <img src={session.photo || "/logo-pic.png"} alt={getFullName(session)} />
        <span>{getFullName(session)}</span>
      </button>

      {menuOpen && (
        <div className="auth-dropdown">
          <div className="auth-dropdown-head">
            <img src={session.photo || "/logo-pic.png"} alt={getFullName(session)} />
            <div>
              <strong>{getFullName(session)}</strong>
              <span>{session.email}</span>
            </div>
          </div>

          <div className="auth-mini-stars">✦ ✧ ✦</div>

          {session.role === "user" ? (
            <div className="auth-menu-list">
              <Link className="auth-menu-link" href="/profile" onClick={() => setMenuOpen(false)}>
                Профіль
              </Link>
              <Link className="auth-menu-link" href="/orders" onClick={() => setMenuOpen(false)}>
                Мої замовлення
              </Link>
              <button type="button" className="auth-menu-item danger" onClick={logout}>
                Вийти
              </button>
            </div>
          ) : (
            <div className="auth-menu-list">
              <Link className="auth-menu-link" href="/admin" onClick={() => setMenuOpen(false)}>
                Адмін панель
              </Link>
              <button type="button" className="auth-menu-item danger" onClick={logout}>
                Вийти
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}