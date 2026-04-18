type Issue = {
  severity: "low" | "medium" | "high"
  confidence: number
}

// Weighted scoring
export function calculateComplianceScore(issues: Issue[]) {
  if (!issues.length) return 100

  let penalty = 0

  issues.forEach((issue) => {
    const weight =
      issue.severity === "high"
        ? 25
        : issue.severity === "medium"
        ? 10
        : 5

    penalty += weight * (issue.confidence / 100)
  })

  const score = Math.max(0, 100 - penalty)

  return Math.round(score)
}

// Breakdown counts
export function getSeverityBreakdown(issues: Issue[]) {
  return {
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  }
}