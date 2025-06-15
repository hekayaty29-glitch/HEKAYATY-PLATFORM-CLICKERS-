import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";
import { AuthUser } from "./types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
}

interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  fullName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me']
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const field_key = username.includes("@") ? "email" : "username";
      const payload: Record<string, string> = { field_key, field_value: username, password };
      if (field_key === "email") {
        payload.email = username;
      }
      const res = await apiRequest("POST", "/auth/login", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsAuthenticated(true);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Please check your username and password.",
        variant: "destructive",
      });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { username, email, password } = userData;
      const res = await apiRequest("POST", "/auth/signup", { username, email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsAuthenticated(true);
      toast({
        title: "Account created!",
        description: "Welcome to TaleKeeper. Your journey begins now.",
      });
    },
    onError: () => {
      toast({
        title: "Registration failed",
        description: "Please try again with different credentials.",
        variant: "destructive",
      });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Upgrade to premium mutation
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const userId = (user as AuthUser).id;
      const res = await apiRequest("POST", `/api/users/${userId}/premium`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Upgrade successful!",
        description: "You now have premium access to all features.",
      });
    },
    onError: () => {
      toast({
        title: "Upgrade failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const upgradeToPremium = async () => {
    await upgradeMutation.mutateAsync();
  };

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    }
  }, [user]);

  // Update user data in context
  const updateUser = (userData: Partial<AuthUser>) => {
    if (user) {
      queryClient.setQueryData(['/api/auth/me'], { ...user, ...userData });
    }
  };

  // Create the context value object
  const value = {
    user: user as AuthUser | null,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    upgradeToPremium,
    updateUser
  };

  // Return the provider with JSX
  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
