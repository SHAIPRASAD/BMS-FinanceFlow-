import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useConversion } from "@/hooks/useFxRates";
import { getAuthHeaders } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, Info, Check } from "lucide-react";

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

interface TransferFlowProps {
  onComplete: (transferData: any) => void;
  initialBeneficiaryId?: string;
}

export default function TransferFlow({ onComplete, initialBeneficiaryId }: TransferFlowProps) {
  const [step, setStep] = useState(1);

  const form = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceCurrency: "USD",
      sourceAmount: "",
      beneficiaryId: initialBeneficiaryId || "",
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

  const handleReview = (data: TransferForm) => {
    setStep(2);
  };

  const handleConfirm = () => {
    const transferData = {
      ...form.getValues(),
      conversion,
      selectedBeneficiary,
    };
    onComplete(transferData);
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
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center px-4">
        <div className="flex items-center space-x-4 w-full max-w-md">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step > 1 ? 'bg-secondary text-secondary-foreground' : step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm font-medium hidden sm:block">Details</span>
          </div>
          <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-secondary' : 'bg-border'}`}></div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <span className="text-sm font-bold">2</span>
            </div>
            <span className="text-sm font-medium hidden sm:block">Review</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleReview)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="beneficiary">Send To</Label>
                  <Select 
                    value={form.watch("beneficiaryId")}
                    onValueChange={(value) => form.setValue("beneficiaryId", value)}
                  >
                    <SelectTrigger data-testid="select-beneficiary-flow">
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
                      data-testid="input-amount-flow"
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
                      <span className="font-mono text-lg font-semibold text-foreground" data-testid="text-exchange-rate-flow">
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
                      data-testid="input-recipient-amount-flow"
                    />
                    <div className="absolute right-3 top-3 flex items-center space-x-2">
                      <span className="text-lg">{getCountryFlag(selectedBeneficiary.currency)}</span>
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
                    <h4 className="font-medium text-foreground mb-3 flex items-center">
                      Fee Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transfer Fee</span>
                        <span className="text-foreground" data-testid="text-base-fee-flow">
                          ${conversion.fees.baseFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exchange Fee (0.5%)</span>
                        <span className="text-foreground" data-testid="text-exchange-fee-flow">
                          ${conversion.fees.exchangeFee.toFixed(2)}
                        </span>
                      </div>
                      <hr className="border-amber-200" />
                      <div className="flex justify-between font-medium">
                        <span className="text-foreground">Total Cost</span>
                        <span className="text-foreground" data-testid="text-total-cost-flow">
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
                  <SelectTrigger data-testid="select-purpose-flow">
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
                data-testid="button-continue-review-flow"
              >
                <span>Continue to Review</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">You Send</span>
                  <span className="text-lg font-bold text-foreground" data-testid="text-review-send-amount-flow">
                    {formatCurrency(Number(form.getValues("sourceAmount")), "USD")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recipient Gets</span>
                  <span className="text-lg font-bold text-foreground" data-testid="text-review-receive-amount-flow">
                    {conversion && formatCurrency(conversion.targetAmount, conversion.targetCurrency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm text-foreground" data-testid="text-review-beneficiary-flow">
                    {selectedBeneficiary?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Exchange Rate</span>
                  <span className="text-sm font-mono text-foreground" data-testid="text-review-rate-flow">
                    {conversion && `1 USD = ${conversion.exchangeRate.toFixed(4)} ${conversion.targetCurrency}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Fees</span>
                  <span className="text-sm text-foreground" data-testid="text-review-fees-flow">
                    {conversion && `$${conversion.fees.totalFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Purpose</span>
                  <span className="text-sm text-foreground capitalize" data-testid="text-review-purpose-flow">
                    {purposeOptions.find(p => p.value === form.getValues("purpose"))?.label}
                  </span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span className="text-foreground">Total Debit</span>
                  <span className="text-foreground" data-testid="text-review-total-flow">
                    {conversion && `$${conversion.totalCost.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  data-testid="button-back-to-details-flow"
                >
                  Back to Details
                </Button>
                <Button 
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 btn-primary"
                  data-testid="button-confirm-transfer-flow"
                >
                  Confirm Transfer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
