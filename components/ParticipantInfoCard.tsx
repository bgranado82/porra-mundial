type Props = {
  title: string;
  nameLabel: string;
  emailLabel: string;
  companyLabel: string;
  countryLabel: string;
  name: string;
  email: string;
  company: string;
  country: string;
  onChangeName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeCompany: (value: string) => void;
  onChangeCountry: (value: string) => void;
};

export default function ParticipantInfoCard({
  title,
  nameLabel,
  emailLabel,
  companyLabel,
  countryLabel,
  name,
  email,
  company,
  country,
  onChangeName,
  onChangeEmail,
  onChangeCompany,
  onChangeCountry,
}: Props) {
  const inputClass = "w-full rounded-xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/30 px-4 py-3 text-sm font-medium placeholder:text-[var(--iberdrola-forest)]/35 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition";

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--iberdrola-forest)]/55">
        <span className="inline-block h-1 w-4 rounded-full bg-[var(--iberdrola-green)]" />
        {title}
      </h3>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/50">
            {nameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            className={inputClass}
            placeholder="Ej: Borja Fernández"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/50">
            {emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            className={inputClass}
            placeholder="Ej: borja@email.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/50">
            {companyLabel}
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => onChangeCompany(e.target.value)}
            className={inputClass}
            placeholder="Ej: Iberdrola"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/50">
            {countryLabel}
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => onChangeCountry(e.target.value)}
            className={inputClass}
            placeholder="Ej: España"
          />
        </div>
      </div>
    </div>
  );
}
