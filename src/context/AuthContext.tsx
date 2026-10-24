import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FbUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  fbUser: FbUser | null;
  loading: boolean;
  isDemoUser: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  admin: {
    uid: 'demo-admin-uid',
    email: 'admin@example.test',
    displayName: 'Адміністратор Дачі',
    role: 'admin',
    isDisabled: false,
    canPublish: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date(),
  },
  organizer: {
    uid: 'demo-organizer-uid',
    email: 'organizer@example.test',
    displayName: 'Організатор Подій',
    role: 'organizer',
    isDisabled: false,
    canPublish: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date(),
  },
  developer: {
    uid: 'demo-developer-uid',
    email: 'developer@example.test',
    displayName: 'Технічна Підтримка (Dev)',
    role: 'developer',
    isDisabled: false,
    canPublish: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date(),
  },
  guest: {
    uid: 'guest-uid',
    email: '',
    displayName: 'Гість простору',
    role: 'guest',
    isDisabled: false,
    canPublish: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dacha_demo_role') as UserRole | null;
    return saved && DEMO_PROFILES[saved] ? DEMO_PROFILES[saved] : DEMO_PROFILES.admin;
  });
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem('dacha_use_demo_role') !== 'false';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFbUser(currentFbUser);
      if (currentFbUser && !isDemoUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentFbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: currentFbUser.uid,
              email: currentFbUser.email || '',
              displayName: data.displayName || currentFbUser.displayName || 'Користувач',
              role: data.role || 'organizer',
              isDisabled: !!data.isDisabled,
              canPublish: !!data.canPublish,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
            });
          } else {
            // Default profile for newly registered users
            setUser({
              uid: currentFbUser.uid,
              email: currentFbUser.email || '',
              displayName: currentFbUser.displayName || 'Організатор',
              role: 'organizer',
              isDisabled: false,
              canPublish: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } catch (e) {
          console.warn('Could not read user profile from Firestore:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  const signIn = async (email: string, pass: string) => {
    setIsDemoUser(false);
    localStorage.setItem('dacha_use_demo_role', 'false');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, displayName: string) => {
    setIsDemoUser(false);
    localStorage.setItem('dacha_use_demo_role', 'false');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await sendEmailVerification(cred.user);
      // Create user document in users collection as required by firestore.rules
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName,
        role: 'organizer',
        isDisabled: false,
        canPublish: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: cred.user.uid,
        updatedBy: cred.user.uid,
        schemaVersion: 1,
        adminRevision: 0,
        lastAdminAuditId: null,
      });
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setUser(DEMO_PROFILES.guest);
    setIsDemoUser(true);
    localStorage.setItem('dacha_use_demo_role', 'true');
    localStorage.setItem('dacha_demo_role', 'guest');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const switchDemoRole = (role: UserRole) => {
    setIsDemoUser(true);
    localStorage.setItem('dacha_use_demo_role', 'true');
    localStorage.setItem('dacha_demo_role', role);
    setUser(DEMO_PROFILES[role]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        fbUser,
        loading,
        isDemoUser,
        signIn,
        signUp,
        signOut,
        resetPassword,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
