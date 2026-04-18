export async function explainIssue(issue: any) {
  const res = await fetch("http://localhost:8000/api/explain", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
    }),
  })

  return res.json()
}