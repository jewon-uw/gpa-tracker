// src/lib/gpa-scale.ts

export type GPAScaleBand = { minPct: number; maxPct: number; gpa: number; label?: string };
export type GPAScale = { id: string; name: string; bands: GPAScaleBand[] };

// Your mapping (inclusive ranges)
export const YOUR_4_0_SCALE: GPAScale = {
    id: 'YOUR_4_0_SCALE',
    name: 'Per-course 4.0 (your bands)',
    bands: [
        { minPct: 90, maxPct: 100, gpa: 4.0, label: 'A+' },
        { minPct: 85, maxPct: 89, gpa: 3.9, label: 'A' },
        { minPct: 80, maxPct: 84, gpa: 3.7, label: 'A-' },
        { minPct: 77, maxPct: 79, gpa: 3.3, label: 'B+' },
        { minPct: 73, maxPct: 76, gpa: 3.0, label: 'B' },
        { minPct: 70, maxPct: 72, gpa: 2.7, label: 'B-' },
        { minPct: 67, maxPct: 69, gpa: 2.3, label: 'C+' },
        { minPct: 63, maxPct: 66, gpa: 2.0, label: 'C' },
        { minPct: 60, maxPct: 62, gpa: 1.7, label: 'C-' },
        { minPct: 57, maxPct: 59, gpa: 1.3, label: 'D+' },
        { minPct: 53, maxPct: 56, gpa: 1.0, label: 'D' },
        { minPct: 50, maxPct: 52, gpa: 0.7, label: 'D-' },
        { minPct: 0, maxPct: 49, gpa: 0.0, label: 'E/F' },
    ],
};

// Convert a percent to GPA points using inclusive band edges
export function pctToGpa(pct: number, scale: GPAScale = YOUR_4_0_SCALE) {
    if (Number.isNaN(pct)) return null;
    // clamp just in case
    const p = Math.max(0, Math.min(100, pct));
    const band = scale.bands.find(b => p >= b.minPct && p <= b.maxPct);
    return band ? band.gpa : null;
}

// Average of per-course GPAs (simple mean, NOT credit-weighted)
export function averageCourseGPA(
    courses: { percent?: number | null }[],
    scale: GPAScale = YOUR_4_0_SCALE
) {
    const gpas: number[] = [];
    for (const c of courses) {
        if (c.percent == null) continue;
        const g = pctToGpa(c.percent, scale);
        if (g != null) gpas.push(g);
    }
    if (gpas.length === 0) return null;
    const sum = gpas.reduce((a, b) => a + b, 0);
    return sum / gpas.length;
}
