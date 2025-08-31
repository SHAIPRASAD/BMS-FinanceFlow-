import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const beneficiarySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  accountNumber: z.string().min(5, "Account number must be at least 5 characters"),
  country: z.string().length(2, "Please select a country"),
  currency: z.string().length(3, "Please select a currency"),
});

type BeneficiaryForm = z.infer<typeof beneficiarySchema>;

interface BeneficiaryFormProps {
  beneficiary?: {
    id: string;
    name: string;
    accountNumber: string;
    country: string;
    currency: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const countries = [
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "KR", name: "South Korea", currency: "KRW" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  { code: "CN", name: "China", currency: "CNY" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "MX", name: "Mexico", currency: "MXN" },
];

const currencies = [
  { code: "EUR", name: "Euro" },
  { code: "KRW", name: "Korean Won" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "MXN", name: "Mexican Peso" },
];

export default function BeneficiaryForm({ beneficiary, onSuccess, onCancel }: BeneficiaryFormProps) {
  const { toast } = useToast();
  const isEditing = !!beneficiary;

  const form = useForm<BeneficiaryForm>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      name: beneficiary?.name || "",
      accountNumber: beneficiary?.accountNumber || "",
      country: beneficiary?.country || "",
      currency: beneficiary?.currency || "",
    },
  });

  const selectedCountry = form.watch("country");

  // Auto-set currency when country changes
  const handleCountryChange = (countryCode: string) => {
    form.setValue("country", countryCode);
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      form.setValue("currency", country.currency);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: BeneficiaryForm) => {
      const url = isEditing ? `/api/beneficiaries/${beneficiary.id}` : "/api/beneficiaries";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} beneficiary`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `Beneficiary ${isEditing ? 'updated' : 'added'}`,
        description: `${form.getValues("name")} has been ${isEditing ? 'updated' : 'added'} successfully.`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: `${isEditing ? 'Update' : 'Creation'} failed`,
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} beneficiary`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: BeneficiaryForm) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Beneficiary Name</Label>
        <Input
          id="name"
          placeholder="Full name"
          {...form.register("name")}
          data-testid="input-beneficiary-name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="accountNumber">Bank Account Number</Label>
        <Input
          id="accountNumber"
          placeholder="Account number"
          {...form.register("accountNumber")}
          data-testid="input-beneficiary-account"
        />
        {form.formState.errors.accountNumber && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.accountNumber.message}
          </p>
        )}
      </div>

      <div>
        <Label>Country</Label>
        <Select 
          value={form.watch("country")}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger data-testid="select-beneficiary-country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.country && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.country.message}
          </p>
        )}
      </div>

      <div>
        <Label>Currency</Label>
        <Select 
          value={form.watch("currency")}
          onValueChange={(value) => form.setValue("currency", value)}
        >
          <SelectTrigger data-testid="select-beneficiary-currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.currency && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.currency.message}
          </p>
        )}
      </div>

      <div className="flex space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          data-testid="button-cancel-beneficiary"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 btn-primary"
          data-testid="button-save-beneficiary"
        >
          {mutation.isPending 
            ? `${isEditing ? 'Updating' : 'Adding'}...` 
            : `${isEditing ? 'Update' : 'Add'} Beneficiary`
          }
        </Button>
      </div>
    </form>
  );
}
