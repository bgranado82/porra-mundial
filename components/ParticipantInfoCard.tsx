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
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4">
      
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* Nombre */}
        <div className="xl:col-span-2">
          <label className="mb-1 block text-sm text-[var(--iberdrola-forest)]">
            {nameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            className="w-full rounded-lg border border-[var(--iberdrola-sky)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            placeholder="Ej: Borja Fernández"
          />
        </div>

        {/* Email */}
        <div className="xl:col-span-2">
          <label className="mb-1 block text-sm text-[var(--iberdrola-forest)]">
            {emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--iberdrola-sky)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            placeholder="Ej: borja@email.com"
          />
        </div>

        {/* Empresa */}
        <div>
          <label className="mb-1 block text-sm text-[var(--iberdrola-forest)]">
            {companyLabel}
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => onChangeCompany(e.target.value)}
            className="w-full rounded-lg border border-[var(--iberdrola-sky)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            placeholder="Ej: Iberdrola"
          />
        </div>

        {/* País */}
        <div>
          <label className="mb-1 block text-sm text-[var(--iberdrola-forest)]">
            {countryLabel}
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => onChangeCountry(e.target.value)}
            className="w-full rounded-lg border border-[var(--iberdrola-sky)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            placeholder="Ej: España"
          />
        </div>

      </div>
    </div>
  );
}