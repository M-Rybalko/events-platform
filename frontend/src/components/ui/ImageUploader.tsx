import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatApiError } from '@/lib/error-messages';
import { cn } from '@/lib/cn';

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  /** Шлях ендпоінта (POST). За замовчуванням /api/uploads/image */
  endpoint?: string;
  /** Максимальний розмір у байтах, перевірка перед відправкою */
  maxBytes?: number;
  className?: string;
}

const DEFAULT_MAX = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export function ImageUploader({
  value,
  onChange,
  endpoint = '/api/uploads/image',
  maxBytes = DEFAULT_MAX,
  className,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Файл має бути зображенням');
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`Файл завеликий. Максимум ${Math.round(maxBytes / 1024 / 1024)} МБ`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.post<{ url: string }>(endpoint, formData);
      onChange(result.url);
      toast.success('Зображення завантажено');
    } catch (err) {
      toast.error(formatApiError(err, 'Не вдалося завантажити'));
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  if (value) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group">
          <img src={value} alt="Cover preview" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
            >
              {isUploading ? 'Завантаження…' : 'Замінити'}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Видалити
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center aspect-[16/9] cursor-pointer rounded-xl border-2 border-dashed transition-colors',
          isDragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-300 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        <div className="text-center p-6">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            {isUploading ? (
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium text-slate-700">
            {isUploading ? 'Завантажуємо…' : 'Перетягніть зображення або клацніть'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            JPEG, PNG, WebP або GIF · до {Math.round(maxBytes / 1024 / 1024)} МБ
          </p>
        </div>
      </label>
    </div>
  );
}
