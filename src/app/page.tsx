"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/authentification");
  };

  return (
    <main className="flex h-screen items-center justify-center">
      <button
        onClick={handleClick}
        className="rounded-xl bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
      >
        Ir para Login
      </button>
    </main>
  );
}
