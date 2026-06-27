import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';

export let ALL_FRIENDS: string[] = [];
export type Friend = string;

interface AuthContextType {
  user: Friend | "MASTER" | null;
  login: (email: string, pass: string) => Promise<string | true>;
  register: (name: string, email: string, pass: string) => Promise<string | true>;
  logout: () => void;
  isAuthenticated: boolean;
  friends: Friend[];
  availableFriends: Friend[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Friend | "MASTER" | null>(() => {
    const saved = localStorage.getItem('auth_user_v4');
    return saved ? (saved as Friend | "MASTER") : null;
  });

  const [users, setUsers] = useState<Record<string, { pass: string; friend: Friend }>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "diary_users"), (snapshot) => {
      const usersData: Record<string, { pass: string; friend: Friend }> = {};
      snapshot.forEach(docSnap => {
        usersData[docSnap.id] = docSnap.data() as { pass: string; friend: Friend };
      });
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const friends = Array.from(new Set(Object.values(users).map(u => u.friend))).sort();
  ALL_FRIENDS = friends;
  const availableFriends: Friend[] = [];

  const login = async (email: string, pass: string): Promise<string | true> => {
    const lowerEmail = email.toLowerCase();

    if (lowerEmail === 'contamae2026@gmail.com' && pass === 'purpsmilionario2026@') {
      setUser("MASTER");
      localStorage.setItem('auth_user_v4', 'MASTER');
      return true;
    }

    const userDoc = await getDoc(doc(db, "diary_users", lowerEmail));
    
    if (!userDoc.exists()) {
      return "Não existe conta com esse email.";
    }
    
    const foundUser = userDoc.data() as { pass: string; friend: Friend };
    
    if (foundUser.pass !== pass) {
      return "E-mail ou senha estão errados.";
    }

    setUser(foundUser.friend);
    localStorage.setItem('auth_user_v4', foundUser.friend);
    return true;
  };

  const register = async (name: string, email: string, pass: string): Promise<string | true> => {
    const lowerEmail = email.toLowerCase();
    
    const userDocRef = doc(db, "diary_users", lowerEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return "Este e-mail já está em uso.";
    }
    
    const usersSnapshot = await getDocs(collection(db, "diary_users"));
    let isNameTaken = false;
    usersSnapshot.forEach(docSnap => {
      if (docSnap.data().friend === name) isNameTaken = true;
    });

    if (isNameTaken) {
      return "Esse nome já está sendo utilizado por outra pessoa.";
    }

    await setDoc(userDocRef, { pass, friend: name });
    
    setUser(name);
    localStorage.setItem('auth_user_v4', name);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user_v4');
    sessionStorage.clear();
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
