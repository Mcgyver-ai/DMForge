export const metadata = {
  title: 'About — DMForge',
  description: 'DMForge is an AI-powered campaign and NPC generator built for tabletop RPG Dungeon Masters.',
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">About DMForge</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">What is DMForge?</h2>
        <p className="text-lg leading-relaxed mb-4">
          DMForge is an AI-powered toolset for Dungeon Masters and tabletop RPG players.
          It generates campaigns, NPCs, locations, and story hooks — giving you a creative
          co-pilot that handles the prep work so you can focus on the game.
        </p>
        <p className="text-lg leading-relaxed">
          Whether you're running a one-shot or a year-long campaign, DMForge adapts to
          your world, your tone, and your players.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Who is it for?</h2>
        <ul className="list-disc list-inside space-y-2 text-lg">
          <li>Dungeon Masters who want to spend less time prepping and more time playing</li>
          <li>New DMs who need a starting point for campaigns and characters</li>
          <li>Experienced storytellers looking for unexpected creative prompts</li>
          <li>Players who want to build richer backstories and character histories</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Built by</h2>
        <p className="text-lg leading-relaxed">
          DMForge is an independent project built and operated by a UK-based sole trader
          passionate about tabletop gaming and AI. It&apos;s a small operation — feedback
          goes directly to the person building it.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Get in touch</h2>
        <p className="text-lg">
          Questions, suggestions, or just want to share what your party got up to?{' '}
          <a href="/contact" className="underline hover:opacity-75">
            We&apos;d love to hear from you.
          </a>
        </p>
      </section>
    </main>
  );
}
