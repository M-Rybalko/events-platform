import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelative } from '@/lib/format';
import { formatApiError } from '@/lib/error-messages';
import {
  useCreateComment,
  useDeleteComment,
  useEventComments,
  useEventRating,
} from './hooks';
import { RatingStars } from './RatingStars';

interface Props {
  eventId: string;
}

export function CommentsSection({ eventId }: Props) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);

  const comments = useEventComments(eventId);
  const ratingSummary = useEventRating(eventId);
  const createComment = useCreateComment(eventId);
  const deleteComment = useDeleteComment(eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await createComment.mutateAsync({
        text: text.trim(),
        rating: rating > 0 ? rating : undefined,
      });
      setText('');
      setRating(0);
      toast.success('Коментар додано');
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment.mutateAsync(id);
      toast.success('Коментар видалено');
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const summary = ratingSummary.data;

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Відгуки</h2>
        {summary && summary.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <RatingStars value={summary.average ?? 0} size="sm" />
            <span className="font-medium text-slate-900">{summary.average?.toFixed(1)}</span>
            <span>· {summary.count}</span>
          </div>
        )}
      </header>

      {isAuthenticated && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Поділіться враженнями…"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Ваша оцінка:</span>
                  <RatingStars value={rating} onChange={setRating} interactive />
                  {rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setRating(0)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      скинути
                    </button>
                  )}
                </div>
                <Button type="submit" size="sm" disabled={!text.trim() || createComment.isPending}>
                  Опублікувати
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {!isAuthenticated && (
        <Card>
          <CardBody className="text-center text-sm text-slate-500">
            Увійдіть, щоб залишити відгук
          </CardBody>
        </Card>
      )}

      {comments.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {comments.data && comments.data.items.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Поки що немає відгуків. Будьте першим!
        </p>
      )}

      <ul className="space-y-3">
        {comments.data?.items.map((c) => {
          const canDelete = user && (user.id === c.author.id || hasRole('admin'));
          return (
            <li key={c.id}>
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                        {c.author.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{c.author.name}</p>
                        <p className="text-xs text-slate-400">{formatRelative(c.createdAt)}</p>
                      </div>
                    </div>
                    {c.rating !== null && <RatingStars value={c.rating} size="sm" />}
                  </div>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{c.text}</p>
                  {canDelete && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(c.id)}
                        className="text-xs text-slate-400 hover:text-red-600"
                      >
                        Видалити
                      </button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
