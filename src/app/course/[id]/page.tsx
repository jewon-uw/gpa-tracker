'use client';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useCallback, useEffect, useState } from 'react';

const client = generateClient<Schema>();
type Category = 'ASSIGNMENT' | 'QUIZ' | 'MIDTERM' | 'FINAL' | 'BONUS' | 'OTHER';

export default function CoursePage({ params }: { params: { id: string } }) {
    const [course, setCourse] = useState<Schema['Course']['type'] | null>(null);
    const [assessments, setAssessments] = useState<Schema['Assessment']['type'][]>([]);

    const load = useCallback(async () => {
        const { data: c } = await client.models.Course.get({ id: params.id });
        setCourse(c ?? null);
        if (c) {
            const { data: list } = await client.models.Assessment.list({
                filter: { courseId: { eq: c.id } },
            });
            setAssessments(list);
        }
    }, [params.id]);

    useEffect(() => {
        void load();
    }, [load]);
    
    async function addBulk(category: Category, weightsCsv: string) {
        const weights = weightsCsv.split(/[,\s]+/).map(Number).filter(n => !Number.isNaN(n));
        for (let i = 0; i < weights.length; i++) {
            await client.models.Assessment.create({
                courseId: course!.id,
                name: `Item ${i + 1}`,
                weightPct: weights[i],
            });
        }
        await load();
    }

    async function setScore(id: string, score: number) {
        await client.models.Assessment.update({ id, scorePct: score });
        await load();
    }

    return (
        <main className="grid gap-4">
            {!course ? <p>Loading…</p> : (
                <>
                    <h2 className="text-xl font-semibold">{course.title} <span className="text-sm text-gray-400">({course.credits} cr)</span></h2>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm mb-2">Bulk add assessments (e.g., <code>5, 6, 9</code>)</p>
                        <div className="flex gap-2">
                            <input id="weights" className="flex-1 rounded-md bg-white/10 p-2" placeholder="5, 6, 9" />
                            <button className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                                onClick={() => addBulk('ASSIGNMENT', (document.getElementById('weights') as HTMLInputElement).value)}>
                                Add Assignments
                            </button>
                        </div>
                    </div>

                    <ul className="grid gap-2">
                        {assessments.map(a => (
                            <li key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                                <div>
                                    <div className="text-xs text-gray-400">Weight: {a.weightPct}%</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min={0} max={150} step={0.1}
                                        defaultValue={a.scorePct ?? ''}
                                        placeholder="score %"
                                        className="w-24 rounded-md bg-white/10 p-2"
                                        onBlur={(e) => setScore(a.id, Number(e.target.value))}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </main>
    );
}
