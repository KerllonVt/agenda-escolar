// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Agora salvamos o usuário e o token no estado
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // A função 'login' agora apenas recebe os dados e os salva no estado
  // A lógica de API foi movida para o componente Login.tsx
  const login = (usuario: Usuario, token: string) => {
    setUsuario(usuario);
    setToken(token);
    // No mundo real, salvaríamos o token no localStorage
    // localStorage.setItem('authToken', token);
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    // localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}