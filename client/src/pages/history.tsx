import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { History as HistoryIcon, Search } from "lucide-react";
import TransactionTable from "@/components/transaction-table";

interface Transaction {
  id: string;
  beneficiaryId: string;
  sourceAmount: string;
  sourceCurrency: string;
  targetAmount: string;
  targetCurrency: string;
  exchangeRate: string;
  baseFee: string;
  exchangeFee: string;
  totalFee: string;
  purpose: string;
  status: string;
  isHighRisk: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Beneficiary {
  id: string;
  name: string;
  country: string;
  currency: string;
}

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { search: searchQuery, dateRange }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (dateRange !== "all") params.append("dateRange", dateRange);
      
      const res = await fetch(`/api/transactions?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
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

  if (transactionsLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
          <p className="text-muted-foreground">Track all your money transfers and their status</p>
        </div>

        {/* Search and Filter */}
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Input
              placeholder="Search beneficiary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10"
              data-testid="input-search-transactions"
            />
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-32" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 3 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {transactions && transactions.length > 0 ? (
        <TransactionTable 
          transactions={transactions} 
          beneficiaries={beneficiaries || []}
          showUserColumn={false}
        />
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <HistoryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || dateRange !== "all" 
                ? "No transactions match your search criteria." 
                : "You haven't made any transfers yet."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
