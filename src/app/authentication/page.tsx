import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

import LoginForm from "./components/login-form";
import SignUpForm from "./components/sign-up-form";

const AuthenticationPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // NOVA LÓGICA: Redirecionar com base no que o usuário tem
  if (session?.user) {
    // Se tem plano e clínica → Dashboard
    if (session.user.plan && session.user.clinic) {
      redirect("/dashboard");
    }
    // Se tem plano mas não tem clínica → Criar clínica
    else if (session.user.plan && !session.user.clinic) {
      redirect("/clinic-form");
    }
    // Se não tem plano → Assinatura
    else if (!session.user.plan) {
      redirect("/new-subscription");
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Criar conta</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="register">
          <SignUpForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthenticationPage;
