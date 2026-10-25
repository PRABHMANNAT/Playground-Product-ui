import { z } from 'zod';
export const safeUrl = z.string().max(2000).refine(v => { if (!v)
    return true; try {
    const u = new URL(v);
    return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password;
}
catch {
    return false;
} }, 'Use a valid HTTP or HTTPS URL');
export const projectInput = z.object({ name: z.string().trim().min(3).max(100), description: z.string().trim().min(20).max(5000), audience: z.string().trim().min(3).max(300), sector: z.enum(['SaaS', 'Fintech', 'Consumer', 'Healthcare', 'Commerce', 'Other']), url: safeUrl.default(''), stage: z.enum(['Idea', 'Prototype', 'Live product']).default('Idea'), consent: z.boolean().default(false) });
export const evidenceInput = z.object({ project: z.string().uuid(), kind: z.enum(['Fact', 'Hypothesis', 'Unknown']), claim: z.string().trim().min(8).max(3000), source: safeUrl.default(''), sourceTitle: z.string().max(200).default('') }).refine(v => v.kind !== 'Fact' || !!v.source, 'Facts need a source URL. Use Hypothesis for unsourced assumptions.');
export const experimentInput = z.object({ project: z.string().uuid(), title: z.string().trim().min(3).max(160), hypothesis: z.string().trim().min(8).max(2000), method: z.string().trim().min(8).max(3000), metric: z.string().trim().min(3).max(300), threshold: z.string().trim().min(3).max(300) });
export const missionInput = z.object({ project: z.string().uuid(), domain: z.string().min(3).max(100), question: z.string().trim().min(20).max(3000), audience: z.string().trim().min(3).max(500), budget: z.number().int().min(50).max(100000) });
export function templates(p: {
    name: string;
    audience: string;
    description: string;
}) {
    return [
        { title: 'Problem interviews', hypothesis: `${p.audience} experience the problem ${p.name} aims to solve frequently enough to seek a solution.`, method: 'Recruit 5 relevant participants. Ask about the last time the problem occurred, their current workaround, and its cost. Avoid pitching. Record consented notes and contradictory evidence.', metric: 'Participants describing a recent, costly instance', threshold: 'At least 3 of 5 describe the problem unprompted; directional evidence only' },
        { title: 'Willingness-to-pay test', hypothesis: `${p.audience} will make a meaningful commitment to use ${p.name}.`, method: 'Offer a clearly scoped paid concierge pilot to 10 qualified prospects. Explain exactly what exists. Track outreach, responses, offers, objections, and payments. Do not collect money for unavailable services.', metric: 'Paid pilots / qualified offers', threshold: 'At least 2 paid pilots from 10 qualified offers; revise with segment context' },
        { title: 'First-value usability test', hypothesis: `A new target user can understand ${p.name} and complete its primary task without assistance.`, method: 'Give 5 relevant participants a working prototype and a realistic task. Observe completion, confusion, errors, trust concerns, and keyboard accessibility. Record observations separately from interpretations.', metric: 'Unassisted task completion and critical blockers', threshold: '4 of 5 complete the core task; zero unresolved critical blockers' },
    ];
}
