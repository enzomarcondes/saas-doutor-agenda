import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { SubscriptionPlan } from "../(protected)/subscription/_components/subscription-plan";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      {/* 🔥 LOGO CENTRALIZADA */}
      <div className="mb-12 flex justify-center">
        <div className="relative">
          <Image
            src="/logo.png"
            alt="Logo da Clínica"
            width={180}
            height={80}
            className="h-auto max-h-20 w-auto object-contain"
            priority
          />
          <div className="absolute -inset-2 rounded-lg bg-gradient-to-r from-blue-200/20 to-purple-200/20 blur-sm"></div>
        </div>
      </div>

      {/* 🔥 HEADER MELHORADO */}
      <div className="mb-12 w-full max-w-4xl text-center">
        <div className="mb-6">
          <h1 className="mb-4 bg-gradient-to-r from-neutral-800 to-gray-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Desbloqueie todo o potencial da sua clínica
          </h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-neutral-400 to-gray-500"></div>
        </div>

        <p className="mb-8 text-xl leading-relaxed text-gray-600 md:text-2xl">
          Para utilizar nossa plataforma e transformar a gestão do seu
          consultório, é necessário escolher um plano que se adapte às suas
          necessidades.
        </p>
        <p className="text-lg text-gray-700">
          Por apenas{" "}
          <span className="text-2xl font-bold text-green-600">R$ 2,70/dia</span>
          <br />
          <span className="text-base text-gray-500 italic">
            (mais barato que um café expresso)
          </span>
          <br />
          <span className="font-semibold text-green-700">
            transforme completamente sua clínica!
          </span>
        </p>
      </div>

      {/* 🔥 PLANO DE ASSINATURA COM SHADOW MELHORADA */}
      <div className="w-full max-w-md transform transition-transform hover:scale-105">
        <div className="rounded-3xl bg-white p-2 shadow-2xl shadow-blue-500/10">
          <SubscriptionPlan userEmail={session.user.email} />
        </div>
      </div>

      {/* 🔥 FOOTER MELHORADO */}
      <div className="mt-12 max-w-lg text-center">
        <div className="rounded-lg bg-white/50 p-6 backdrop-blur-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            by softApex.com.br
          </p>
        </div>
      </div>

      {/* 🔥 ELEMENTOS DECORATIVOS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200/20 to-purple-200/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-amber-200/20 to-orange-200/20 blur-3xl"></div>
      </div>
    </div>
  );
}
