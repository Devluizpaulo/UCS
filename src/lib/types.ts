
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserRecord } from 'firebase-admin/auth';

// Defines the structure for a single commodity configuration
export interface CommodityConfig {
    id: string;
    name: string;
    currency: 'USD' | 'BRL' | 'EUR';
    category: 'exchange' | 'vus' | 'vmad' | 'crs' | 'index' | 'sub-index' | 'agricultural' | 'material';
    description: string;
    unit: string;
    sourceUrl?: string;
}

// Defines the structure for commodity data to be displayed
export interface CommodityPriceData extends CommodityConfig {
    price: number;
    change: number;
    absoluteChange: number;
    lastUpdated: string;
}

// Defines the structure for a historical quote from Firestore
export interface FirestoreQuote {
    id: string;
    data: string; 
    ultimo: number;
    valor?: number;
    timestamp: number | string;
    variacao_pct: number | null;
    [key: string]: any;
}

// Defines the structure for data points used in charts
export interface ChartData {
    time: string;
    value: number;
}

// Extends FirebaseUser to potentially include app-specific roles or data
export interface AppUser extends FirebaseUser {
  isAdmin?: boolean;
}

// Extends the server-side UserRecord to include our custom isAdmin flag
export interface AppUserRecord extends UserRecord {
    isAdmin: boolean;
}
