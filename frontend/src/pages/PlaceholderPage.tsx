interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="container py-16 text-center">
      <h1 className="text-3xl font-bold">{title}</h1>
      {description && <p className="mt-3 text-slate-500">{description}</p>}
      <p className="mt-6 text-sm text-slate-400">
        Цю сторінку буде реалізовано на наступних етапах.
      </p>
    </section>
  );
}
