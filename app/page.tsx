import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "boby-boilerplate",
  description: "Next.js boilerplate — remplace ce fichier pour démarrer.",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">boby-boilerplate</h1>
      <p className="text-lg text-gray-500">Remplace ce fichier pour démarrer ton projet.</p>
    </main>
  );
}
