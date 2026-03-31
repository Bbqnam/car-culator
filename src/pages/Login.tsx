import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type AuthMode = "sign-in" | "sign-up";

type SignInValues = {
  email: string;
  password: string;
};

type SignUpValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const { signIn, signUp } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();

  const signInSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t({ en: "Email is required", sv: "E-post krävs" }))
          .email(t({ en: "Enter a valid email", sv: "Ange en giltig e-post" })),
        password: z
          .string()
          .min(8, t({ en: "Password must be at least 8 characters", sv: "Lösenordet måste vara minst 8 tecken" })),
      }),
    [t],
  );

  const signUpSchema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .trim()
            .min(2, t({ en: "Name must be at least 2 characters", sv: "Namnet måste vara minst 2 tecken" })),
          email: z
            .string()
            .trim()
            .min(1, t({ en: "Email is required", sv: "E-post krävs" }))
            .email(t({ en: "Enter a valid email", sv: "Ange en giltig e-post" })),
          password: z
            .string()
            .min(8, t({ en: "Password must be at least 8 characters", sv: "Lösenordet måste vara minst 8 tecken" })),
          confirmPassword: z.string(),
        })
        .refine((values) => values.password === values.confirmPassword, {
          message: t({ en: "Passwords do not match", sv: "Lösenorden matchar inte" }),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleAuthError = (error: unknown) => {
    const code = error instanceof Error ? error.message : "unknown_error";

    if (code === "account_exists") {
      toast.error(t({ en: "That email already has an account", sv: "Den e-posten har redan ett konto" }));
      return;
    }

    if (code === "invalid_credentials") {
      toast.error(t({ en: "Invalid email or password", sv: "Fel e-post eller lösenord" }));
      return;
    }

    toast.error(t({ en: "Something went wrong. Please try again.", sv: "Något gick fel. Försök igen." }));
  };

  const onSignIn = signInForm.handleSubmit((values) => {
    try {
      signIn(values);
      toast.success(t({ en: "Welcome back", sv: "Välkommen tillbaka" }));
      navigate("/");
    } catch (error) {
      handleAuthError(error);
    }
  });

  const onSignUp = signUpForm.handleSubmit((values) => {
    try {
      signUp({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      toast.success(t({ en: "Account created", sv: "Kontot skapades" }));
      navigate("/");
    } catch (error) {
      handleAuthError(error);
    }
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--highlight-soft))_0%,transparent_38%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Carculator logo" className="h-12 w-auto object-contain" />
            <div>
              <p className="text-lg font-semibold tracking-tight">Carculator</p>
              <p className="text-sm text-muted-foreground">
                {t({
                  en: "Optional login prototype for a future account flow.",
                  sv: "Valfri login-prototyp för ett framtida kontoflöde.",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-full border-border/70 bg-background/80 px-3 text-xs backdrop-blur-sm"
              onClick={() => setLanguage(language === "en" ? "sv" : "en")}
            >
              {language === "en" ? "SV" : "EN"}
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
            <section className="max-w-xl space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  {t({
                    en: "Prototype only",
                    sv: "Endast prototyp",
                  })}
                </span>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {t({
                    en: "Explore the login flow without blocking the calculator.",
                    sv: "Utforska login-flödet utan att blockera kalkylatorn.",
                  })}
                </h1>
                <p className="text-base leading-7 text-muted-foreground">
                  {t({
                    en: "The main calculator stays fully open. This page is just a sandbox for the future account experience, stored locally in your browser for now.",
                    sv: "Själva kalkylatorn är fortsatt helt öppen. Den här sidan är bara en sandlåda för ett framtida kontoflöde och lagras lokalt i webbläsaren just nu.",
                  })}
                </p>
                <Button asChild variant="secondary" className="rounded-full px-5">
                  <Link to="/">{t({ en: "Back to calculator", sv: "Tillbaka till kalkylatorn" })}</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold">
                    {t({ en: "Persistent session", sv: "Bestående session" })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t({
                      en: "Stay signed in across reloads.",
                      sv: "Fortsätt vara inloggad efter omladdning.",
                    })}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold">
                    {t({ en: "Light and dark mode", sv: "Ljust och mörkt läge" })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t({
                      en: "Toggle instantly with a single click.",
                      sv: "Växla direkt med ett enda klick.",
                    })}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold">
                    {t({ en: "Ready to extend", sv: "Redo att byggas ut" })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t({
                      en: "Swap local auth for Supabase, Clerk, or your own API later.",
                      sv: "Byt senare ut lokal auth mot Supabase, Clerk eller ett eget API.",
                    })}
                  </p>
                </div>
              </div>
            </section>

            <Card className="border-border/70 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">
                  {t({ en: "Access your workspace", sv: "Öppna din arbetsyta" })}
                </CardTitle>
                <CardDescription>
                  {t({
                    en: "Use an existing account or create a new one to continue.",
                    sv: "Använd ett befintligt konto eller skapa ett nytt för att fortsätta.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sign-in">
                      {t({ en: "Sign in", sv: "Logga in" })}
                    </TabsTrigger>
                    <TabsTrigger value="sign-up">
                      {t({ en: "Create account", sv: "Skapa konto" })}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sign-in">
                    <form className="space-y-4" onSubmit={onSignIn}>
                      <div className="space-y-2">
                        <Label htmlFor="sign-in-email">
                          {t({ en: "Email", sv: "E-post" })}
                        </Label>
                        <Input
                          id="sign-in-email"
                          type="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          {...signInForm.register("email")}
                        />
                        {signInForm.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {signInForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sign-in-password">
                          {t({ en: "Password", sv: "Lösenord" })}
                        </Label>
                        <Input
                          id="sign-in-password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="********"
                          {...signInForm.register("password")}
                        />
                        {signInForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {signInForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button type="submit" className="w-full">
                        {t({ en: "Sign in", sv: "Logga in" })}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="sign-up">
                    <form className="space-y-4" onSubmit={onSignUp}>
                      <div className="space-y-2">
                        <Label htmlFor="sign-up-name">
                          {t({ en: "Name", sv: "Namn" })}
                        </Label>
                        <Input
                          id="sign-up-name"
                          autoComplete="name"
                          placeholder={t({ en: "Alex Johnson", sv: "Alex Johansson" })}
                          {...signUpForm.register("name")}
                        />
                        {signUpForm.formState.errors.name && (
                          <p className="text-sm text-destructive">
                            {signUpForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sign-up-email">
                          {t({ en: "Email", sv: "E-post" })}
                        </Label>
                        <Input
                          id="sign-up-email"
                          type="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          {...signUpForm.register("email")}
                        />
                        {signUpForm.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {signUpForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sign-up-password">
                          {t({ en: "Password", sv: "Lösenord" })}
                        </Label>
                        <Input
                          id="sign-up-password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="********"
                          {...signUpForm.register("password")}
                        />
                        {signUpForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {signUpForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sign-up-confirm-password">
                          {t({ en: "Confirm password", sv: "Bekräfta lösenord" })}
                        </Label>
                        <Input
                          id="sign-up-confirm-password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="********"
                          {...signUpForm.register("confirmPassword")}
                        />
                        {signUpForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">
                            {signUpForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <Button type="submit" className="w-full">
                        {t({ en: "Create account", sv: "Skapa konto" })}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  {t({
                    en: "Prototype note: credentials are stored in localStorage for now, so this is ideal for product validation but not production security yet.",
                    sv: "Prototypnotering: inloggningsuppgifter lagras i localStorage just nu, så detta passar för produktvalidering men ännu inte för produktion.",
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
