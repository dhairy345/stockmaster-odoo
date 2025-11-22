import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Check Local Storage for "logged in" user
      const storedUser = localStorage.getItem('stock_user');
      if (storedUser) {
          setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    // Local Simulation
    await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
    const storedCreds = localStorage.getItem(`creds_${email}`);
    if (!storedCreds) throw new Error('User not found. Please sign up first (Local Mode).');
    
    const creds = JSON.parse(storedCreds);
    if (creds.password !== password) throw new Error('Invalid password.');

    const userData = { id: 'user_mock_1', email, name: creds.name };
    localStorage.setItem('stock_user', JSON.stringify(userData));
    setUser(userData);
  };

  const signup = async (name: string, email: string, password: string) => {
    // Local Simulation
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem(`creds_${email}`, JSON.stringify({ name, password }));
    
    const userData = { id: 'user_mock_1', email, name };
    localStorage.setItem('stock_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    localStorage.removeItem('stock_user');
    setUser(null);
  };

  const requestOtp = async (email: string) => {
    // Mock API Call
    console.log(`[Mock API] Sending OTP to ${email}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`LOCAL MODE: OTP sent to ${email} (Check Console)`);
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    // Mock Reset
    await new Promise(resolve => setTimeout(resolve, 800));
    const storedCreds = localStorage.getItem(`creds_${email}`);
    if (storedCreds) {
        const creds = JSON.parse(storedCreds);
        localStorage.setItem(`creds_${email}`, JSON.stringify({ ...creds, password: newPassword }));
    } else {
            throw new Error('User not found (Local Mode)');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, requestOtp, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};