import { createClient } from '@supabase/supabase-js'

import { config } from './config'

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)

// const supabaseUrl = 'https://gfqwkjbpumlhljkcpqsy.supabase.co'
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmcXdramJwdW1saGxqa2NwcXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MzA2MDYsImV4cCI6MjA5NjAwNjYwNn0.fgGgwBkOW2Lo2mZsA4rhVolG9Hpb7LOvzBtz8CaH-40'

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)



// Fetch all products
export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }
    return data
}

// Fetch fashion products only
export async function getFashionProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('category', 'like', 'Art%')
        .eq('in_stock', true)

    if (error) {
        console.error('Error fetching fashion products:', error)
        return []
    }
    return data
}

// Fetch artworks only
export async function getArtworks() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .like('category', 'Art%')
        .eq('in_stock', true)

    if (error) {
        console.error('Error fetching artworks:', error)
        return []
    }
    return data
}


// Auth functions
export async function signUp(email: string, password: string, role: string = 'customer') {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { role }
        }
    })
    if (error) throw error
    return data
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if (error) throw error
    return data
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}


export interface UserProfile {
    id: string;
    email: string;
    role: 'customer' | 'admin' | 'founder';
    name?: string;
    fullName?: string;
    createdAt: string;
}


// Check if Supabase is configured
export const isSupabaseConfigured = !!(
  config.supabaseUrl && 
  config.supabaseAnonKey && 
  config.supabaseUrl !== '' && 
  config.supabaseAnonKey !== ''
)

// Mock auth functions for development without Supabase
// MockAuth for sandbox mode
const MOCK_USERS_KEY = 'sadaf_mock_users'
const MOCK_CURRENT_KEY = 'sadaf_mock_current'

const defaultUsers: UserProfile[] = [
  { id: 'usr-1', email: 'customer@sadaf.luxury', role: 'customer', fullName: 'Customer Layla', createdAt: new Date().toISOString() },
  { id: 'usr-2', email: 'admin@sadaf.luxury', role: 'admin', fullName: 'Admin Amir', createdAt: new Date().toISOString() },
  { id: 'usr-3', email: 'founder@sadaf.luxury', role: 'founder', fullName: 'Founder Yasmine', createdAt: new Date().toISOString() },
]

export const mockAuth = {
  getUsers: (): UserProfile[] => {
    try {
      const stored = localStorage.getItem(MOCK_USERS_KEY)
      return stored ? JSON.parse(stored) : defaultUsers
    } catch { return defaultUsers }
  },
  saveUsers: (users: UserProfile[]) => {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
  },
  setCurrentUser: (user: UserProfile) => {
    localStorage.setItem(MOCK_CURRENT_KEY, JSON.stringify(user))
  },
  getCurrentUser: (): UserProfile | null => {
    try {
      const stored = localStorage.getItem(MOCK_CURRENT_KEY)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  },
  clearCurrentUser: () => {
    localStorage.removeItem(MOCK_CURRENT_KEY)
  }
}