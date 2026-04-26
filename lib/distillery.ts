// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMyDistilleryId(supabase: any, userId: string, preferredId?: string | null): Promise<string | null> {
  // If a preferred distillery is provided, verify access then use it
  if (preferredId) {
    // Check ownership
    const { data: owned } = await supabase.from('distilleries').select('id').eq('id', preferredId).eq('owner_id', userId).single()
    if (owned) return preferredId
    // Check role
    const { data: role } = await supabase.from('user_roles').select('distillery_id').eq('user_id', userId).eq('distillery_id', preferredId).single()
    if (role) return preferredId
    // Preferred not accessible — fall through to default
  }

  // Default: first owned distillery
  const { data: owned } = await supabase.from('distilleries').select('id').eq('owner_id', userId).limit(1).single()
  if (owned) return owned.id

  // Fall back to first role
  const { data: role } = await supabase.from('user_roles').select('distillery_id').eq('user_id', userId).limit(1).single()
  return role?.distillery_id ?? null
}
