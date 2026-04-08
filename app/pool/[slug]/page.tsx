export default function PoolPage({ params }: { params: { slug: string } }) {
  return (
    <main style={{ padding: 40 }}>
      <h1>Porra: {params.slug}</h1>
      <p>Aquí irá la entrada del participante y luego sus predicciones.</p>
    </main>
  );
}