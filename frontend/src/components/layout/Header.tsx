import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium transition-colors',
    isActive ? 'text-brand-600' : 'text-slate-700 hover:text-slate-900',
  );

export function Header() {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Закривати меню при зміні маршруту
  useEffect(() => setIsOpen(false), [location.pathname]);

  // Блокувати скрол body коли меню відкрите
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const navLinks = (
    <>
      <NavLink to="/events" className={navLinkClass}>
        Каталог
      </NavLink>
      <NavLink to="/map" className={navLinkClass}>
        Карта
      </NavLink>
      {hasRole('organizer', 'admin') && (
        <NavLink to="/dashboard" className={navLinkClass}>
          Кабінет
        </NavLink>
      )}
    </>
  );

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Zbir.ua">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">{navLinks}</nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {hasRole('organizer', 'admin') && (
                <Link to="/create">
                  <Button size="sm">+ Захід</Button>
                </Link>
              )}
              <Link
                to="/profile"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                {user?.name}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                Вийти
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Увійти
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Реєстрація</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100"
          aria-label="Меню"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100"
                aria-label="Закрити"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <NavLink to="/events" className="block py-2 text-base text-slate-800 hover:text-brand-600">
                Каталог
              </NavLink>
              <NavLink to="/map" className="block py-2 text-base text-slate-800 hover:text-brand-600">
                Карта
              </NavLink>
              {hasRole('organizer', 'admin') && (
                <>
                  <NavLink to="/dashboard" className="block py-2 text-base text-slate-800 hover:text-brand-600">
                    Кабінет організатора
                  </NavLink>
                  <NavLink to="/create" className="block py-2 text-base text-slate-800 hover:text-brand-600">
                    + Створити захід
                  </NavLink>
                </>
              )}
              {isAuthenticated && (
                <NavLink to="/profile" className="block py-2 text-base text-slate-800 hover:text-brand-600">
                  Мій профіль
                </NavLink>
              )}
            </nav>

            <div className="border-t border-slate-200 p-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-1 py-2">
                    <p className="text-xs text-slate-500">Ви увійшли як</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={() => void logout()}>
                    Вийти
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block">
                    <Button variant="secondary" className="w-full">Увійти</Button>
                  </Link>
                  <Link to="/register" className="block">
                    <Button className="w-full">Реєстрація</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
