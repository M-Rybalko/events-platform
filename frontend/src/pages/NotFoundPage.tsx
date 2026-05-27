import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <section className="container py-24 text-center">
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold">Сторінку не знайдено</h1>
      <p className="mt-2 text-slate-500">
        Можливо, ви помилились у посиланні або сторінка була видалена.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button>На головну</Button>
        </Link>
      </div>
    </section>
  );
}
