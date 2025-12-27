import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUserToAppUser(fbUser: FirebaseUser, profile?: Partial<User>): User {
  const name =
    profile?.name ||
    fbUser.displayName ||
    (fbUser.email ? fbUser.email.split('@')[0] : 'User');

  return {
    id: fbUser.uid,
    email: fbUser.email || profile?.email || '',
    name,
    phone: profile?.phone,
    location: profile?.location,
  };
}

async function fetchUserProfile(uid: string): Promise<Partial<User> | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as any;
  return {
    id: uid,
    email: data.email,
    name: data.name,
    phone: data.phone,
    location: data.location,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUser(null);
          return;
        }

        const profile = await fetchUserProfile(fbUser.uid);
        const appUser = mapFirebaseUserToAppUser(fbUser, profile || undefined);
        setUser(appUser);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // user state will be set by onAuthStateChanged
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);

      // Set Firebase Auth display name
      await fbUpdateProfile(cred.user, { displayName: data.name });

      // Save user profile in Firestore
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          uid: cred.user.uid,
          email: data.email,
          name: data.name,
          phone: data.phone || '',
          location: data.location || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Set user immediately (avoid brief missing phone/location)
      setUser({
        id: cred.user.uid,
        email: data.email,
        name: data.name,
        phone: data.phone,
        location: data.location,
      });

      return true;
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') return false;
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    const nextName = typeof data.name === 'string' ? data.name.trim() : undefined;
    const nextPhone = typeof data.phone === 'string' ? data.phone.trim() : undefined;

    // 1) Update Firebase Auth displayName
    if (nextName && nextName !== fbUser.displayName) {
      await fbUpdateProfile(fbUser, { displayName: nextName });
    }

    // 2) Update Firestore (merge so it works even if doc missing)
    const updates: Record<string, any> = { updatedAt: serverTimestamp() };
    if (nextName) updates.name = nextName;
    if (typeof nextPhone === 'string') updates.phone = nextPhone;

    // Location intentionally not updated (your UI says locked after registration)
    await setDoc(doc(db, 'users', fbUser.uid), updates, { merge: true });

    // 3) Update local state
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        name: nextName ?? prev.name,
        phone: typeof nextPhone === 'string' ? nextPhone : prev.phone,
      };
    });
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAuthLoading,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};