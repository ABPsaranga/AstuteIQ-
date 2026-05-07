export function mapReviewToDocx(review) {
    return {
        clientName: review.clientName || 'Unknown Client',
        adviser: review.adviser || 'Unknown Adviser',
        reviewer: 'AI Compliance Engine',
        date: new Date(review.createdAt).toLocaleDateString(),
        findings: review.checks.map((c) => ({
            section: c.section || 'General Compliance',
            title: c.name,
            status: c.status,
            issue: c.status === 'PASS' ? 'No issue identified' : c.message,
            recommendation: c.status === 'PASS'
                ? 'No action required'
                : 'Review and update this section to meet compliance standards',
        })),
    };
}
