import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Flag,
  Download,
  BarChart3,
  Settings
} from "lucide-react";
import TransactionTable from "@/components/transaction-table";

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: string;
  highRiskCount: number;
  highRiskTransactions: Array<{
    id: string;
    userId: string;
    beneficiaryId: string;
    sourceAmount: string;
    sourceCurrency: string;
    targetAmount: string;
    targetCurrency: string;
    status: string;
    createdAt: string;
  }>;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  accountNumber: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  beneficiaryId: string;
  sourceAmount: string;
  sourceCurrency: string;
  targetAmount: string;
  targetCurrency: string;
  exchangeRate: string;
  status: string;
  isHighRisk: boolean;
  purpose: string;
  createdAt: string;
}

interface Beneficiary {
  id: string;
  name: string;
  country: string;
  currency: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [user, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
    enabled: user?.isAdmin,
  });

  const { data: allTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/transactions?limit=100", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: user?.isAdmin,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: user?.isAdmin,
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
    enabled: user?.isAdmin,
  });

  const updateTransactionStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const res = await fetch(`/api/admin/transactions/${id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Transaction updated",
        description: "The transaction status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update transaction status",
        variant: "destructive",
      });
    },
  });

  const handleApproveTransaction = (id: string) => {
    updateTransactionStatusMutation.mutate({
      id,
      status: "processing",
      adminNotes: "Approved by admin",
    });
  };

  const handleFlagTransaction = (id: string) => {
    const notes = prompt("Enter admin notes for flagging this transaction:");
    if (notes !== null) {
      updateTransactionStatusMutation.mutate({
        id,
        status: "failed",
        adminNotes: `Flagged: ${notes}`,
      });
    }
  };

  const getUserByTransactionUserId = (userId: string) => {
    return allUsers?.find(u => u.id === userId);
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <Alert className="mb-8 bg-destructive/10 border-destructive/20">
        <Shield className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          <strong>Admin Panel Access</strong> - You have administrative privileges to oversee platform operations.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Admin Stats */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-admin-total-users">
                    {stats?.totalUsers?.toLocaleString() || 0}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">Total Users</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-admin-total-transactions">
                    {stats?.totalTransactions?.toLocaleString() || 0}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">Transactions</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-6 w-6 text-accent" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-admin-high-risk-count">
                    {stats?.highRiskCount || 0}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">High-Risk</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-chart-1" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-admin-total-volume">
                    {stats?.totalVolume || "$0"}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">Total Volume</p>
              </CardContent>
            </Card>
          </div>

          {/* High-Risk Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-accent mr-2" />
                High-Risk Transactions ({'>'}$10,000)
              </CardTitle>
              <span className="text-sm text-muted-foreground">Requires review</span>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-accent/20 bg-accent/5 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div>
                            <Skeleton className="h-4 w-48 mb-2" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 text-right">
                          <Skeleton className="h-6 w-24 mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.highRiskTransactions && stats.highRiskTransactions.length > 0 ? (
                <div className="space-y-4">
                  {stats.highRiskTransactions.map((transaction) => {
                    const transactionUser = getUserByTransactionUserId(transaction.userId);
                    const beneficiary = beneficiaries?.find(b => b.id === transaction.beneficiaryId);
                    
                    return (
                      <div 
                        key={transaction.id} 
                        className="border border-accent/20 bg-accent/5 rounded-lg p-4"
                        data-testid={`high-risk-transaction-${transaction.id}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                              <Flag className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground" data-testid={`text-user-email-${transaction.id}`}>
                                {transactionUser?.email || "Unknown User"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                To: <span data-testid={`text-beneficiary-${transaction.id}`}>
                                  {beneficiary?.name || "Unknown"} ({beneficiary?.country || "N/A"})
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 sm:mt-0 text-right">
                            <p className="text-lg font-bold text-foreground" data-testid={`text-amount-${transaction.id}`}>
                              ${Number(transaction.sourceAmount).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-3">
                          <Button
                            size="sm"
                            className="btn-secondary"
                            onClick={() => handleApproveTransaction(transaction.id)}
                            disabled={updateTransactionStatusMutation.isPending}
                            data-testid={`button-approve-${transaction.id}`}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `/admin/transaction/${transaction.id}`}
                            data-testid={`button-review-${transaction.id}`}
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                            onClick={() => handleFlagTransaction(transaction.id)}
                            disabled={updateTransactionStatusMutation.isPending}
                            data-testid={`button-flag-${transaction.id}`}
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            Flag
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
                  <p className="text-muted-foreground">No high-risk transactions to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Tools Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">FX API</span>
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-1"></div>
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Database</span>
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-1"></div>
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Payment Gateway</span>
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-1"></div>
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start" data-testid="button-export-data">
                <Download className="h-4 w-4 mr-3" />
                Export Data
              </Button>
              <Button variant="ghost" className="w-full justify-start" data-testid="button-generate-report">
                <BarChart3 className="h-4 w-4 mr-3" />
                Generate Report
              </Button>
              <Button variant="ghost" className="w-full justify-start" data-testid="button-system-settings">
                <Settings className="h-4 w-4 mr-3" />
                System Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Transactions Table */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
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
            ) : allTransactions && allTransactions.length > 0 ? (
              <TransactionTable 
                transactions={allTransactions}
                beneficiaries={beneficiaries || []}
                users={allUsers || []}
                showUserColumn={true}
                isAdmin={true}
                onUpdateStatus={updateTransactionStatusMutation.mutate}
              />
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Transactions</h3>
                <p className="text-muted-foreground">No transactions have been made on the platform yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
