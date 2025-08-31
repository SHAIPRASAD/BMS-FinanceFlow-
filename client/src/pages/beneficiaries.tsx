import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Send, Users } from "lucide-react";
import BeneficiaryForm from "@/components/beneficiary-form";

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  country: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export default function Beneficiaries() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const { toast } = useToast();

  const { data: beneficiaries, isLoading } = useQuery<Beneficiary[]>({
    queryKey: ["/api/beneficiaries"],
    queryFn: async () => {
      const res = await fetch("/api/beneficiaries", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch beneficiaries");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete beneficiary");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Beneficiary deleted",
        description: "The beneficiary has been removed from your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete beneficiary",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
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

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 mt-4 sm:mt-0" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Beneficiaries</h1>
          <p className="text-muted-foreground">Manage your saved recipients for quick transfers</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="mt-4 sm:mt-0 btn-primary inline-flex items-center space-x-2"
          data-testid="button-add-beneficiary"
        >
          <Plus className="h-4 w-4" />
          <span>Add Beneficiary</span>
        </Button>
      </div>

      {beneficiaries && beneficiaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficiaries.map((beneficiary) => (
            <Card key={beneficiary.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {getUserInitials(beneficiary.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground" data-testid={`text-beneficiary-name-${beneficiary.id}`}>
                        {beneficiary.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <span className="mr-1">{getCountryFlag(beneficiary.currency)}</span>
                        {beneficiary.country}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-mono text-foreground" data-testid={`text-account-${beneficiary.id}`}>
                      ****{beneficiary.accountNumber.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Currency</span>
                    <Badge variant="secondary" className="text-xs">
                      {beneficiary.currency}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Added</span>
                    <span className="text-foreground">
                      {new Date(beneficiary.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1 btn-primary"
                    onClick={() => window.location.href = `/transfer?beneficiary=${beneficiary.id}`}
                    data-testid={`button-send-money-${beneficiary.id}`}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Money
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(beneficiary)}
                    data-testid={`button-edit-${beneficiary.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(beneficiary.id, beneficiary.name)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${beneficiary.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Beneficiaries Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Add your first beneficiary to start sending money quickly and securely.
            </p>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary"
              data-testid="button-add-first-beneficiary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Beneficiary
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Beneficiary Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Beneficiary</DialogTitle>
            <DialogDescription>
              Add a new recipient to send money to quickly and securely.
            </DialogDescription>
          </DialogHeader>
          <BeneficiaryForm
            onSuccess={() => {
              setIsAddModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"] });
              queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            }}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Beneficiary Modal */}
      <Dialog open={!!editingBeneficiary} onOpenChange={() => setEditingBeneficiary(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Beneficiary</DialogTitle>
            <DialogDescription>
              Update the beneficiary information.
            </DialogDescription>
          </DialogHeader>
          {editingBeneficiary && (
            <BeneficiaryForm
              beneficiary={editingBeneficiary}
              onSuccess={() => {
                setEditingBeneficiary(null);
                queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"] });
              }}
              onCancel={() => setEditingBeneficiary(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
