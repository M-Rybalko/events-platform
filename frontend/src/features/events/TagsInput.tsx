import { useState, type KeyboardEvent } from 'react';
import { useTags } from './hooks';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

export function TagsInput({ value, onChange, max = 20 }: Props) {
  const [input, setInput] = useState('');
  const tagsQuery = useTags(input.length > 0 ? input : undefined);

  const addTag = (raw: string) => {
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;
    if (normalized.length < 2 || normalized.length > 100) return;
    if (value.includes(normalized)) return;
    if (value.length >= max) return;
    onChange([...value, normalized]);
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1] as string);
    }
  };

  const suggestions = tagsQuery.data?.items.filter(
    (s) => !value.includes(s.name) && s.name.includes(input.trim().toLowerCase()),
  ).slice(0, 6) ?? [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white p-2 min-h-[2.75rem] focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-brand-400">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-brand-600 hover:text-brand-900"
              aria-label={`Видалити ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addTag(input)}
          placeholder={value.length === 0 ? 'Додайте тег і натисніть Enter' : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm placeholder:text-slate-400"
          maxLength={100}
        />
      </div>

      {input && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-400">Пропозиції:</span>
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => addTag(s.name)}
              className="text-xs rounded-full border border-slate-200 px-2 py-0.5 text-slate-600 hover:border-brand-400 hover:text-brand-700"
            >
              #{s.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        {value.length}/{max} тегів. 2–100 символів, лише літери, цифри, дефіс і підкреслення.
      </p>
    </div>
  );
}
