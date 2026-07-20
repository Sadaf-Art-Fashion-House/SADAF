export default function HomePage() {
    return (
        <main className="min-h-screen bg-zinc-950 px-6 py-24 text-zinc-50">
            <section className="mx-auto flex max-w-6xl flex-col gap-8">
                <div className="space-y-4">
                    <p className="text-sm uppercase tracking-[0.35em] text-zinc-400">
                        SADAF Platform Architecture
                    </p>
                    <h1 className="text-4xl font-semibold sm:text-6xl">
                        A future-ready foundation for luxury AI commerce.
                    </h1>
                    <p className="max-w-3xl text-lg text-zinc-300">
                        The frontend structure is now organized around feature-based modules,
                        shared primitives, and scalable route groups for auth, customer,
                        founder, admin, and marketing experiences.
                    </p>
                </div>
            </section>
        </main>
    );
}
