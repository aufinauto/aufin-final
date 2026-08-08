import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Car, Inquiry, BlogPost } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  LogOut, 
  ChevronRight, 
  LayoutDashboard, 
  Car as CarIcon, 
  MessageSquare,
  Image as ImageIcon,
  Phone,
  Mail,
  Info,
  Palette,
  Settings,
  Eye,
  EyeOff,
  DollarSign,
  Shield,
  FileText,
  Upload,
  StickyNote,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_EMAIL = 'schillerjirka@gmail.com';

const INQUIRY_STATUS_LABELS = {
  'new': { label: 'Nová', icon: <Plus className="w-3 h-3" />, color: 'bg-blue-500' },
  'contacted': { label: 'Kontaktováno', icon: <Phone className="w-3 h-3" />, color: 'bg-amber-500' },
  'negotiating': { label: 'Jednání', icon: <MessageSquare className="w-3 h-3" />, color: 'bg-purple-500' },
  'done': { label: 'Uzavřeno', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-green-500' },
  'cancelled': { label: 'Zrušeno', icon: <X className="w-3 h-3" />, color: 'bg-red-500' }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  return new Error(error instanceof Error ? error.message : String(error));
}

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cars' | 'inquiries' | 'blog'>('cars');

  const [editForm, setEditForm] = useState<Partial<Car>>({});
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Blog
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<Partial<BlogPost>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("[Admin] Auth State Changed:", u ? `User: ${u.email}, UID: ${u.uid}` : "No user");
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isAdminEmail = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isAdminEmail) {
      const qCars = query(collection(db, 'cars'), orderBy('createdAt', 'desc'));
      const unsubCars = onSnapshot(qCars, (snapshot) => {
        setCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'cars');
        alert("Chyba při načítání vozů: " + err.message);
      });

      const qInq = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
      const unsubInq = onSnapshot(qInq, (snapshot) => {
        setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'inquiries');
        alert("Chyba při načítání poptávek: " + err.message);
      });

      const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const unsubPosts = onSnapshot(qPosts, (snapshot) => {
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'posts');
      });

      return () => {
        unsubCars();
        unsubInq();
        unsubPosts();
      };
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("CHYBA: Doména '" + window.location.hostname + "' není povolená ve Firebase konzoli. Přejděte do Firebase Console -> Authentication -> Settings -> Authorized domains a přidejte ji.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Prohlížeč zablokoval vyskakovací okno. Povolte prosím vyskakovací okna pro tento web.");
      } else {
        alert("Přihlášení se nezdařilo: " + error.message);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;
 
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
 
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress even more to JPEG with 0.5 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size before compression as a safety measure
    if (file.size > 25 * 1024 * 1024) { // 25MB limit for source file (modern phones)
      alert("Soubor je příliš velký. Prosím nahrajte soubor menší než 25MB.");
      return;
    }

    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      
      if (target === 'main') {
        setEditForm(prev => ({ ...prev, image: compressedBase64 }));
      } else {
        setEditForm(prev => ({ 
          ...prev, 
          gallery: [...(prev.gallery || []), compressedBase64] 
        }));
      }
    } catch (err) {
      console.error("Compression error:", err);
      alert("Chyba při zpracování obrázku.");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (car: Car) => {
    setIsEditing(car.id);
    setEditForm(car);
  };

  const startAdd = () => {
    setIsEditing('new');
    setEditForm({
      name: '',
      brand: '',
      pickupPrice: 0,
      priceValue: 0,
      price: '',
      image: '',
      description: '',
      details: { fuel: '', engine: '', power: '', transmission: '', year: '', color: '' },
      equipment: '',
      gallery: [],
      isVisible: true,
      isComingSoon: false,
      seo: {
        title: '',
        description: '',
        slug: ''
      }
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const calculateDocSize = (data: any) => {
    const str = JSON.stringify(data);
    return new Blob([str]).size;
  };

  const saveCar = async () => {
    if (!editForm.name || !editForm.brand) {
      alert("Jméno a značka jsou povinné.");
      return;
    }

    const docSize = calculateDocSize(editForm);
    if (docSize > 1000000) { // Slightly less than 1,048,576 to be safe
      alert(`CHYBA: Dokument inzerátu je příliš velký (${(docSize / 1024 / 1024).toFixed(2)} MB). Maximální limit Google databáze je 1 MB. Nahrajte prosím méně fotek nebo ve větším rozlišení (automaticky je zmenšujeme, ale galerie má svůj limit).`);
      return;
    }

    // Default values and cleanup - if priceValue is not explicitly set, derive it from price string
    const numericPriceValue = editForm.priceValue && editForm.priceValue > 0 
      ? editForm.priceValue 
      : parseInt(editForm.price?.replace(/\D/g, '') || "0");
      
    const carData = {
      ...editForm,
      priceValue: numericPriceValue,
      pickupPrice: Number(editForm.pickupPrice || 0),
      updatedAt: serverTimestamp()
    };

    // Close immediately for perceived speed
    const currentIsEditing = isEditing;
    setIsEditing(null);

    try {
      if (currentIsEditing === 'new') {
        const docRef = await addDoc(collection(db, 'cars'), { 
          ...carData, 
          createdAt: serverTimestamp(),
          isVisible: editForm.isVisible !== undefined ? editForm.isVisible : true 
        });
        console.log("Auto úspěšně přidáno s ID: ", docRef.id);
      } else {
        await updateDoc(doc(db, 'cars', currentIsEditing!), carData);
        console.log("Auto úspěšně aktualizováno");
      }
    } catch (err: any) {
      console.error("Chyba při ukládání:", err);
      if (err.message?.includes("too large") || err.message?.includes("1048576 bytes")) {
        alert("CHYBA: Objekt je příliš velký pro uložení do databáze. Zkuste nahrát méně fotek v galerii nebo fotky s menším rozlišením. (Limit je 1MB na celý inzerát).");
      } else if (err.message?.includes("insufficient permissions")) {
        alert("Nemáte oprávnění k této akci. Ujistěte se, že jste přihlášen jako admin.");
      } else {
        alert("Chyba při ukládání do databáze: " + err.message);
      }
      // Re-open editor on error so user doesn't lose data
      setIsEditing(currentIsEditing);
      setEditForm(editForm);
    }
  };

  const deleteCar = async (id: string) => {
    if (window.confirm('Opravdu chcete tento vůz definitivně smazat? Tato akce je nevratná.')) {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      
      try {
        console.log(`[Admin] Pokus o smazání vozu ID: ${id}`);
        console.log(`[Admin] Aktuální uživatel: ${auth.currentUser?.email}, UID: ${auth.currentUser?.uid}`);
        
        if (!auth.currentUser) {
          throw new Error("Uživatel není přihlášen k mazání.");
        }

        const carRef = doc(db, 'cars', id);
        await deleteDoc(carRef);
        
        console.log(`[Admin] Vůz ${id} úspěšně smazán z Firestore`);
        
        // Explicitly update local state for immediate feedback
        setCars(prev => prev.filter(c => c.id !== id));
        
      } catch (err: any) {
        console.error(`[Admin] CHYBA PŘI MAZÁNÍ VOZU ${id}:`, err);
        handleFirestoreError(err, OperationType.DELETE, `cars/${id}`);
        
        if (err.message?.includes("insufficient permissions")) {
          alert("CHYBA OPRÁVNĚNÍ: Nemáte právo mazat záznamy v databázi (Firestore rules zamítly akci). Jste přihlášen správným účtem?");
        } else {
          alert("Chyba při mazání vozu: " + err.message);
        }
      } finally {
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  };

  const deleteInquiry = async (id: string) => {
    if (window.confirm('Opravdu chcete smazat tuto poptávku?')) {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      
      try {
        console.log(`[Admin] Pokus o smazání poptávky ID: ${id}`);
        
        if (!auth.currentUser) {
          throw new Error("Uživatel není přihlášen k mazání.");
        }

        const inquiryRef = doc(db, 'inquiries', id);
        await deleteDoc(inquiryRef);
        
        console.log(`[Admin] Poptávka ${id} úspěšně smazána z Firestore`);
        
        // Explicitly update local state
        setInquiries(prev => prev.filter(i => i.id !== id));

      } catch (err: any) {
        console.error(`[Admin] CHYBA PŘI MAZÁNÍ POPTÁVKY ${id}:`, err);
        handleFirestoreError(err, OperationType.DELETE, `inquiries/${id}`);
        
        if (err.message?.includes("insufficient permissions")) {
          alert("CHYBA OPRÁVNĚNÍ: Nemáte právo mazat poptávky.");
        } else {
          alert("Chyba při mazání poptávky: " + err.message);
        }
      } finally {
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  };

  const updateInquiryStatus = async (id: string, status: Inquiry['status']) => {
    await updateDoc(doc(db, 'inquiries', id), { status, updatedAt: serverTimestamp() });
  };

  const updateInquiryNotes = async (id: string, notes: string) => {
    await updateDoc(doc(db, 'inquiries', id), { notes, updatedAt: serverTimestamp() });
  };

  const handleClearAllInquiries = async () => {
    if (window.confirm('OPRAVDU CHCETE SMAZAT VŠECHNY POPTÁVKY? Tato akce je NEVRATNÁ.')) {
      setUploading(true);
      console.log(`[Admin] Hromadné mazání poptávek: ${inquiries.length} položek`);
      try {
        const promises = inquiries.map(inq => {
          console.log(`[Admin] Mažu poptávku: ${inq.id}`);
          return deleteDoc(doc(db, 'inquiries', inq.id));
        });
        await Promise.all(promises);
        console.log("[Admin] Všechny poptávky úspěšně smazány");
        setInquiries([]);
        alert("Všechny poptávky byly smazány.");
      } catch (err: any) {
        console.error("[Admin] CHYBA PŘI HROMADNÉM MAZÁNÍ POPTÁVEK:", err);
        alert("Chyba při mazání: " + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleClearAllCars = async () => {
    if (window.confirm('OPRAVDU CHCETE SMAZAT VŠECHNA AUTA Z NABÍDKY? Tato akce je NEVRATNÁ.')) {
      setUploading(true);
      console.log(`[Admin] Hromadné mazání aut: ${cars.length} položek`);
      try {
        const promises = cars.map(car => {
          console.log(`[Admin] Mažu auto: ${car.id} (${car.name})`);
          return deleteDoc(doc(db, 'cars', car.id));
        });
        await Promise.all(promises);
        console.log("[Admin] Všechna auta úspěšně smazána");
        setCars([]);
        alert("Všechna auta byla smazána.");
      } catch (err: any) {
        console.error("[Admin] CHYBA PŘI HROMADNÉM MAZÁNÍ AUT:", err);
        alert("Chyba při mazání: " + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  // ---- Blog ----
  const startAddPost = () => {
    setEditingPost('new');
    setPostForm({
      title: '', slug: '', excerpt: '', content: '', coverImage: '',
      author: 'AUFIN AUTO', category: 'Rádce', keyword: '', isPublished: true,
      seo: { title: '', description: '' }
    });
  };

  const startEditPost = (post: BlogPost) => {
    setEditingPost(post.id);
    setPostForm(post);
  };

  const handlePostCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { alert("Soubor je příliš velký (max 25 MB)."); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setPostForm(prev => ({ ...prev, coverImage: compressed }));
    } catch {
      alert("Chyba při zpracování obrázku.");
    } finally {
      setUploading(false);
    }
  };

  const savePost = async () => {
    if (!postForm.title || !postForm.slug) {
      alert("Titulek a URL slug jsou povinné.");
      return;
    }
    const data = { ...postForm, slug: generateSlug(postForm.slug), updatedAt: serverTimestamp() };
    const current = editingPost;
    setEditingPost(null);
    try {
      if (current === 'new') {
        await addDoc(collection(db, 'posts'), {
          ...data,
          createdAt: serverTimestamp(),
          isPublished: postForm.isPublished !== false
        });
      } else {
        await updateDoc(doc(db, 'posts', current!), data);
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'posts');
      alert("Chyba při ukládání článku: " + err.message);
      setEditingPost(current);
      setPostForm(postForm);
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Opravdu chcete tento článek smazat? Akce je nevratná.')) return;
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${id}`);
      alert("Chyba při mazání článku: " + err.message);
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
          <p className="text-gold font-bold tracking-[0.2em] text-[10px] uppercase">Ověřování...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-md w-full bg-dark-card p-8 sm:p-10 rounded-3xl border border-white/10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <LayoutDashboard className="w-10 h-10 text-gold" />
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Administrace</h2>
          
          {!user ? (
            <>
              <p className="text-white/50 mb-8 font-light text-sm">Pro přístup k administraci se prosím přihlaste svým Gmail účtem.</p>
              <button 
                onClick={handleLogin}
                className="w-full bg-gold text-black font-extrabold py-4 rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-3 text-sm tracking-widest shadow-lg shadow-gold/20"
              >
                PŘIHLÁSIT SE PŘES GOOGLE
              </button>
              <p className="mt-6 text-white/20 text-[10px] leading-relaxed uppercase tracking-wider">
                Poznámka: Pokud na mobilu tlačítko nereaguje, zkuste aplikaci otevřít přímo v prohlížeči (Chrome/Safari) mimo náhled.
              </p>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
                <p className="text-red-500 text-sm font-bold mb-2 uppercase tracking-widest">Přístup odepřen</p>
                <p className="text-white/70 text-xs leading-relaxed">
                  Jste přihlášen jako:<br/>
                  <span className="text-white font-bold text-base mt-2 block">{user.email}</span>
                </p>
                <p className="text-white/40 text-[10px] mt-4 leading-relaxed italic">
                  Tento účet nemá administrátorská oprávnění. Pokud je to chyba, kontaktujte vývojáře.
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full bg-white/5 text-white/50 hover:bg-white/10 font-bold py-4 rounded-2xl transition-all text-xs tracking-widest border border-white/10"
              >
                ODHLÁSIT SE A ZKUSIT JINÝ ÚČET
              </button>
            </div>
          )}

          <button onClick={onClose} className="mt-8 text-white/30 hover:text-white text-[10px] uppercase tracking-[0.3em] transition-colors font-black">
            ← Zpět na web
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-y-auto">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-gold/5 rounded-2xl flex items-center justify-center border border-gold/10 relative overflow-hidden">
                <svg viewBox="0 0 300 120" className="w-full h-auto p-4">
                  {/* Car silhouette curve */}
                  <path d="M50 45 Q 150 5, 250 45" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
                  {/* AUFIN - A is orange caret */}
                  <g transform="translate(-10, 95)">
                    <path d="M60 0 L85-40 L110 0" fill="none" stroke="#FF6600" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="120" y="0" fill="white" fontSize="60" fontWeight="900" fontFamily="sans-serif">UFIN</text>
                  </g>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white uppercase leading-none">AUFIN <span className="text-gold">AUTO</span></h1>
                <p className="text-[10px] text-white/30 font-bold tracking-[0.4em] uppercase mt-1">Admin Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white/5 px-3 md:px-6 py-2 rounded-2xl border border-white/5 flex-1 md:flex-none">
              <div className="flex flex-col items-start md:items-end flex-1 min-w-0">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest hidden md:block">Přihlášen jako</span>
                <span className="text-[11px] font-bold text-gold truncate max-w-[160px] md:max-w-none">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0"
                title="Odhlásit se"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 md:px-6 py-2.5 rounded-xl bg-white text-black hover:bg-gold transition-all text-xs md:text-sm font-bold shrink-0"
            >
              ZPĚT
            </button>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4 mb-8 md:mb-10 border-b border-white/5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cars')}
            className={`pb-4 px-3 md:px-2 text-xs md:text-sm font-bold tracking-widest uppercase transition-all relative whitespace-nowrap ${activeTab === 'cars' ? 'text-gold' : 'text-white/40 hover:text-white'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <CarIcon className="w-4 h-4" /> <span>Vozidla</span>
            </div>
            {activeTab === 'cars' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-4 px-3 md:px-2 text-xs md:text-sm font-bold tracking-widest uppercase transition-all relative whitespace-nowrap ${activeTab === 'inquiries' ? 'text-gold' : 'text-white/40 hover:text-white'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <MessageSquare className="w-4 h-4" /> <span>Poptávky</span>
            </div>
            {activeTab === 'inquiries' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`pb-4 px-3 md:px-2 text-xs md:text-sm font-bold tracking-widest uppercase transition-all relative whitespace-nowrap ${activeTab === 'blog' ? 'text-gold' : 'text-white/40 hover:text-white'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <Newspaper className="w-4 h-4" /> <span>Blog</span>
            </div>
            {activeTab === 'blog' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
          </button>
        </div>

        {activeTab === 'cars' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Správa fleetu</h2>
              <div className="flex gap-4">
                <button 
                  onClick={handleClearAllCars}
                  disabled={uploading || cars.length === 0}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> SMAZAT VŠECHNO
                </button>
                <button 
                  onClick={startAdd}
                  className="bg-gold text-black px-6 py-4 rounded-2xl font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg shadow-gold/20 text-lg"
                >
                  <Plus className="w-5 h-5" /> NOVÝ VŮZ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map(car => (
                <div key={car.id} className={`bg-dark-card border border-white/5 rounded-3xl overflow-hidden group hover:border-white/20 transition-all flex flex-col ${deletingIds.has(car.id) ? 'opacity-50 grayscale scale-95 pointer-events-none' : ''}`}>
                  <div className="relative aspect-video">
                    <img src={car.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 flex-1">
                    <h3 className="text-xl font-bold mb-1">{car.name}</h3>
                    <p className="text-white/40 text-sm mb-6">{car.brand} • {car.details?.year}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Při převzetí</div>
                        <div className="text-sm font-bold text-gold">{car.pickupPrice?.toLocaleString()} Kč</div>
                      </div>
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Měsíčně</div>
                        <div className="text-sm font-bold text-white">{car.price}</div>
                      </div>
                    </div>

                      <div className="flex items-center gap-2 mt-auto">
                        <div className="flex-1 flex gap-2">
                          <button 
                            onClick={() => startEdit(car)}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl h-12 font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <Edit className="w-4 h-4" /> UPRAVIT
                          </button>
                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, 'cars', car.id), { isVisible: !car.isVisible });
                            }}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${car.isVisible ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                            title={car.isVisible ? 'Viditelné na webu' : 'Skryté na webu'}
                          >
                            {car.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                        <button 
                          onClick={() => deleteCar(car.id)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${deletingIds.has(car.id) ? 'bg-red-500/50 text-white cursor-wait' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                          title="Smazat vůz"
                          disabled={deletingIds.has(car.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Seznam poptávek</h2>
              <button 
                onClick={handleClearAllInquiries}
                disabled={uploading || inquiries.length === 0}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> SMAZAT VŠECHNY POPTÁVKY
              </button>
            </div>
            {inquiries.map(inq => (
              <div key={inq.id} className="bg-dark-card border border-white/5 rounded-3xl p-8 group hover:border-gold/20 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${INQUIRY_STATUS_LABELS[inq.status as keyof typeof INQUIRY_STATUS_LABELS]?.color || 'bg-gray-600'}`}>
                      {INQUIRY_STATUS_LABELS[inq.status as keyof typeof INQUIRY_STATUS_LABELS]?.icon || <HelpCircle />}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-1">{inq.name}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-gold text-xs font-mono">{new Date(inq.createdAt?.seconds * 1000).toLocaleString('cs-CZ')}</span>
                            <span className="text-white/20">•</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-white/40">{INQUIRY_STATUS_LABELS[inq.status as keyof typeof INQUIRY_STATUS_LABELS]?.label || 'Neznámý stav'}</span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select 
                      value={inq.status || 'new'}
                      onChange={(e) => updateInquiryStatus(inq.id, e.target.value as Inquiry['status'])}
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-gold transition-colors"
                    >
                      {Object.entries(INQUIRY_STATUS_LABELS).map(([val, {label}]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                        <a href={`tel:${inq.phone}`} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-gold hover:text-black transition-all border border-white/5">
                            <Phone className="w-5 h-5" />
                        </a>
                        <a href={`mailto:${inq.email}`} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-gold hover:text-black transition-all border border-white/5">
                            <Mail className="w-5 h-5" />
                        </a>
                        <button 
                          onClick={() => deleteInquiry(inq.id)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${deletingIds.has(inq.id) ? 'bg-red-500/50 text-white cursor-wait border-red-500/50' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20'}`}
                          title="Smazat poptávku"
                          disabled={deletingIds.has(inq.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                        <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 flex items-center gap-2">
                            <CarIcon className="w-3 h-3" /> Poptávaný vůz
                        </div>
                        <div className="text-xl font-bold text-white mb-2">{inq.car || 'Nespecifikováno'}</div>
                        <div className="text-white text-lg font-medium leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10 italic">
                          {inq.message ? `"${inq.message}"` : 'Zákazník nezanechal zprávu.'}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 bg-black/40 rounded-2xl p-6 border border-white/5">
                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Email klienta</div>
                            <div className="text-lg font-bold text-gold">{inq.email}</div>
                        </div>
                        <div className="flex-1 bg-black/40 rounded-2xl p-6 border border-white/5">
                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Telefon klienta</div>
                            <div className="text-lg font-bold text-gold">{inq.phone}</div>
                        </div>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col">
                    <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 flex items-center gap-2">
                        <StickyNote className="w-3 h-3" /> Interní poznámky k ujednání
                    </div>
                    <textarea 
                        defaultValue={inq.notes}
                        onBlur={(e) => updateInquiryNotes(inq.id, e.target.value)}
                        placeholder="Napište si poznámku ke klientovi... (např. 'čeká na doložení dokladů')"
                        className="flex-1 bg-transparent border-none outline-none resize-none text-white/70 italic text-sm font-light leading-relaxed min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'blog' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">Blog</h2>
                <p className="text-white/40 text-sm mt-1">Články pro vyhledávače. Dokud nepřidáte vlastní, web zobrazuje 3 startovní články.</p>
              </div>
              <button
                onClick={startAddPost}
                className="bg-gold text-black px-6 py-4 rounded-2xl font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg shadow-gold/20 text-lg"
              >
                <Plus className="w-5 h-5" /> NOVÝ ČLÁNEK
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="bg-dark-card border border-white/5 rounded-3xl p-12 text-center text-white/40">
                Zatím nemáte žádné vlastní články. Web zatím zobrazuje 3 startovní články.
                Klikněte na „Nový článek" a vytvořte první vlastní.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                  <div key={post.id} className={`bg-dark-card border border-white/5 rounded-3xl overflow-hidden flex flex-col ${deletingIds.has(post.id) ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <div className="relative aspect-video bg-black/40">
                      {post.coverImage && <img src={post.coverImage} alt="" className="w-full h-full object-cover" />}
                      <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${post.isPublished !== false ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'}`}>
                        {post.isPublished !== false ? 'Publikováno' : 'Koncept'}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-gold font-bold mb-2">{post.category || 'Rádce'}</span>
                      <h3 className="text-lg font-bold mb-2 leading-snug">{post.title}</h3>
                      <p className="text-white/40 text-xs font-mono mb-4">/blog/{post.slug}</p>
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => startEditPost(post)}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl h-12 font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" /> UPRAVIT
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          title="Smazat článek"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blog Post Edit Modal */}
      <AnimatePresence>
        {editingPost && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingPost(null)}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-12 bg-dark-card border border-white/10 rounded-[40px] z-[120] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 md:p-10 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gold/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Newspaper className="text-gold" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold">{editingPost === 'new' ? 'Nový článek' : 'Úprava článku'}</h2>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Blog editor</p>
                  </div>
                </div>
                <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                  <button onClick={() => setEditingPost(null)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs border border-white/10">ODHODIT</button>
                  <button onClick={savePost} className="flex-1 sm:flex-none px-6 md:px-10 py-2.5 md:py-4 bg-gold text-black rounded-2xl font-bold hover:bg-white transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4 md:w-5 md:h-5" /> <span>ULOŽIT</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-black/20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-6">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 group">
                      {postForm.coverImage ? (
                        <img src={postForm.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10">
                          <ImageIcon className="w-12 h-12 mb-3" />
                          <span className="text-xs uppercase font-bold tracking-widest">Náhledový obrázek</span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handlePostCoverUpload} />
                        <div className="flex flex-col items-center gap-2 text-white">
                          <Upload className="w-8 h-8" />
                          <span className="text-xs font-bold">{uploading ? 'NAHRÁVÁM...' : 'NAHRÁT OBRÁZEK'}</span>
                        </div>
                      </label>
                    </div>
                    <p className="text-white/30 text-xs leading-relaxed">
                      Tip: obrázek lze vložit i jako webovou adresu (URL) přímo do pole níže místo nahrávání souboru.
                    </p>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">URL obrázku (volitelné)</label>
                      <input
                        type="text"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm font-mono"
                        value={postForm.coverImage || ''}
                        placeholder="https://..."
                        onChange={e => setPostForm({ ...postForm, coverImage: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Kategorie</label>
                        <input
                          type="text"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm"
                          value={postForm.category || ''}
                          onChange={e => setPostForm({ ...postForm, category: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Autor</label>
                        <input
                          type="text"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm"
                          value={postForm.author || ''}
                          onChange={e => setPostForm({ ...postForm, author: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setPostForm({ ...postForm, isPublished: !(postForm.isPublished !== false) })}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-xl border transition-all ${postForm.isPublished !== false ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white/50'}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{postForm.isPublished !== false ? 'PUBLIKOVÁNO (VIDITELNÉ)' : 'KONCEPT (SKRYTÉ)'}</span>
                      {postForm.isPublished !== false ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Titulek článku</label>
                      <input
                        type="text"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-gold text-sm font-bold"
                        value={postForm.title || ''}
                        onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">URL slug (aufinauto.cz/blog/...)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm font-mono"
                          value={postForm.slug || ''}
                          placeholder="auto-na-splatky-tipy"
                          onChange={e => setPostForm({ ...postForm, slug: e.target.value })}
                        />
                        <button
                          onClick={() => postForm.title && setPostForm({ ...postForm, slug: generateSlug(postForm.title) })}
                          className="px-4 bg-white/5 hover:bg-gold hover:text-black rounded-xl text-[10px] font-bold transition-all border border-white/10"
                        >
                          GENEROVAT
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Cílové klíčové slovo (jen pro přehled)</label>
                      <input
                        type="text"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm"
                        value={postForm.keyword || ''}
                        placeholder="např. auto na splátky podmínky"
                        onChange={e => setPostForm({ ...postForm, keyword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Perex (krátký popis do výpisu, ~160 znaků)</label>
                      <textarea
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold h-20 resize-none text-sm font-light"
                        value={postForm.excerpt || ''}
                        onChange={e => setPostForm({ ...postForm, excerpt: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Tělo článku</label>
                      <textarea
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-gold h-72 resize-none text-sm font-light leading-relaxed"
                        value={postForm.content || ''}
                        placeholder={'Prázdný řádek = nový odstavec.\nŘádek začínající "## " = podnadpis.\nŘádek začínající "- " = odrážka seznamu.'}
                        onChange={e => setPostForm({ ...postForm, content: e.target.value })}
                      />
                      <p className="text-white/30 text-[11px] leading-relaxed">
                        Formátování: prázdný řádek oddělí odstavce · „## Text" = podnadpis · „- Text" = odrážka.
                      </p>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <label className="text-[10px] uppercase tracking-widest text-gold font-bold ml-1">SEO titulek (volitelné)</label>
                      <input
                        type="text"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm"
                        value={postForm.seo?.title || ''}
                        placeholder="Necháte-li prázdné, použije se titulek článku"
                        onChange={e => setPostForm({ ...postForm, seo: { ...postForm.seo, title: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gold font-bold ml-1">SEO popisek (volitelné)</label>
                      <textarea
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold h-20 resize-none text-sm font-light"
                        value={postForm.seo?.description || ''}
                        placeholder="Necháte-li prázdné, použije se perex"
                        onChange={e => setPostForm({ ...postForm, seo: { ...postForm.seo, description: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Car Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(null)}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-12 bg-dark-card border border-white/10 rounded-[40px] z-[120] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 md:p-10 bg-dark-card border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gold/10 rounded-2xl flex items-center justify-center shrink-0">
                    {isEditing === 'new' ? <Plus className="text-gold" /> : <Edit className="text-gold" />}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold leading-tight">{isEditing === 'new' ? 'Nový vůz' : editForm.name}</h2>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Fleet editor</p>
                  </div>
                </div>
                <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                  <button onClick={() => setIsEditing(null)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs border border-white/10">ODHODIT</button>
                  <button onClick={saveCar} className="flex-1 sm:flex-none px-6 md:px-10 py-2.5 md:py-4 bg-gold text-black rounded-2xl font-bold hover:bg-white transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4 md:w-5 md:h-5" /> <span>ULOŽIT</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-black/20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
                  
                  {/* Left Column: Visuals & Core Settings */}
                  <div className="space-y-4 md:space-y-8">
                    <section className="bg-dark-card p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-white/10">
                        <h3 className="text-gold font-bold tracking-widest text-[10px] uppercase mb-4 md:mb-8 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" /> Vizuály & Galerie
                        </h3>

                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/5 mb-4 md:mb-8 group">
                            {editForm.image ? (
                                <img src={editForm.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10">
                                    <ImageIcon className="w-12 h-12 mb-3" />
                                    <span className="text-xs uppercase font-bold tracking-widest">Nahrát foto</span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'main')} />
                                <div className="flex flex-col items-center gap-2 text-white">
                                    <Upload className="w-8 h-8" />
                                    <span className="text-xs font-bold">{uploading ? 'NAHRÁVÁM...' : 'ZMĚNIT FOTO'}</span>
                                </div>
                            </label>
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-8">
                          {editForm.gallery?.map((url, idx) => (
                             <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group/item">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => setEditForm({ ...editForm, gallery: editForm.gallery?.filter((_, i) => i !== idx) })}
                                  className="absolute inset-0 bg-red-500/80 opacity-0 group-hover/item:opacity-100 active:opacity-100 flex items-center justify-center text-white transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                             </div>
                          ))}
                          <label className="aspect-square rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 hover:border-gold hover:text-gold cursor-pointer transition-all bg-white/5">
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'gallery')} />
                              <Plus className="w-5 h-5" />
                          </label>
                        </div>
                    </section>

                    <section className="bg-dark-card p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-white/10">
                      <h3 className="text-gold font-bold tracking-widest text-[10px] uppercase mb-4 md:mb-8 flex items-center gap-2">
                        <Settings className="w-3 h-3" /> Viditelnost vozu
                      </h3>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Zobrazit vůz na webu?</label>
                        <button
                            onClick={() => setEditForm({...editForm, isVisible: !editForm.isVisible})}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${editForm.isVisible ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider">{editForm.isVisible ? 'VEŘEJNÉ (ZOBRAZENO)' : 'SKRYTÉ (SCHOVÁNO)'}</span>
                            {editForm.isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Details & Desc */}
                  <div className="space-y-4 md:space-y-8">
                    <section className="bg-dark-card p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-white/10">
                      <h3 className="text-gold font-bold tracking-widest text-[10px] uppercase mb-4 md:mb-8 flex items-center gap-2">
                        <Info className="w-3 h-3" /> Základní informace & Ceny
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Název modelu</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm font-bold"
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Výrobce</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm font-bold"
                                value={editForm.brand}
                                onChange={e => setEditForm({...editForm, brand: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2 col-span-1 sm:col-span-2">
                            <label className="text-[10px] uppercase tracking-widest text-gold font-bold ml-1">Platba při převzetí vozu (Kč)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full bg-gold/5 border border-gold/40 rounded-xl px-4 py-3 outline-none focus:border-gold text-gold font-bold text-lg"
                                    value={editForm.pickupPrice || ''}
                                    placeholder="0"
                                    onChange={e => setEditForm({...editForm, pickupPrice: parseInt(e.target.value) || 0})}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 font-bold uppercase tracking-widest text-xs">CZK</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gold font-bold ml-1">Měsíční splátka</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm font-black text-gold"
                                    value={editForm.price}
                                    placeholder="např. 5 500"
                                    onChange={e => setEditForm({...editForm, price: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Cena pro řazení</label>
                            <input
                                type="number"
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm"
                                value={editForm.priceValue || ''}
                                placeholder="0"
                                onChange={e => setEditForm({...editForm, priceValue: parseInt(e.target.value) || 0})}
                            />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                        {Object.keys(editForm.details || {}).map(key => (
                          <div key={key} className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">{key === 'fuel' ? 'Palivo' : key === 'engine' ? 'Motor' : key === 'power' ? 'Výkon' : key === 'transmission' ? 'Převodovka' : key === 'year' ? 'Rok' : key === 'color' ? 'Barva' : key}</label>
                            <input
                              type="text"
                              className="w-full bg-black border border-white/5 rounded-xl px-3 py-2.5 outline-none focus:border-gold text-sm"
                              value={editForm.details?.[key as keyof typeof editForm.details]}
                              onChange={e => setEditForm({
                                ...editForm,
                                details: { ...editForm.details!, [key]: e.target.value }
                              })}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4 pt-4 mt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Marketingový popis</label>
                          <textarea
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold h-28 resize-none text-sm font-light leading-relaxed"
                              value={editForm.description}
                              onChange={e => setEditForm({...editForm, description: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Seznam výbavy</label>
                            <textarea
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold h-28 resize-none text-sm font-light leading-relaxed"
                                value={editForm.equipment}
                                onChange={e => setEditForm({...editForm, equipment: e.target.value})}
                                placeholder="např. ✔ autorádio, ✔ klimatizace..."
                            />
                        </div>
                      </div>
                    </section>

                    <section className="bg-dark-card p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-white/10">
                      <h3 className="text-gold font-bold tracking-widest text-[10px] uppercase mb-4 md:mb-8 flex items-center gap-2">
                        <Shield className="w-3 h-3" /> SEO Optimalizace (Google)
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">URL Slug (autafinauto.cz/auto/...) </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm font-mono"
                              value={editForm.seo?.slug || ''}
                              placeholder="skoda-octavia-2022"
                              onChange={e => setEditForm({
                                ...editForm, 
                                seo: { ...editForm.seo, slug: e.target.value } 
                              })}
                            />
                            <button 
                              onClick={() => {
                                if (editForm.name) {
                                  setEditForm({
                                    ...editForm,
                                    seo: { ...editForm.seo, slug: generateSlug(editForm.name) }
                                  });
                                }
                              }}
                              className="px-4 bg-white/5 hover:bg-gold hover:text-black rounded-xl text-[10px] font-bold transition-all border border-white/10"
                            >
                              GENEROVAT
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">SEO Titulek (Title Tag)</label>
                          <input 
                            type="text" 
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm"
                            value={editForm.seo?.title || ''}
                            placeholder="Např. Škoda Octavia na splátky bez registru | AUFIN AUTO"
                            onChange={e => setEditForm({
                              ...editForm, 
                              seo: { ...editForm.seo, title: e.target.value } 
                            })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">SEO Popisek (Meta Description)</label>
                          <textarea 
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold h-24 resize-none text-sm font-light"
                            value={editForm.seo?.description || ''}
                            placeholder="Zadejte stručný a lákavý popisek pro výsledky vyhledávání..."
                            onChange={e => setEditForm({
                              ...editForm, 
                              seo: { ...editForm.seo, description: e.target.value } 
                            })}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
