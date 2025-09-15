'use client';
import { useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export default function CourseBox({
    course,
    onReload,
}: {
    course: Schema['Course']['type'];
    onReload: () => void;
}) {
    const [showGrades, setShowGrades] = useState(false);
    const [assessments, setAssessments] = useState<Schema['Assessment']['type'][]>([]);

    async function loadAssessments() {
        const { data } = await client.models.Assessment.list({
            filter: { courseId: { eq: course.id } },
        });
        setAssessments(data.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    }

    async function handleDelete() {
        if (!confirm('Delete this course and all its assessments?')) return;

        // 1) delete assessments
        const { data: toDelete } = await client.models.Assessment.list({
            filter: { courseId: { eq: course.id } },
        });
        for (const a of toDelete) {
            if (a.id) await client.models.Assessment.delete({ id: a.id });
        }

        // 2) delete course
        await client.models.Course.delete({ id: course.id! });
        onReload();
    }

    function toggleGrades() {
        if (!showGrades) loadAssessments();
        setShowGrades(!showGrades);
    }

    // ---- grade entry helpers (commit on blur) ----
    function sanitizeScore(raw: string): number | null {
        const t = raw.trim();
        if (t === '') return null;
        const n = Number(t);
        if (Number.isNaN(n)) return null;
        return Math.max(0, Math.min(150, n)); // clamp
    }

    async function commitScore(id: string, raw: string) {
        const n = sanitizeScore(raw);
        await client.models.Assessment.update({ id, scorePct: n ?? undefined });
        await loadAssessments();
        onReload();
    }

    // ---- computed Min / Current / Max for this course ----
    const stats = useMemo(() => {
        const pieces = assessments.map(a => ({
            weightPct: a.weightPct ?? 0,
            scorePct: a.scorePct ?? null,
        }));
        const done = pieces.filter(p => p.scorePct != null);
        const W = done.reduce((s, p) => s + (p.weightPct || 0), 0); // weight completed
        const S = done.reduce((s, p) => s + (p.weightPct || 0) * ((p.scorePct as number) / 100), 0); // pts earned
        const bonus = course.bonusPct ?? 0;
        const min = Math.min(S + bonus, 110);
        const current = W > 0 ? Math.min(((S + bonus) / W) * 100, 110) : null;
        const max = Math.min(S + (100 - W) + bonus, 110);
        return { min, current, max };
    }, [assessments, course.bonusPct]);

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h4 className="font-medium text-lg">{course.title}</h4>
                    <p className="text-sm text-gray-400">
                        {course.credits} credits • Bonus {course.bonusPct ?? 0}%
                    </p>
                </div>
                {/* quick stats */}
                <div className="text-right text-xs text-gray-300">
                    <div>Min: {stats.min.toFixed(1)}%</div>
                    <div>Current: {stats.current == null ? '—' : `${stats.current.toFixed(1)}%`}</div>
                    <div>Max: {stats.max.toFixed(1)}%</div>
                </div>
            </div>

            <div className="flex gap-2 mt-auto">
                <button
                    className="rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                    onClick={toggleGrades}
                >
                    {showGrades ? 'Hide Grades' : 'Add Grades'}
                </button>
                <button
                    className="rounded-md bg-red-500/20 px-3 py-1 text-sm hover:bg-red-500/30"
                    onClick={handleDelete}
                >
                    Delete
                </button>
            </div>

            {showGrades && (
                <div className="mt-3 grid gap-2">
                    {assessments.length === 0 ? (
                        <p className="text-xs text-gray-400">No assessments defined yet.</p>
                    ) : (
                        assessments.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between rounded-md bg-white/10 p-2"
                            >
                                <span className="text-sm">
                                    {a.name} ({a.weightPct}%)
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={150}
                                    step={0.1}
                                    className="w-20 rounded-md bg-white/20 p-1 text-right"
                                    defaultValue={a.scorePct ?? ''}              // uncontrolled while typing
                                    placeholder="%"
                                    onBlur={(e) => commitScore(a.id!, e.target.value)} // commit once on blur
                                />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
