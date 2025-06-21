import { pgTable, integer, varchar, boolean, text, pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const subjectsSubjectIdSeq = pgSequence("subjects_subject_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const topicsTopicIdSeq = pgSequence("topics_topic_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })

export const subjects = pgTable("subjects", {
	subjectId: integer("subject_id").default(sql`nextval('subjects_subject_id_seq'::regclass)`).primaryKey().notNull(),
	subjectName: varchar("subject_name", { length: 50 }).notNull(),
	subjectCode: varchar("subject_code", { length: 10 }).notNull(),
	isActive: boolean("is_active").default(true),
});

export const topics = pgTable("topics", {
	topicId: integer("topic_id").default(sql`nextval('topics_topic_id_seq'::regclass)`).primaryKey().notNull(),
	subjectId: integer("subject_id"),
	topicName: varchar("topic_name", { length: 100 }).notNull(),
	parentTopicId: integer("parent_topic_id"),
	topicDescription: text("topic_description"),
	topicOrder: integer("topic_order"),
	isActive: boolean("is_active").default(true),
});
