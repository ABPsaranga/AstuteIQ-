import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, } from 'docx';
import { saveAs } from 'file-saver';
/* ================= HELPERS ================= */
function statusColor(status) {
    if (status === 'PASS')
        return '2ecc71';
    if (status === 'WARN')
        return 'f1c40f';
    return 'e74c3c';
}
function statusLabel(status) {
    if (status === 'PASS')
        return 'Compliant';
    if (status === 'WARN')
        return 'Partially Compliant';
    return 'Non-Compliant';
}
function calculateRisk(findings) {
    const fail = findings.filter((f) => f.status === 'FAIL').length;
    const warn = findings.filter((f) => f.status === 'WARN').length;
    if (fail > 2)
        return 'HIGH';
    if (fail > 0 || warn > 2)
        return 'MEDIUM';
    return 'LOW';
}
function countStatuses(findings) {
    return {
        pass: findings.filter((f) => f.status === 'PASS').length,
        warn: findings.filter((f) => f.status === 'WARN').length,
        fail: findings.filter((f) => f.status === 'FAIL').length,
        na: 0,
    };
}
function getRiskLevel(report) {
    return report.riskLevel || calculateRisk(report.findings);
}
function getDocumentsReviewed(report) {
    return report.documentsReviewed && report.documentsReviewed.length > 0
        ? report.documentsReviewed
        : [report.clientName];
}
function buildOverallAssessment(findings) {
    const passCount = findings.filter((f) => f.status === 'PASS').length;
    const warnCount = findings.filter((f) => f.status === 'WARN').length;
    const failCount = findings.filter((f) => f.status === 'FAIL').length;
    const items = [
        {
            label: 'CONSISTENCY',
            text: `Reviews document consistency across recommendations and disclosures. ${passCount >= warnCount ? 'Consistent controls are in place' : 'Some sections require alignment with client needs and disclosures.'}`,
        },
        {
            label: 'STRUCTURE',
            text: `Evaluates the report layout and logical flow. ${failCount === 0 ? 'Structure is generally sound.' : 'There are structural weaknesses in failed sections.'}`,
        },
        {
            label: 'PERSONALISATION',
            text: `Assesses client-specific content and tailoring. ${warnCount === 0 ? 'Personalisation is strong.' : 'Some areas may not be sufficiently tailored to the client.'}`,
        },
        {
            label: 'COMPLIANCE',
            text: `Assesses compliance against regulatory obligations. ${failCount > 0 ? 'There are compliance failures that require remediation.' : 'Most compliance checks are satisfactory with only warnings.'}`,
        },
    ];
    return items.flatMap((item) => [
        new Paragraph({
            text: item.label,
            heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: item.text }),
    ]);
}
function buildReviewerFeedback(findings) {
    const flagged = findings.filter((f) => f.status !== 'PASS');
    if (flagged.length === 0)
        return [];
    return [
        new Paragraph({
            text: 'Reviewer feedback summary',
            heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
            text: `The review identified ${flagged.length} flagged checks. Findings require human verification and remediation before the report is finalised.`,
        }),
    ];
}
/* ================= EXPORT ================= */
export async function exportDocx(report) {
    const riskLevel = getRiskLevel(report);
    const counts = countStatuses(report.findings);
    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        text: 'Statement of Advice Compliance Audit Report',
                        heading: HeadingLevel.TITLE,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Prepared in accordance with ASIC RG175 and Corporations Act s961B',
                                italics: true,
                            }),
                        ],
                    }),
                    new Paragraph({ text: '' }),
                    buildCoverTable(report, riskLevel),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Score summary',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    buildScoreSummary(counts),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Overall assessment',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    ...buildOverallAssessment(report.findings),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'AI disclaimer',
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: 'This report is generated by AI and requires human verification before any advice is issued. Confirm all findings and conclusions against the original source documents.',
                    }),
                    new Paragraph({ text: '' }),
                    ...buildReviewerFeedback(report.findings),
                    report.findings.some((f) => f.status !== 'PASS')
                        ? new Paragraph({ text: '' })
                        : new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Detailed findings',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    ...buildSections(report.findings),
                ].flat(),
            },
        ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `ASIC_Compliance_Report_${Date.now()}.docx`);
}
function buildCoverTable(report, riskLevel) {
    const rows = [
        ['Client name', report.clientName],
        ['Adviser', report.adviser],
        ['Practice', report.practice ?? 'N/A'],
        ['Advice type', report.adviceType ?? 'N/A'],
        ['Date', report.date],
        ['Risk level', riskLevel],
        ['Documents reviewed', getDocumentsReviewed(report).join(', ')],
    ];
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map(([label, value]) => new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: label, bold: true })],
                        }),
                    ],
                    shading: { fill: 'f3f4f6' },
                }),
                new TableCell({
                    children: [new Paragraph(value)],
                }),
            ],
        })),
    });
}
function buildScoreSummary(counts) {
    const items = [
        { label: 'PASS', value: counts.pass, color: '2ecc71' },
        { label: 'WARNING', value: counts.warn, color: 'f1c40f' },
        { label: 'FAIL', value: counts.fail, color: 'e74c3c' },
        { label: 'N/A', value: counts.na, color: '6b7280' },
    ];
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: items.map((item) => new TableCell({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: item.value.toString(), bold: true, size: 28 }),
                                new TextRun({ text: `\n${item.label}`, break: 1 }),
                            ],
                        }),
                    ],
                    shading: { fill: item.color },
                })),
            }),
        ],
    });
}
/* ================= SECTION BUILDER ================= */
/* ================= SECTION BUILDER ================= */
function buildSections(findings) {
    const grouped = findings.reduce((acc, f) => {
        if (!acc[f.section])
            acc[f.section] = [];
        acc[f.section].push(f);
        return acc;
    }, {});
    return Object.keys(grouped).flatMap((section) => [
        new Paragraph({
            text: section,
            heading: HeadingLevel.HEADING_2,
        }),
        createTable(grouped[section]),
    ]);
}
/* ================= TABLE ================= */
function createTable(findings) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    headerCell('Check'),
                    headerCell('Status'),
                    headerCell('Issue'),
                    headerCell('Recommendation'),
                ],
            }),
            ...findings.map(f => new TableRow({
                children: [
                    cell(f.title),
                    statusCell(f.status),
                    cell(f.issue),
                    cell(f.recommendation),
                ],
            })),
        ],
    });
}
/* ================= CELLS ================= */
function headerCell(text) {
    return new TableCell({
        children: [
            new Paragraph({
                children: [new TextRun({ text, bold: true })],
            }),
        ],
        borders: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        },
    });
}
function cell(text) {
    return new TableCell({
        children: [new Paragraph(text)],
    });
}
function statusCell(status) {
    return new TableCell({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: statusLabel(status),
                        bold: true,
                        color: 'ffffff',
                    }),
                ],
            }),
        ],
        shading: {
            fill: statusColor(status),
        },
    });
}
