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