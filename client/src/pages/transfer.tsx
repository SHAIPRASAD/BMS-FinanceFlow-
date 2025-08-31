import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useConversion } from "@/hooks/useFxRates";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, Info, Check, Clock } from "lucide-react";

const transferSchema = z.object({
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  sourceAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  sourceCurrency: z.string().default("USD"),
  purpose: z.string().min(1, "Purpose of transfer is required"),
});

type TransferForm = z.infer<typeof transferSchema>;

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  country: string;
  currency: string;
}

export default function Transfer() {
  const [step, setStep] = useState(1);
  const [transferData, setTransferData] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceCurrency: "USD",
      sourceAmount: "",
      beneficiaryId: "",
      purpose: "",
    },
  });

  const watchedAmount = form.watch("sourceAmount");
  const watchedBeneficiaryId = form.watch("beneficiaryId");

  const { data: beneficiaries, isLoading: beneficiariesLoading } = useQuery<Beneficiary[]>({
    queryKey: ["/api/beneficiaries"],
    queryFn: async () => {
      const res = await fetch("/api/beneficiaries", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch beneficiaries");
      return res.json();
    },
  });

  const selectedBeneficiary = beneficiaries?.find(b => b.id === watchedBeneficiaryId);

  const { data: conversion, isLoading: conversionLoading } = useConversion(
    watchedAmount,
    "USD",
    selectedBeneficiary?.currency || "EUR"
  );

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      const request = {
        ...data,
        targetCurrency: conversion.targetCurrency.toString(),
        targetAmount: conversion.targetAmount.toString(),
        exchangeRate: conversion.exchangeRate.toString(),
        baseFee: conversion.fees.baseFee.toString(),
        exchangeFee: conversion.fees.exchangeFee.toString(),
        totalFee: conversion.fees.totalFee.toString(),                     // hardcoded/derived field
      };
      console.log(request);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create transaction");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setTransferData(data);
      setStep(3);
      toast({
        title: "Transfer created successfully!",
        description: "Your transaction is being processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transfer failed",
        description: error.message || "An error occurred while creating the transfer",
        variant: "destructive",
      });
    },
  });

  const handleReview = (data: TransferForm) => {
    setTransferData({ ...data, conversion });
    setStep(2);
  };

  const handleConfirm = () => {
    if (transferData) {
      createTransactionMutation.mutate({
        beneficiaryId: transferData.beneficiaryId,
        sourceAmount: transferData.sourceAmount,
        sourceCurrency: transferData.sourceCurrency,
        purpose: transferData.purpose,
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const purposeOptions = [
    { value: "family_support", label: "Family Support" },
    { value: "business", label: "Business Payment" },
    { value: "education", label: "Education" },
    { value: "investment", label: "Investment" },
    { value: "other", label: "Other" },
  ];

  if (step === 3 && transferData) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Transfer Successful!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your transfer of {formatCurrency(Number(transferData.sourceAmount), "USD")} has been created and is being processed.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono" data-testid="text-transaction-id">{transferData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="capitalize">
                    <Clock className="h-3 w-3 mr-1" />
                    {transferData.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep(1);
                  setTransferData(null);
                  form.reset();
                }}
                className="flex-1"
                data-testid="button-send-another"
              >
                Send Another
              </Button>
              <Button 
                onClick={() => window.location.href = "/history"}
                className="flex-1"
                data-testid="button-view-history"
              >
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Send Money Globally</h1>
        <p className="text-muted-foreground">Fast, secure, and transparent international transfers</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 px-4">
        <div className="flex items-center space-x-4 w-full max-w-md">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm font-medium hidden sm:block">Details</span>
          </div>
          <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > 2 ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm font-medium hidden sm:block">Review</span>
          </div>
          <div className={`flex-1 h-0.5 ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <span className="text-sm font-bold">3</span>
            </div>
            <span className="text-sm font-medium hidden sm:block">Confirm</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleReview)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="beneficiary">Send To</Label>
                  <Select onValueChange={(value) => form.setValue("beneficiaryId", value)}>
                    <SelectTrigger data-testid="select-beneficiary">
                      <SelectValue placeholder="Select beneficiary" />
                    </SelectTrigger>
                    <SelectContent>
                      {beneficiariesLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : beneficiaries && beneficiaries.length > 0 ? (
                        beneficiaries.map((beneficiary) => (
                          <SelectItem key={beneficiary.id} value={beneficiary.id}>
                            {beneficiary.name} - {beneficiary.country}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-beneficiaries" disabled>
                          No beneficiaries found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.beneficiaryId && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.beneficiaryId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="amount">You Send</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("sourceAmount")}
                      className="pr-20"
                      data-testid="input-amount"
                    />
                    <div className="absolute right-3 top-3 flex items-center space-x-2">
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm font-medium text-foreground">USD</span>
                    </div>
                  </div>
                  {form.formState.errors.sourceAmount && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.sourceAmount.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Exchange Rate Display */}
              {conversion && selectedBeneficiary && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Exchange Rate</span>
                      <span className="text-xs text-muted-foreground">Live rate • Updates every 15 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-semibold text-foreground" data-testid="text-exchange-rate">
                        1 USD = {conversion.exchangeRate.toFixed(4)} {selectedBeneficiary.currency}
                      </span>
                      <Button type="button" variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recipient Amount */}
              {conversion && selectedBeneficiary && (
                <div>
                  <Label>Recipient Gets</Label>
                  <div className="relative">
                    <Input
                      value={conversion.targetAmount.toFixed(2)}
                      readOnly
                      className="bg-muted/30 pr-20"
                      data-testid="input-recipient-amount"
                    />
                    <div className="absolute right-3 top-3 flex items-center space-x-2">
                      <span className="text-sm font-medium text-foreground">
                        {selectedBeneficiary.currency}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fee Breakdown */}
              {conversion && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-accent" />
                  <AlertDescription>
                    <h4 className="font-medium text-foreground mb-3">Fee Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transfer Fee</span>
                        <span className="text-foreground" data-testid="text-base-fee">
                          ${conversion.fees.baseFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exchange Fee (0.5%)</span>
                        <span className="text-foreground" data-testid="text-exchange-fee">
                          ${conversion.fees.exchangeFee.toFixed(2)}
                        </span>
                      </div>
                      <hr className="border-amber-200" />
                      <div className="flex justify-between font-medium">
                        <span className="text-foreground">Total Cost</span>
                        <span className="text-foreground" data-testid="text-total-cost">
                          ${conversion.totalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Purpose */}
              <div>
                <Label>Purpose of Transfer</Label>
                <Select onValueChange={(value) => form.setValue("purpose", value)}>
                  <SelectTrigger data-testid="select-purpose">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.purpose && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.purpose.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2"
                disabled={!conversion || conversionLoading}
                data-testid="button-continue-review"
              >
                <span>Continue to Review</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && transferData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">You Send</span>
                  <span className="text-lg font-bold text-foreground" data-testid="text-review-send-amount">
                    {formatCurrency(Number(transferData.sourceAmount), "USD")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recipient Gets</span>
                  <span className="text-lg font-bold text-foreground" data-testid="text-review-receive-amount">
                    {formatCurrency(transferData.conversion.targetAmount, transferData.conversion.targetCurrency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm text-foreground" data-testid="text-review-beneficiary">
                    {selectedBeneficiary?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Exchange Rate</span>
                  <span className="text-sm font-mono text-foreground" data-testid="text-review-rate">
                    1 USD = {transferData.conversion.exchangeRate.toFixed(4)} {transferData.conversion.targetCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Fees</span>
                  <span className="text-sm text-foreground" data-testid="text-review-fees">
                    ${transferData.conversion.fees.totalFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Purpose</span>
                  <span className="text-sm text-foreground capitalize" data-testid="text-review-purpose">
                    {purposeOptions.find(p => p.value === transferData.purpose)?.label}
                  </span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span className="text-foreground">Total Debit</span>
                  <span className="text-foreground" data-testid="text-review-total">
                    ${transferData.conversion.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  data-testid="button-back-to-details"
                >
                  Back to Details
                </Button>
                <Button 
                  type="button"
                  onClick={handleConfirm}
                  disabled={createTransactionMutation.isPending}
                  className="flex-1 btn-primary"
                  data-testid="button-confirm-transfer"
                >
                  {createTransactionMutation.isPending ? "Processing..." : "Confirm Transfer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
