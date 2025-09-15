export type Piece = { weightPct: number; scorePct?: number | null };

export function courseStats(pieces: Piece[], bonusPct = 0) {
    const done = pieces.filter(p => p.scorePct != null);
    const W = done.reduce((s, p) => s + p.weightPct, 0);                     // weight completed
    const S = done.reduce((s, p) => s + p.weightPct * (p.scorePct! / 100), 0); // percent-points earned
    const min = Math.min(S + bonusPct, 110);
    const current = W > 0 ? Math.min(((S + bonusPct) / W) * 100, 110) : null;
    const max = Math.min(S + (100 - W) + bonusPct, 110);
    return { min, current, max, W, S };
}