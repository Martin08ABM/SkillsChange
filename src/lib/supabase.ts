import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for our database
export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  is_physical: boolean;
  is_online: boolean;
  payment_type: 'paid' | 'barter';
  preferred_payment_method?: 'stripe' | 'paypal';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceInsert {
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  is_physical: boolean;
  is_online: boolean;
  payment_type: 'paid' | 'barter';
  preferred_payment_method?: 'stripe' | 'paypal';
  user_id: string;
}

// Transaction types
export interface Transaction {
  id: string;
  service_id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  commission_amount: number;
  seller_amount: number;
  commission_rate: number;
  currency: string;
  payment_method: 'stripe' | 'paypal';
  payment_id: string; // stripe session_id or paypal order_id
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TransactionInsert {
  service_id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  commission_amount: number;
  seller_amount: number;
  commission_rate: number;
  currency: string;
  payment_method: 'stripe' | 'paypal';
  payment_id: string;
  status: 'pending' | 'completed' | 'cancelled';
}

// Service operations
export const serviceOperations = {
  // Create a new service
  async createService(service: ServiceInsert, jwt?: string): Promise<{ data: Service | null; error: any }> {
    const client = jwt
      ? createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${jwt}` } },
        })
      : supabase;

    return await client
      .from('services')
      .insert([service])
      .select()
      .single();
  },

  // Get all services
  async getAllServices(): Promise<{ data: Service[] | null; error: any }> {
    return await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
  },

  // Get services by user
  async getServicesByUser(userId: string): Promise<{ data: Service[] | null; error: any }> {
    return await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  // Get a single service
  async getService(id: string): Promise<{ data: Service | null; error: any }> {
    return await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
  },

  // Update a service
  async updateService(id: string, updates: Partial<ServiceInsert>, jwt?: string): Promise<{ data: Service | null; error: any }> {
    const client = jwt
      ? createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${jwt}` } },
        })
      : supabase;
    return await client
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Delete a service
  async deleteService(id: string, jwt?: string): Promise<{ error: any }> {
    const client = jwt
      ? createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${jwt}` } },
        })
      : supabase;
    return await client
      .from('services')
      .delete()
      .eq('id', id);
  }
};

// Storage operations
export const storageOperations = {
  async uploadServiceImage(file: File, userId: string, jwt: string): Promise<{ data: { publicUrl: string } | null; error: any }> {
    const client = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await client.storage
      .from('services') // 'services' es el nombre del bucket
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return { data: null, error: uploadError };
    }

    const { data: urlData } = client.storage.from('services').getPublicUrl(filePath);
    return { data: { publicUrl: urlData.publicUrl }, error: null };
  },
};

// Transaction operations
export const transactionOperations = {
  // Create a new transaction
  async createTransaction(transaction: TransactionInsert): Promise<{ data: Transaction | null; error: any }> {
    return await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();
  },

  // Get all transactions
  async getAllTransactions(): Promise<{ data: Transaction[] | null; error: any }> {
    return await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
  },

  // Get transactions by seller
  async getTransactionsBySeller(sellerId: string): Promise<{ data: Transaction[] | null; error: any }> {
    return await supabase
      .from('transactions')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
  },

  // Get transactions by buyer
  async getTransactionsByBuyer(buyerId: string): Promise<{ data: Transaction[] | null; error: any }> {
    return await supabase
      .from('transactions')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });
  },

  // Get a single transaction
  async getTransaction(id: string): Promise<{ data: Transaction | null; error: any }> {
    return await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
  },

  // Update transaction status
  async updateTransactionStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<{ data: Transaction | null; error: any }> {
    return await supabase
      .from('transactions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
  },

  // Get commission earnings (for platform owner)
  async getCommissionEarnings(): Promise<{ data: any[] | null; error: any }> {
    return await supabase
      .from('transactions')
      .select('commission_amount, currency, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
  },

  // Get total commission by currency
  async getTotalCommissionByCurrency(): Promise<{ data: any[] | null; error: any }> {
    return await supabase
      .from('transactions')
      .select('currency, commission_amount.sum()')
      .eq('status', 'completed')
      .group('currency');
  }
};
