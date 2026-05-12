export function mapReviewToDocx(review) {
    return {
        clientName: review.fileName || 'Unknown Client',
        adviser: review.userId || 'Unknown Adviser',
        reviewer: 'AI Compliance Engine',
        date: review.completedAt
            ? new Date(review.completedAt).toLocaleDateString()
            : new Date(review.createdAt).toLocaleDateString(),
        documentsReviewed: review.fileName ? [review.fileName] : [],
        riskLevel: review.status === 'complete' ? 'LOW' : 'MEDIUM',
        findings: (review.findings || []).map((f) => ({
            section: f.category || 'General',
            title: f.title || f.checkId || 'Review item',
            status: f.status === 'PASS' ? 'PASS' : f.status === 'FAIL' ? 'FAIL' : 'WARN',
            issue: f.message || 'No issue identified',
            recommendation: f.status === 'PASS'
                ? 'No action required'
                : 'Review and update this section to meet compliance standards',
        })),
    };
}
