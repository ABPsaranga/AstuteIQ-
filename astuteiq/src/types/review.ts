export type ReviewStatus = 'pass' | 'warning' | 'fail'

export interface ReviewCheck {
  id: string
  area: string
  label: string
  status: ReviewStatus
  note: string
}

export interface ReviewResult {
  client_name: string
  adviser_name: string
  practice_name: string
  advice_type: string
  date: string
  summary: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  mode: 'quick' | 'full'
  checks: ReviewCheck[]
}