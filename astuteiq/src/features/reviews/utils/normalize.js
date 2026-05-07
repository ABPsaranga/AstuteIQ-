// ─── Transform raw API shape → UI-ready shape ─────────────────────────────────
export function normalizeReview(raw) {
    return {
        ...raw,
        // Ensure findings always have defaults
        findings: (raw.findings ?? []).map(normalizeFinding),
        overrides: raw.overrides ?? [],
    };
}
function normalizeFinding(raw) {
    return {
        ...raw,
        confidence: Math.min(100, Math.max(0, raw.confidence ?? 0)),
        pages: raw.pages ?? [],
        excerpt: raw.excerpt ?? '',
    };
}
// ─── Compute summary counts from findings ─────────────────────────────────────
export function summariseFindings(findings) {
    return findings.reduce((acc, f) => {
        acc.total++;
        if (f.status === 'PASS')
            acc.pass++;
        if (f.status === 'FAIL')
            acc.fail++;
        if (f.status === 'WARNING')
            acc.warning++;
        if (f.status === 'NA')
            acc.na++;
        return acc;
    }, { total: 0, pass: 0, fail: 0, warning: 0, na: 0 });
}
// ─── Mock data generators (used when backend unavailable) ─────────────────────
const CHECKS = [
    {
        title: 'Risk profile documented',
        category: 'Risk Profile',
        messages: {
            PASS: 'Client risk profile is clearly documented and consistent with recommended strategy.',
            FAIL: 'No risk profile questionnaire found in document.',
            WARNING: 'Risk profile present but dated more than 2 years ago.',
        },
    },
    {
        title: 'Fee disclosure complete',
        category: 'Fees & Costs',
        messages: {
            PASS: 'All fees disclosed clearly in the SOA with dollar amounts.',
            FAIL: 'Ongoing service fees not disclosed in dollar terms as required.',
            WARNING: 'Fee disclosure present but missing estimated ongoing advice fee.',
        },
    },
    {
        title: 'Best interests duty addressed',
        category: 'Best Interests Duty',
        messages: {
            PASS: 'Best interests duty clearly addressed with supporting rationale.',
            FAIL: 'No statement of best interests duty compliance found.',
            WARNING: 'Best interests statement present but lacks specificity to client circumstances.',
        },
    },
    {
        title: 'Client objectives captured',
        category: 'Client Objectives',
        messages: {
            PASS: 'Client objectives are specific, measurable and addressed in recommendations.',
            FAIL: 'Client goals section is missing or too vague.',
            WARNING: 'Objectives mentioned but not clearly linked to strategy recommendations.',
        },
    },
    {
        title: 'Replacement product comparison',
        category: 'Replacement Product',
        messages: {
            PASS: 'Replacement product analysis includes feature-by-feature comparison.',
            FAIL: 'Replacement product advice lacks comparative analysis as required by law.',
            NA: 'No replacement product advice in this document.',
        },
    },
    {
        title: 'Scope of advice defined',
        category: 'Scope of Advice',
        messages: {
            PASS: 'Scope of advice clearly defined and consistent with recommendations.',
            WARNING: 'Scope defined but recommendations appear to extend beyond stated scope.',
        },
    },
    {
        title: 'Insurance needs analysis',
        category: 'Insurance Adequacy',
        messages: {
            PASS: 'Insurance needs analysis complete with calculations provided.',
            FAIL: 'Insurance recommendations made without supporting needs analysis.',
            NA: 'Insurance not within scope of this advice.',
        },
    },
    {
        title: 'Projection assumptions disclosed',
        category: 'Projections & Modelling',
        messages: {
            PASS: 'All projection assumptions disclosed including growth rates and inflation.',
            FAIL: 'Projections presented without disclosing underlying assumptions.',
            WARNING: 'Assumptions disclosed but growth rates appear inconsistent with conservative profile.',
        },
    },
];
function weightedStatus() {
    const r = Math.random();
    if (r < 0.55)
        return 'PASS';
    if (r < 0.75)
        return 'FAIL';
    if (r < 0.90)
        return 'WARNING';
    return 'NA';
}
export function generateMockReview(mode, id) {
    const reviewId = id ?? `rev_${Date.now()}`;
    const findings = CHECKS.map((c, i) => {
        const status = weightedStatus();
        const message = c.messages[status] ?? c.messages['PASS'] ?? 'Review complete.';
        return {
            checkId: `chk_${i + 1}`,
            category: c.category,
            title: c.title,
            status,
            confidence: Math.floor(60 + Math.random() * 40),
            message,
            pages: [Math.ceil(Math.random() * 8), Math.ceil(Math.random() * 8 + 8)],
            excerpt: status !== 'NA' ? `...relevant excerpt from page ${Math.ceil(Math.random() * 10)}...` : undefined,
            section: c.category,
        };
    });
    const pass = findings.filter((f) => f.status === 'PASS').length;
    const total = findings.filter((f) => f.status !== 'NA').length;
    const score = total > 0 ? Math.round((pass / total) * 100) : 0;
    return {
        id: reviewId,
        userId: 'usr_002',
        fileName: 'SOA_Client_Example.pdf',
        fileSize: 824320,
        mode,
        status: 'complete',
        score,
        findings,
        overrides: [],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date().toISOString(),
    };
}
export function generateMockHistory(page, limit) {
    const fileNames = [
        'SOA_Johnson_2024.pdf',
        'SOA_Williams_Annual_Review.pdf',
        'SOA_Chen_Super_Advice.pdf',
        'SOA_OBrien_Insurance.pdf',
        'SOA_Patel_Retirement.pdf',
        'SOA_Garcia_Initial_Advice.pdf',
        'SOA_Kim_Estate_Planning.pdf',
        'SOA_Taylor_Gearing_Strategy.pdf',
    ];
    const reviews = fileNames.slice(0, limit).map((name, i) => {
        const score = 60 + Math.floor(Math.random() * 40);
        return {
            id: `rev_hist_${page}_${i}`,
            userId: 'usr_002',
            fileName: name,
            fileSize: 400000 + Math.floor(Math.random() * 600000),
            mode: i % 3 === 0 ? 'quick' : 'full',
            status: 'complete',
            score,
            findings: [],
            overrides: [],
            createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
            completedAt: new Date(Date.now() - i * 86400000 * 2 + 60000).toISOString(),
        };
    });
    return { reviews, total: 24, page, limit };
}
