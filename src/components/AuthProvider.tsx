import React, { createContext, useContext, useState, useEffect } from 'react';

export const ALL_FRIENDS = ["Daniel", "Perez", "Ricardo", "Morote", "Pedro", "Enzo"] as const;
export type Friend = (typeof ALL_FRIENDS)[number];

interface AuthContextType {
  user: Friend | null;
  login: (email: string, pass: string) => string | true;
  register: (name: string, email: string, pass: string) => string | true;
  logout: () => void;
  isAuthenticated: boolean;
  friends: Friend[];
  availableFriends: Friend[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Friend | null>(() => {
    // Tenta recuperar do localStorage ao carregar
    const saved = localStorage.getItem('auth_user_v2');
    return saved ? (saved as Friend) : null;
  });

  const [users, setUsers] = useState<Record<string, { pass: string; friend: Friend }>>(() => {
    const saved = localStorage.getItem('auth_users_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const friendsElement = Object.values(users).map(u => u.friend);
  const friends = Array.from(new Set(friendsElement)).sort();
  const availableFriends = ALL_FRIENDS.filter(f => !friends.includes(f));

  const login = (email: string, pass: string) => {
    const lowerEmail = email.toLowerCase();
    const foundUser = users[lowerEmail];
    
    if (!foundUser) {
      return "Não existe conta com esse email.";
    }
    
    if (foundUser.pass !== pass) {
      return "E-mail ou senha estão errados.";
    }

    setUser(foundUser.friend);
    localStorage.setItem('auth_user_v2', foundUser.friend);
    return true;
  };

  const register = (name: string, email: string, pass: string) => {
    const lowerEmail = email.toLowerCase();
    if (users[lowerEmail]) {
      return "Este e-mail já está em uso.";
    }
    const newUsers = { ...users, [lowerEmail]: { pass, friend: name as Friend } };
    setUsers(newUsers);
    localStorage.setItem('auth_users_v2', JSON.stringify(newUsers));
    
    setUser(name as Friend);
    localStorage.setItem('auth_user_v2', name);
    return true;
  };

  const logout = () => {
    setUser(null);
    // Limpa TUDO do localStorage
    localStorage.clear();
    // Limpa TUDO do sessionStorage
    sessionStorage.clear();
    // Limpa TODOS os cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    // Força o recarregamento para garantir que o estado zerado seja aplicado
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, friends, availableFriends }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
