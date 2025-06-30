import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: "manager" | "startup"
  created_at: string
  updated_at: string
}

export interface Startup {
  id: string
  name: string
  founder_name: string | null
  email: string
  logo_url: string | null
  contract_status: "Pending" | "Sent" | "Signed"
  total_credits: number
  used_credits: number
  user_id: string | null
  created_by: string | null
  status: "active" | "inactive"
  marketplace_access: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  packages?: Package[]
}

export interface Package {
  id: string
  service_id: string
  name: string
  description: string | null
  price: number
  hours: number
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  startup_id: string
  meeting_date: string
  meeting_time?: string | null
  farah_notes: string | null
  guest_notes: string | null
  created_at: string
  updated_at: string
}

export interface StartupService {
  id: string
  startup_id: string
  package_id: string
  hours_used: number
  selected_at: string
  package?: Package
}
