import { supabase } from "../utils/supabase"

export async function getDashboardStats() {
  const { data, error } = await supabase
    .from("reviews")
    .select("risk_level, created_at")

  if (error) throw error

  const total = data.length

  const high = data.filter(r => r.risk_level === "high").length
  const medium = data.filter(r => r.risk_level === "medium").length
  const low = data.filter(r => r.risk_level === "low").length

  // monthly trend
  const monthly: Record<string, number> = {}

  data.forEach(r => {
    const month = new Date(r.created_at).toLocaleString("default", {
      month: "short",
    })

    monthly[month] = (monthly[month] || 0) + 1
  })

  return {
    total,
    distribution: { high, medium, low },
    monthly,
  }
}