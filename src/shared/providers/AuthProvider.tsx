'use client';

/**
 * AuthProvider — Global authentication context.
 * Wraps the app to provide user state via Firebase Auth.
 * Falls back to anonymous "single-user" mode when Firebase is not configured.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/config';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { ensureUserScope } from '@/lib/storage/user-scope';
import { pullFromCloud, startCloudAutoSync, stopCloudAutoSync } from '@/lib/storage/cloud-sync';

interface AuthContextType {
  user: User | null;
  userId: string;
  displayName: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  isFirebaseMode: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseMode = isFirebaseConfigured && auth !== null;

  useEffect(() => {
    if (!isFirebaseMode || !auth) {
      // No Firebase — single-user mode
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    let syncedUid: string | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Só sincroniza quando a conta muda de fato (evita re-pull no refresh de token).
        if (firebaseUser.uid !== syncedUid) {
          ensureUserScope(firebaseUser.uid);      // isola a gaveta por conta
          await pullFromCloud(firebaseUser.uid);  // traz os dados da nuvem
          startCloudAutoSync(firebaseUser.uid);   // passa a salvar mudanças na nuvem
          syncedUid = firebaseUser.uid;
        }
        setUser(firebaseUser);
      } else {
        stopCloudAutoSync();
        syncedUid = null;
        setUser(null);
      }
       
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseMode]);

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  const registerWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) return;
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const clearError = () => setError(null);

  const userId = user?.uid || DEFAULT_USER_ID;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guerreiro';
  const isAuthenticated = isFirebaseMode ? user !== null : true;

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        displayName,
        isLoading,
        isAuthenticated,
        isFirebaseMode,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found': return 'Usuário não encontrado.';
    case 'auth/wrong-password': return 'Senha incorreta.';
    case 'auth/email-already-in-use': return 'Este email já está em uso.';
    case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-email': return 'Email inválido.';
    case 'auth/popup-closed-by-user': return 'Login cancelado.';
    default: return 'Erro de autenticação. Tente novamente.';
  }
}
