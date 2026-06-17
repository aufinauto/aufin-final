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
  isVisible?: boolean;
  isComingSoon?: boolean;
  seo?: {
    title?: string;
    description?: string;
    slug?: string;
  };
}

export interface Inquiry {
  id: string;
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
