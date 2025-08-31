import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useFxRates } from "@/hooks/useFxRates";
import { getAuthHeaders } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  Send, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  RefreshCw, 
  Download,
  Settings,
  Plus
} from "lucide-react";

interface DashboardStats {
  totalSent: string;
  transactionCount: number;
  beneficiaryCount: number;
  recentTransactions: Array<{
    id: string;
    beneficiaryId: string;
    sourceAmount: string;
    sourceCurrency: string;
    targetAmount: string;
    targetCurrency: string;
    status: string;
    createdAt: string;
  }>;
}

interface Beneficiary {
  id: string;
  name: string;
  country: string;
  currency: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: fxRates, isLoading: fxLoading } = useFxRates();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: beneficiaries } = useQuery<Beneficiary[]>({
    queryKey: ["/api/beneficiaries"],
    queryFn: async () => {
      const res = await fetch("/api/beneficiaries", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch beneficiaries");
      return res.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-secondary";
      case "processing":
        return "text-accent";
      case "pending":
        return "text-muted-foreground";
      case "failed":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(num);
  };

  const getCountryFlag = (currency: string) => {
    const flags: Record<string, string> = {
      USD: "🇺🇸",
      EUR: "🇪🇺",
      GBP: "🇬🇧",
      JPY: "🇯🇵",
      KRW: "🇰🇷",
      CAD: "🇨🇦",
      AUD: "🇦🇺",
      CHF: "🇨🇭",
      CNY: "🇨🇳",
    };
    return flags[currency] || "🌍";
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Welcome Card */}
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Welcome back, {user?.fullName?.split(" ")[0]}!
                  </h1>
                  <p className="text-muted-foreground">
                    Account: <span className="font-mono text-sm">{user?.accountNumber}</span>
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Link href="/transfer">
                    <Button className="btn-primary inline-flex items-center space-x-2" data-testid="button-send-money-hero">
                      <Send className="h-4 w-4" />
                      <span>Send Money</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-sent">
                    ${Number(stats?.totalSent || 0).toLocaleString()}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">Total Sent</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Send className="h-6 w-6 text-secondary" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-transaction-count">
                    {stats?.transactionCount || 0}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">Transactions</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-beneficiary-count">
                    {stats?.beneficiaryCount || 0}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">Beneficiaries</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link href="/history">
                <Button variant="ghost" size="sm" data-testid="link-view-all-transactions">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentTransactions.map((transaction) => {
                    const beneficiary = beneficiaries?.find(b => b.id === transaction.beneficiaryId);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <ArrowRight className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {beneficiary?.name || "Unknown Beneficiary"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
                          </p>
                          <p className={`text-sm capitalize ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions yet</p>
                  <Link href="/transfer">
                    <Button className="mt-4" data-testid="button-send-first-money">
                      Send Your First Transfer
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Exchange Rates Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Live Exchange Rates</CardTitle>
              {fxRates && (
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(fxRates.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {fxLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : fxRates?.rates ? (
                <div className="space-y-3">
                  {Object.entries(fxRates.rates)
                    .filter(([currency]) => ["EUR", "GBP", "JPY", "CAD"].includes(currency))
                    .map(([currency, rate]) => (
                      <div key={currency} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getCountryFlag(currency)}</span>
                          <span className="text-sm font-medium text-foreground">
                            USD/{currency}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm text-foreground" data-testid={`rate-${currency}`}>
                            {rate.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Exchange rates unavailable
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/beneficiaries">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-add-beneficiary">
                  <Plus className="h-4 w-4 mr-3" />
                  Add Beneficiary
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start" data-testid="button-download-statement">
                <Download className="h-4 w-4 mr-3" />
                Download Statement
              </Button>
              <Button variant="ghost" className="w-full justify-start" data-testid="button-account-settings">
                <Settings className="h-4 w-4 mr-3" />
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
