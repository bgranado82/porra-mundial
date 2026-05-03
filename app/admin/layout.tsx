export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--iberdrola-green-light)", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
