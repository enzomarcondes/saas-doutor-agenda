"use client";

import {
  BarChart3,
  CalendarDays,
  DollarSign,
  Gem,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Sun,
  UserCheck,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";

// 🦷 COMPONENTE CUSTOMIZADO PARA ÍCONE DE DENTE
function ToothIcon({ className }: { className?: string }) {
  return (
    <span className={`text-lg ${className}`} role="img" aria-label="dente">
      🦷
    </span>
  );
}

// 🗂️ ITENS DO MENU PRINCIPAL
const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: CalendarDays,
    enabled: true,
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    enabled: true, // 🔥 MUDANÇA: false → true
    comingSoon: false, // 🔥 MUDANÇA: true → false (ou remover)
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
    enabled: false,
    comingSoon: true,
  },
];

// 🗂️ ITENS DE CADASTROS
const cadastroItems = [
  {
    title: "Dentistas",
    url: "/doctors",
    icon: UserCheck,
    enabled: true,
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: UsersRound,
    enabled: true,
  },
  {
    title: "Serviços",
    url: "/services",
    icon: ToothIcon,
    enabled: true,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const session = authClient.useSession();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = "5567984216716"; // Substitua pelo número real
    const message = encodeURIComponent(
      "Olá! Preciso de ajuda com o sistema Clinic Easy.",
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <TooltipProvider>
      <Sidebar>
        <SidebarHeader className="border-b p-6">
          <Image
            src="/logo.png"
            alt="Clinic Easy"
            width={290}
            height={100}
            className="mx-auto"
          />
        </SidebarHeader>
        <SidebarContent>
          {/* 🗂️ GRUPO: MENU PRINCIPAL */}
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.enabled ? (
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            disabled
                            className="cursor-not-allowed opacity-50"
                          >
                            <item.icon />
                            <span>{item.title}</span>
                            {item.comingSoon && (
                              <span className="text-muted-foreground ml-auto text-xs">
                                Em breve
                              </span>
                            )}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Funcionalidade em desenvolvimento</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* 🗂️ GRUPO: CADASTROS */}
          <SidebarGroup>
            <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {cadastroItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* 🗂️ GRUPO: OUTROS */}
          <SidebarGroup>
            <SidebarGroupLabel>Outros</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/subscription"}
                  >
                    <Link href="/subscription">
                      <Gem />
                      <span>Assinatura</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {mounted && (
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton>
                          {theme === "dark" ? <Moon /> : <Sun />}
                          <span>Tema</span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Claro</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Escuro</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                          <span className="mr-2">💻</span>
                          <span>Sistema</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Dialog>
                    <DialogTrigger asChild>
                      <SidebarMenuButton>
                        <HelpCircle />
                        <span>Precisa de ajuda?</span>
                      </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Como podemos ajudar?</DialogTitle>
                        <DialogDescription>
                          Entre em contato conosco pelo WhatsApp para suporte
                          rápido e personalizado.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 pt-4">
                        <Button
                          onClick={handleWhatsAppContact}
                          className="bg-green-500 text-white hover:bg-green-600"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Entre em contato pelo WhatsApp
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar>
                      <AvatarFallback>F</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        {session.data?.user?.clinic?.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {session.data?.user.email}
                      </p>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
