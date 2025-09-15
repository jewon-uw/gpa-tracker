// src/components/CourseEditor.tsx
export default function CourseEditor() {
  return (
    <form className="grid gap-3">
      <input className="rounded-md bg-white/10 p-2 outline-none" placeholder="Course title" />
      <input className="rounded-md bg-white/10 p-2 outline-none" placeholder="Credits (e.g., 0.5)" />
      <button className="mt-2 rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20" type="button">
        Add assessment
      </button>
    </form>
  );
}
