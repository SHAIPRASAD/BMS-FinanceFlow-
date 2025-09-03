import { useState } from "react";
import { useQuery , useQueryClient} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  fullName: string;
  accountNumber: string;
  isAdmin: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return null;

      try {
        const res = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("authToken");
            return null;
          }
          throw new Error("Failed to fetch user");
        }

        return await res.json();
      } catch (error) {
        localStorage.removeItem("authToken");
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    localStorage.setItem("authToken", data.token);
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    return data;
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { fullName, email, password });
    const data = await res.json();
    localStorage.setItem("authToken", data.token);
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}
