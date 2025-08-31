import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle, Clock, XCircle, AlertTriangle, Flag, Eye } from "lucide-react";

interface Transaction {
  id: string;
  userId?: string;
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

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  users?: User[];
  showUserColumn?: boolean;
  isAdmin?: boolean;
  onUpdateStatus?: (params: { id: string; status: string; adminNotes?: string }) => void;
}

export default function TransactionTable({ 
  transactions, 
  beneficiaries, 
  users = [],
  showUserColumn = false,
  isAdmin = false,
  onUpdateStatus 
}: TransactionTableProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-secondary" />;
      case "processing":
        return <Clock className="h-4 w-4 text-accent" />;
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "secondary";
      case "processing":
        return "default";
      case "pending":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(num);
  };

  const getBeneficiaryInfo = (beneficiaryId: string) => {
    return beneficiaries.find(b => b.id === beneficiaryId);
  };

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Date
              </TableHead>
              {showUserColumn && (
                <TableHead className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  User
                </TableHead>
              )}
              <TableHead className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Beneficiary
              </TableHead>
              <TableHead className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                FX Rate
              </TableHead>
              <TableHead className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {transactions.map((transaction) => {
              const beneficiary = getBeneficiaryInfo(transaction.beneficiaryId);
              const user = showUserColumn ? getUserInfo(transaction.userId || "") : null;
              
              return (
                <TableRow 
                  key={transaction.id} 
                  className="hover:bg-muted/30 transition-colors"
                  data-testid={`transaction-row-${transaction.id}`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="text-sm text-foreground font-medium">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  
                  {showUserColumn && (
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-xs font-semibold">
                            {user ? getUserInitials(user.fullName) : "?"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground" data-testid={`text-user-name-${transaction.id}`}>
                            {user?.fullName || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user?.email || "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-xs font-semibold">
                          {beneficiary ? getUserInitials(beneficiary.name) : "?"}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground" data-testid={`text-beneficiary-name-${transaction.id}`}>
                          {beneficiary?.name || "Unknown Beneficiary"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {beneficiary?.country || "N/A"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 px-6">
                    <div className="text-sm font-semibold text-foreground" data-testid={`text-source-amount-${transaction.id}`}>
                      {formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid={`text-target-amount-${transaction.id}`}>
                      {formatCurrency(transaction.targetAmount, transaction.targetCurrency)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 px-6">
                    <div className="text-sm font-mono text-foreground" data-testid={`text-fx-rate-${transaction.id}`}>
                      {Number(transaction.exchangeRate).toFixed(4)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={getStatusVariant(transaction.status)} 
                        className="inline-flex items-center text-xs"
                      >
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1 capitalize">{transaction.status}</span>
                      </Badge>
                      {transaction.isHighRisk && (
                        <Badge variant="outline" className="text-accent border-accent/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          High Risk
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.location.href = `/transaction/${transaction.id}`}
                        data-testid={`button-view-details-${transaction.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      {isAdmin && onUpdateStatus && transaction.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-secondary"
                            onClick={() => onUpdateStatus({
                              id: transaction.id,
                              status: "processing",
                              adminNotes: "Approved by admin",
                            })}
                            data-testid={`button-approve-transaction-${transaction.id}`}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                            onClick={() => {
                              const notes = prompt("Enter reason for flagging:");
                              if (notes) {
                                onUpdateStatus({
                                  id: transaction.id,
                                  status: "failed",
                                  adminNotes: `Flagged: ${notes}`,
                                });
                              }
                            }}
                            data-testid={`button-flag-transaction-${transaction.id}`}
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            Flag
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination could be added here if needed */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">1</span> to{" "}
          <span className="font-medium">{Math.min(transactions.length, 10)}</span> of{" "}
          <span className="font-medium">{transactions.length}</span> transactions
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled data-testid="button-previous-page">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-next-page">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
