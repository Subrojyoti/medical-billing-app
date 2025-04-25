// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

const AUTH_KEY = 'isAuthenticated';

export function useAuth(redirectTo = '/login') {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null initially to avoid flicker
  const router = useRouter();

  useEffect(() => {
    // Check localStorage only on the client side
    const storedAuth = localStorage.getItem(AUTH_KEY);
    const authStatus = storedAuth === 'true';
    setIsAuthenticated(authStatus);

    if (!authStatus) {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);

  const login = () => {
    localStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    router.push(redirectTo);
  };

  return { isAuthenticated, login, logout };
}

export function checkCredentials(username?: string, password?: string): boolean {
    const validUsername = process.env.NEXT_PUBLIC_APP_USERNAME;
    const validPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
    return username === validUsername && password === validPassword;
}

// Helper to call on login page submit
export const handleLogin = (username?: string, password?: string): boolean => {
    if (checkCredentials(username, password)) {
        localStorage.setItem(AUTH_KEY, 'true'); // Set flag before redirecting
        return true;
    }
    return false;
};