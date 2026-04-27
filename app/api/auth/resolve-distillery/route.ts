import { createClient } from '@supabase/supabase-js'
import { ENVIRONMENTS } from '@/lib/environments'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const { environmentId } = await req.json()
  const env = ENVIRONMENTS.find((e) => e.id === environmentId)
  if (!env?.distilleryName) return Response.json({ distilleryId: null })

  const { data } = await admin
    .from('distilleries')
    .select('id')
    .eq('name', env.distilleryName)
    .single()

  return Response.json({ distilleryId: data?.id ?? null })
}
