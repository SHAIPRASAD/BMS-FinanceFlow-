import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Send, Shield, Globe, Zap, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      setLocation("/");
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await register(data.fullName, data.email, data.password);
      toast({
        title: "Account created!",
        description: "Welcome to FinTransfer. Your account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your money and data are protected with enterprise-grade encryption and security.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Send money globally in minutes, not days. Track your transfers in real-time.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Send money to over 200 countries and territories worldwide.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Send className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-foreground">FinTransfer</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Send Money
                  <span className="text-primary"> Globally</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Fast, secure, and transparent international money transfers. 
                  Trusted by thousands worldwide for their global financial needs.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-secondary" />
                  <span className="text-foreground">No hidden fees or surprises</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-secondary" />
                  <span className="text-foreground">Real exchange rates, updated every 15 minutes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-secondary" />
                  <span className="text-foreground">Bank-level security and encryption</span>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <Card className="w-full max-w-md mx-auto shadow-xl">
                <CardHeader>
                  <CardTitle className="text-center">Get Started</CardTitle>
                  <CardDescription className="text-center">
                    Sign in to your account or create a new one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                      <TabsTrigger value="register" data-testid="tab-register">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email Address</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="john@example.com"
                            {...loginForm.register("email")}
                            data-testid="input-login-email"
                          />
                          {loginForm.formState.errors.email && (
                            <p className="text-sm text-destructive">
                              {loginForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            {...loginForm.register("password")}
                            data-testid="input-login-password"
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-sm text-destructive">
                              {loginForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full btn-primary"
                          disabled={isLoading}
                          data-testid="button-login"
                        >
                          {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-4">
                      <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-name">Full Name</Label>
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="John Doe"
                            {...registerForm.register("fullName")}
                            data-testid="input-register-name"
                          />
                          {registerForm.formState.errors.fullName && (
                            <p className="text-sm text-destructive">
                              {registerForm.formState.errors.fullName.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email Address</Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="john@example.com"
                            {...registerForm.register("email")}
                            data-testid="input-register-email"
                          />
                          {registerForm.formState.errors.email && (
                            <p className="text-sm text-destructive">
                              {registerForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="••••••••"
                            {...registerForm.register("password")}
                            data-testid="input-register-password"
                          />
                          {registerForm.formState.errors.password && (
                            <p className="text-sm text-destructive">
                              {registerForm.formState.errors.password.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            At least 8 characters with letters and numbers
                          </p>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full btn-primary"
                          disabled={isLoading}
                          data-testid="button-register"
                        >
                          {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose FinTransfer?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're building the future of international money transfers with security, 
              speed, and transparency at the core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center card-hover">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Send className="text-primary-foreground h-4 w-4" />
              </div>
              <span className="text-xl font-bold text-foreground">FinTransfer</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 FinTransfer. All rights reserved. Regulated by financial authorities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
