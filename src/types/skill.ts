export type SkillStatus = 'public' | 'personal' | 'experiment'

export interface SkillEntry {
  id: string
  name: string
  description: string
  category: string
  status: SkillStatus
  url?: string
}
