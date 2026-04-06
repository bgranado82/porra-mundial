import { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label: string;
};

export default function LanguageSwitcher({
  locale,
  onChange,
  label,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-[var(--iberdrola-forest)]">
        {label}
      </span>

      <div className="flex overflow-hidden rounded-full border border-[var(--iberdrola-green)] bg-white">
        {(["es", "en", "pt"] as Locale[]).map((item) => {
          const active = locale === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={`px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--iberdrola-green)] text-white"
                  : "text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]"
              }`}
            >
              {item.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}