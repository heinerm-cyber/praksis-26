export default function OfflinePage(): JSX.Element {
  return (
    <main style={{ maxWidth: "680px", margin: "3rem auto", padding: "0 1rem" }}>
      <section
        style={{
          background: "#ffffffd9",
          border: "1px solid #1b263b24",
          borderRadius: "16px",
          padding: "1.2rem"
        }}
      >
        <h1 style={{ marginTop: 0 }}>Du er offline</h1>
        <p>
          Det ser ut som at du ikke har nett akkurat nå. Sjekk forbindelsen og prøv igjen.
        </p>
      </section>
    </main>
  );
}