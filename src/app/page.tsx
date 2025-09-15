'use client';
import { useEffect, useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import CourseBox from '../components/CourseBox';

const client = generateClient<Schema>();

export default function Home() {
  const [courses, setCourses] = useState<Schema['Course']['type'][]>([]);
  async function load() {
    const { data } = await client.models.Course.list();
    setCourses([...data].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));
  }
  useEffect(() => { load(); }, []);

  return (
    <Authenticator>
      {({ signOut }) => (
        <main className="grid gap-6">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Dashboard</h2>
            <button className="rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/20" onClick={signOut}>
              Sign out
            </button>
          </header>

          <AddCourseWizard onCreated={load} />

          <section>
            <h3 className="mb-3 text-lg font-medium">Your courses</h3>
            {courses.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
                No courses yet — add one above.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => <CourseBox key={c.id} course={c} onReload={load} />)}
              </div>
            )}
          </section>
        </main>
      )}
    </Authenticator>
  );
}

/* ---------------- Add Course Wizard ---------------- */

type ComponentSpec = {
  id: string;
  name: string;                 // free text (e.g., "assignments")
  count: number;                // number of items
  uniform: boolean;             // if true, one weight per item; else per-item inputs
  weightPerItem: number;        // used when uniform = true
  weights: number[];     
  category: string;
};

function AddCourseWizard({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);

  // course basics
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState(0.5);
  const [bonusPct, setBonusPct] = useState(0);

  // components
  const [components, setComponents] = useState<ComponentSpec[]>([]);

  function toggleOpen() {
    // hide & clear when toggled off
    if (open) clearAll();
    setOpen(!open);
  }
  function clearAll() {
    setTitle('');
    setCredits(0.5);
    setBonusPct(0);
    setComponents([]);
  }

  function addComponent() {
    setComponents((arr) => [
      ...arr,
      {
        id: crypto.randomUUID(),
        name: '',
        category: 'ASSIGNMENT',
        count: 1,
        uniform: true,
        weightPerItem: 0,
        weights: [],
      },
    ]);
  }
  function removeComponent(id: string) {
    setComponents((arr) => arr.filter(c => c.id !== id));
  }
  function updateComponent<T extends keyof ComponentSpec>(id: string, key: T, value: ComponentSpec[T]) {
    setComponents((arr) => arr.map(c => c.id === id ? { ...c, [key]: value } as ComponentSpec : c));
  }
  function updateCount(id: string, count: number) {
    setComponents(arr => arr.map(c => {
      if (c.id !== id) return c;
      const n = Math.max(1, Math.floor(count || 1));
      const weights = c.uniform ? [] : expandWeights(c.weights, n);
      return { ...c, count: n, weights };
    }));
  }
  
  function expandWeights(weights: number[], n: number): number[] {
    const out = weights.slice(0, n);
    while (out.length < n) out.push(0);
    return out;
  }

  // helpers
  const sumCourseWeights = components.reduce((sum, comp) => {
    if ((comp.category || '').toLowerCase() === 'bonus') return sum;
    if (comp.uniform) return sum + comp.count * (comp.weightPerItem || 0);
    return sum + comp.weights.reduce((s, w) => s + (w || 0), 0);
  }, 0);  

  const warnings: string[] = [];
  if (Math.abs(100 - sumCourseWeights) > 0.5) {
    warnings.push(`Weights sum to ${sumCourseWeights.toFixed(1)}% (excluding bonus).`);
  }
  // inputs sanity
  if (!title.trim()) warnings.push('Course title is required.');

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6">
      <button
        className="mb-3 rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        onClick={toggleOpen}
      >
        {open ? 'Hide add course' : 'Add course'}
      </button>

      {open && (
        <div className="grid gap-4">
          {/* Course basics */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              className="rounded-md bg-white/10 p-2 outline-none"
              placeholder="Course title (e.g., MATH 135)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="number" step="0.1" min={0}
              className="rounded-md bg-white/10 p-2 outline-none"
              placeholder="Credits"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Bonus </label>
              <input
                type="number" step="0.5" min={0}
                className="w-24 rounded-md bg-white/10 p-2 outline-none"
                placeholder="Bonus %"
                value={bonusPct}
                onChange={(e) => setBonusPct(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Components */}
          <div className="rounded-lg border border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium">Components</h4>
              <button
                className="rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                onClick={addComponent}
              >
                Add a component
              </button>
            </div>

            {components.length === 0 ? (
              <p className="text-sm text-gray-300">Add assignments, quizzes, midterms, etc.</p>
            ) : (
              <div className="grid gap-3">
                {components.map((c) => (
                  <div key={c.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                    {/* Row 1: name + category + remove */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="flex-1">
                        <input
                          className="w-full rounded-md bg-white/10 p-2 outline-none"
                          placeholder="Component name (e.g., assignments)"
                          value={c.name}
                          onChange={(e) => updateComponent(c.id, 'name', e.target.value)}
                        />
                      </div>

                      <button
                        className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                        onClick={() => removeComponent(c.id)}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Row 2: count */}
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <label className="text-sm text-gray-300">
                        Number of {c.name || 'items'}
                      </label>
                      <input
                        type="number" min={1}
                        className="w-24 rounded-md bg-white/10 p-2"
                        value={c.count}
                        onChange={(e) => updateCount(c.id, Number(e.target.value))}
                      />
                    </div>

                    {/* Row 3: uniform toggle + weights */}
                    <div className="grid gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={c.uniform}
                          onChange={(e) => updateComponent(c.id, 'uniform', e.target.checked)}
                        />
                        <span>Uniform weight distribution</span>
                      </label>

                      {c.uniform ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">Per-item weight</span>
                          <input
                            type="number" step="1" min={0}
                            className="w-28 rounded-md bg-white/10 p-2"
                            value={c.weightPerItem}
                            onChange={(e) => updateComponent(c.id, 'weightPerItem', Number(e.target.value))}
                          />
                          <span className="text-sm text-gray-400">%</span>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          <span className="text-sm text-gray-300">Weights</span>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {Array.from({ length: c.count }).map((_, i) => (
                              <input
                                key={i}
                                type="number" step="1" min={0}
                                className="rounded-md bg-white/10 p-2"
                                placeholder={`Item ${i + 1} %`}
                                value={c.weights[i]}
                                onChange={(e) => {
                                  const v = e.target.value === '' ? 0 : Number(e.target.value);
                                  setComponents(arr => arr.map(x => {
                                    if (x.id !== c.id) return x;
                                    const next = expandWeights(x.weights, c.count);
                                    next[i] = v;
                                    return { ...x, weights: next };
                                  }));
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-md bg-yellow-400/10 p-3 text-xs text-yellow-200">
              {warnings.map((w, i) => <div key={i}>• {w}</div>)}
            </div>
          )}

          {/* Continue / Cancel */}
          <div className="flex gap-2">
            <button
              className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              onClick={() => handleCreate({ title, credits, bonusPct, components, onCreated, close: () => { setOpen(false); clearAll(); } })}
            >
              Continue
            </button>
            <button
              className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              onClick={() => { setOpen(false); clearAll(); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- creation logic ---------------- */

async function handleCreate(args: {
  title: string; credits: number; bonusPct: number;
  components: ComponentSpec[];
  onCreated: () => void;
  close: () => void;
}) {
  const { title, credits, bonusPct, components, onCreated, close } = args;
  if (!title.trim()) { alert('Course title is required.'); return; }

  // 1) create the course
  const created = await client.models.Course.create({ title, credits, bonusPct });
  const courseId = created.data?.id;
  if (!courseId) { alert('Failed to create course.'); return; }

  // 2) create assessments
  let displayOrder = 1;
  for (const comp of components) {
    const perItemWeights: number[] = comp.uniform
      ? Array.from({ length: comp.count }, () => comp.weightPerItem || 0)
      : Array.from({ length: comp.count }, (_, i) => Number(comp.weights[i] || 0));

    for (let i = 0; i < comp.count; i++) {
      const name = comp.name
      await client.models.Assessment.create({
        courseId,
        name,
        weightPct: perItemWeights[i] || 0,
        displayOrder: displayOrder++,
      });
    }
  }

  onCreated();
  close();
}
