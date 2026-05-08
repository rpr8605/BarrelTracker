import type { SupabaseClient } from '@supabase/supabase-js'

export async function getNextTIBSerial(
  distilleryId: string,
  year: number,
  supabase: SupabaseClient
): Promise<string> {
  const prefix = `TIB-${year}-`
  const { data } = await supabase
    .from('tib_records')
    .select('serial_number')
    .eq('distillery_id', distilleryId)
    .like('serial_number', `${prefix}%`)
    .order('serial_number', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (data && data.length > 0) {
    const parts = (data[0].serial_number as string).split('-')
    const last = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(last)) nextNum = last + 1
  }
  return `${prefix}${String(nextNum).padStart(4, '0')}`
}
