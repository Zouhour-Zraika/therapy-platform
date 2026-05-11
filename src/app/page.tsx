export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-6">
        <h1 className="text-2xl font-bold">TheraCare</h1>

        <div className="flex gap-6 text-sm font-medium">
          <button>Accueil</button>
          <button>Therapists</button>
          <button>About</button>
          <button>Contact</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 text-center">
        <div className="max-w-4xl">
          <h1 className="mb-6 text-6xl font-bold leading-tight text-slate-900">
            Your Mental Health Journey Starts Here
          </h1>

          <p className="mb-10 text-xl text-slate-600">
            Réservez des séances avec des thérapeutes qualifiés
            directement en ligne via une plateforme sécurisée et moderne.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button className="rounded-2xl bg-black px-8 py-4 text-white text-lg font-medium">
              Trouver un thérapeute
            </button>

            <button className="rounded-2xl border border-black px-8 py-4 text-lg font-medium">
              En savoir plus
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-2xl font-bold">
              Sessions Vidéo
            </h3>

            <p className="text-slate-600">
              Consultez votre thérapeute directement en ligne.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-2xl font-bold">
              Paiement Sécurisé
            </h3>

            <p className="text-slate-600">
              Réservez et payez vos séances facilement.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-2xl font-bold">
              Suivi Thérapeutique
            </h3>

            <p className="text-slate-600">
              Homework, notes et historique des sessions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}