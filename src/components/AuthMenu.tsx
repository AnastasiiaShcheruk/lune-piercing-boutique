"use client";

import Link from "next/link";
import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearSession,
  getFullName,
  getSession,
  getUsers,
  saveSession,
  toSession
} from "../lib/authStorage";
import type { SessionUser } from "../lib/types";

type AuthRole = "user" | "admin";
type AuthView = "login" | "register";

type OpenAuthDetail = {
  role?: AuthRole;
  view?: AuthView;
  redirectTo?: string;
};

type AuthResponse = {
  user?: SessionUser;
  error?: string;
};

function clearGuestShopData() {
  window.localStorage.removeItem("lune-cart");
  window.localStorage.removeItem("lune-favorites");
  window.dispatchEvent(new Event("lune-cart-updated"));
  window.dispatchEvent(new Event("lune-favorites-updated"));
}

export default function AuthMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<AuthRole>("user");
  const [view, setView] = useState<AuthView>("login");
  const [message, setMessage] = useState("");
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const isAccountPage =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin");

  const isProfilePage = pathname.startsWith("/profile");
  const isOrdersPage = pathname.startsWith("/orders");
  const isAdminPage = pathname.startsWith("/admin");

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

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
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

    if (role === "admin") {
      const users = getUsers();
      const foundAdmin = users.find((user) => user.role === "admin" && user.email.toLowerCase() === email && user.password === password);

      if (!foundAdmin) {
        setMessage("Невірний email або пароль");
        return;
      }

      finishAuth(toSession(foundAdmin));
      return;
    }

    if (view === "register" && (!firstName || !lastName)) {
      setMessage("Введи ім’я та прізвище");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(view === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password
        })
      });

      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.user) {
        setMessage(data.error || "Помилка авторизації");
        setAuthLoading(false);
        return;
      }

      finishAuth(data.user);
    } catch {
      setMessage("Не вдалося з’єднатися з сервером");
    }

    setAuthLoading(false);
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
        <button type="button" className={isAccountPage ? "auth-trigger active" : "auth-trigger"} onClick={openAuth}>
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
                  <input name="email" type="email" required placeholder="lune@gmail.com" />
                </label>

                <label>
                  Пароль
                  <input name="password" type="password" required placeholder="пароль" />
                </label>

                <button className="btn btn-primary" type="submit" disabled={authLoading}>
                  {authLoading ? "Зачекай..." : view === "login" || role === "admin" ? "Увійти" : "Створити акаунт"}
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
      <button
        type="button"
        className={isAccountPage ? "auth-user-button active" : "auth-user-button"}
        onClick={() => setMenuOpen((current) => !current)}
      >
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
              <Link className={isProfilePage ? "auth-menu-link active" : "auth-menu-link"} href="/profile" onClick={() => setMenuOpen(false)}>
                Профіль
              </Link>

              <Link className={isOrdersPage ? "auth-menu-link active" : "auth-menu-link"} href="/orders" onClick={() => setMenuOpen(false)}>
                Мої замовлення
              </Link>

              <button type="button" className="auth-menu-item danger" onClick={logout}>
                Вийти
              </button>
            </div>
          ) : (
            <div className="auth-menu-list">
              <Link className={isAdminPage ? "auth-menu-link active" : "auth-menu-link"} href="/admin" onClick={() => setMenuOpen(false)}>
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