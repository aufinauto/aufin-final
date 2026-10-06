export interface Car {
  id: string;
  name: string;
  brand: string;
  pickupPrice: number;
  priceValue: number; // monthly indicator for filters
  price: string; // display string
  image: string; // URL
  description: string;
  details: {
    fuel: string;
    engine: string;
    power: string;
    transmission: string;
    year: string;
    color: string;
  };
  equipment: string;
  gallery: string[];
  /** ID fotek v kolekci vehiclePhotos (první = hlavní); nahrazuje image/gallery s fotkami v dokumentu. */
  photoIds?: string[];
  /** Délka nájmu v měsících – bez ní se celková částka nezobrazuje. */
  termMonths?: number;
  /** Závěrečná odkupní platba (Kč), pokud ji smlouva má. */
  buyoutPrice?: number;
  isVisible?: boolean;
  isComingSoon?: boolean;
  seo?: {
    title?: string;
    description?: string;
    slug?: string;
  };
}

/** Vůz na prodej za plnou cenu (hotově / převodem) – samostatný sklad, kolekce `saleCars`. */
export interface SaleCar {
  id: string;
  name: string;
  brand: string;
  price: number; // celková kupní cena v Kč
  image: string;
  gallery: string[];
  /** ID fotek v kolekci vehiclePhotos (první = hlavní). */
  photoIds?: string[];
  description: string;
  /** Výbava; řádky „Kategorie: položka, položka“ se na webu zobrazí jako tabulka. */
  equipment?: string;
  /** Odkaz na inzerát na Sauto.cz – z něj se v administraci načítá výbava. */
  sautoUrl?: string;
  details: {
    year: string;
    mileage: string;
    fuel: string;
    engine: string;
    power: string;
    transmission: string;
    color: string;
    /** Karoserie (hatchback, kombi, sedan…). */
    body?: string;
  };
  isVisible?: boolean;
  isSold?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type InquiryType = 'installment' | 'cash' | 'buyout' | 'contact';

export interface Inquiry {
  id: string;
  /** Chybí u starších poptávek = splátky. */
  type?: InquiryType;
  details?: Record<string, string>;
  /** Starší poptávky: fotky přímo v dokumentu. Nové: počet fotek v kolekci inquiryPhotos. */
  photos?: string[];
  photoCount?: number;
  name: string;
  email: string;
  phone: string;
  car: string;
  message: string;
  status: 'new' | 'contacted' | 'negotiating' | 'done' | 'cancelled';
  notes?: string;
  createdAt: any;
}

export interface UserRole {
  email: string;
  role: 'admin' | 'editor';
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;        // krátký perex do výpisu (max ~160 znaků)
  content: string;        // tělo článku; "## " = podnadpis, prázdný řádek = nový odstavec
  coverImage: string;     // URL nebo base64 náhledového obrázku
  author: string;
  category?: string;
  keyword?: string;       // hlavní cílové klíčové slovo (pro přehled)
  isPublished?: boolean;
  seo?: {
    title?: string;
    description?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}
