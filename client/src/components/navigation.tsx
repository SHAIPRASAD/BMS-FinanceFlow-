import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Send, 
  Users, 
  History, 
  BarChart3, 
  Menu, 
  X, 
  Settings,
  Shield
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3, active: location === "/" },
    { name: "Send Money", href: "/transfer", icon: Send, active: location === "/transfer" },
    { name: "Beneficiaries", href: "/beneficiaries", icon: Users, active: location === "/beneficiaries" },
    { name: "History", href: "/history", icon: History, active: location === "/history" },
  ];

  if (user.isAdmin) {
    navigation.push({
      name: "Admin",
      href: "/admin",
      icon: Shield,
      active: location === "/admin",
    });
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4" data-testid="link-logo">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Send className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">FinTransfer</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                    item.active ? "text-primary" : "text-foreground"
                  }`}
                  data-testid={`link-nav-${item.name.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-sm"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{user.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="font-medium text-foreground">{user.fullName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground font-mono">{user.accountNumber}</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                  data-testid="button-logout"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Send className="text-primary-foreground h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold">FinTransfer</span>
                  </div>
                </div>

                <nav className="space-y-4">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          item.active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                        data-testid={`link-mobile-nav-${item.name.toLowerCase().replace(" ", "-")}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-8 pt-8 border-t border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">{user.fullName}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="w-full justify-start"
                    data-testid="button-mobile-logout"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
