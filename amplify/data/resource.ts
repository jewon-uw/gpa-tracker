import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({

  Course: a.model({
    title: a.string().required(),
    credits: a.float().required(),
    bonusPct: a.float().default(0),
    assessments: a.hasMany("Assessment", "courseId"),
  }).authorization(allow => [allow.owner()]),

  Assessment: a.model({
    courseId: a.id().required(),
    name: a.string().required(),        // e.g., "A1", "Quiz 3", "Midterm 2"
    weightPct: a.float().required(),    // 5 means 5%
    scorePct: a.float(),                // nullable until graded
    displayOrder: a.integer(),
    notes: a.string(),
    course: a.belongsTo("Course", "courseId"),
  }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });
