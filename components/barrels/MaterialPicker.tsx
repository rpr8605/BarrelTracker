'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { MaterialLibraryEntry } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Search, Check, X, ChevronRight, ChevronDown } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'

interface Props {
  category: 'grain' | 'finish'
  selected: string | string[]
  onChange: (val: any) => void
  distilleryId: string | null
  multi?: boolean
}

export function MaterialPicker({ category, selected, onChange, distilleryId, multi = false }: Props) {
  const [materials, setMaterials] = useState<MaterialLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomCustomName] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Fortified Wine': true,
    'Wood': true
  })

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('material_library')
        .select('*')
        .eq('category', category)
        .eq('active', true)
        .order('name')
      
      if (data) setMaterials(data as MaterialLibraryEntry[])
      setLoading(false)
    }
    load()
  }, [category, supabase])

  const filtered = useMemo(() => {
    if (!search) return materials
    return materials.filter(m => 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.parent_group?.toLowerCase().includes(search.toLowerCase())
    )
  }, [materials, search])

  const groups = useMemo(() => {
    const map: Record<string, MaterialLibraryEntry[]> = {}
    filtered.forEach(m => {
      const g = m.parent_group || (m.distillery_id ? 'Custom' : 'Standard')
      if (!map[g]) map[g] = []
      map[g].push(m)
    })
    return map
  }, [filtered])

  async function addCustom() {
    if (!customName || !distilleryId) return
    const normalized = slugify(customName)
    
    // Check if already exists in local list
    if (materials.find(m => m.normalized_name === normalized)) {
      setSearch(customName)
      setShowCustom(false)
      return
    }

    const { data, error } = await supabase.from('material_library').insert({
      distillery_id: distilleryId,
      name: customName,
      normalized_name: normalized,
      category,
      parent_group: 'Custom'
    }).select().single()

    if (data) {
      setMaterials(prev => [...prev, data as MaterialLibraryEntry])
      const val = data.name
      if (multi) {
        onChange([...(Array.isArray(selected) ? selected : []), val])
      } else {
        onChange(val)
      }
      setCustomCustomName('')
      setShowCustom(false)
    }
  }

  const isSelected = (val: string) => {
    if (multi) return (selected as string[]).includes(val)
    return selected === val
  }

  const toggleGroup = (g: string) => {
    setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }))
  }

  if (loading) return <div className="h-10 w-full animate-pulse bg-muted/50 rounded-lg" />

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          className="w-full bg-muted/50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
          placeholder={`Search ${category} options...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="space-y-1">
            <button 
              onClick={() => toggleGroup(group)}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors w-full text-left py-1"
            >
              {expandedGroups[group] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {group}
            </button>
            {expandedGroups[group] && (
              <div className="grid grid-cols-2 gap-1.5">
                {items.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (multi) {
                        const arr = Array.isArray(selected) ? selected : []
                        onChange(arr.includes(m.name) ? arr.filter(x => x !== m.name) : [...arr, m.name])
                      } else {
                        onChange(m.name)
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all border text-left",
                      isSelected(m.name) 
                        ? "bg-primary text-white border-primary" 
                        : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-transparent hover:border-primary/30"
                    )}
                  >
                    <span className="truncate">{m.name}</span>
                    {isSelected(m.name) && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full py-2 border-2 border-dashed border-muted-foreground/20 rounded-lg text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Custom {category}
          </button>
        ) : (
          <Card className="p-3 border-primary/50 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">New Custom {category}</p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Mustard, STR Wine..."
                value={customName}
                onChange={(e) => setCustomCustomName(e.target.value)}
                autoFocus
                className="flex-1"
              />
              <Button size="sm" onClick={addCustom} disabled={!customName}>Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCustom(false)}><X size={16} /></Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Saved to your company library.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
