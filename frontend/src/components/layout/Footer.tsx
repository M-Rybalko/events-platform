import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LogoMark size={24} />
              <span className="font-semibold text-slate-900">
                Zbir<span className="text-brand-500">.ua</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Платформа для організації суспільних заходів та об'єднання громад.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Платформа
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/events" className="text-slate-600 hover:text-brand-600">
                  Каталог
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-slate-600 hover:text-brand-600">
                  Карта
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-600 hover:text-brand-600">
                  Стати організатором
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Дані карти
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Тайли —{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline"
              >
                OpenStreetMap
              </a>{' '}
              · україномовний рендеринг від OSM Ukraine.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
