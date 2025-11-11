import { relations } from "drizzle-orm/relations";
import { userSubscriptions, paymentHistory, subjects, practiceSessions, subtopics, topics, questions, questionAttempts, sessionQuestions, examYears, questionPapers, topicMastery, subscriptionPlans, questionTags, tags } from "./schema";

export const paymentHistoryRelations = relations(paymentHistory, ({one}) => ({
	userSubscription: one(userSubscriptions, {
		fields: [paymentHistory.subscriptionId],
		references: [userSubscriptions.subscriptionId]
	}),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one, many}) => ({
	paymentHistories: many(paymentHistory),
	subscriptionPlan: one(subscriptionPlans, {
		fields: [userSubscriptions.planId],
		references: [subscriptionPlans.planId]
	}),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({one, many}) => ({
	subject: one(subjects, {
		fields: [practiceSessions.subjectId],
		references: [subjects.subjectId]
	}),
	subtopic: one(subtopics, {
		fields: [practiceSessions.subtopicId],
		references: [subtopics.subtopicId]
	}),
	topic: one(topics, {
		fields: [practiceSessions.topicId],
		references: [topics.topicId]
	}),
	questionAttempts: many(questionAttempts),
	sessionQuestions: many(sessionQuestions),
	topicMasteries: many(topicMastery),
}));

export const subjectsRelations = relations(subjects, ({many}) => ({
	practiceSessions: many(practiceSessions),
	questionPapers: many(questionPapers),
	questions: many(questions),
	topics: many(topics),
}));

export const subtopicsRelations = relations(subtopics, ({one, many}) => ({
	practiceSessions: many(practiceSessions),
	questions: many(questions),
	topic: one(topics, {
		fields: [subtopics.topicId],
		references: [topics.topicId]
	}),
}));

export const topicsRelations = relations(topics, ({one, many}) => ({
	practiceSessions: many(practiceSessions),
	questions: many(questions),
	sessionQuestions: many(sessionQuestions),
	subtopics: many(subtopics),
	topicMasteries: many(topicMastery),
	topic: one(topics, {
		fields: [topics.parentTopicId],
		references: [topics.topicId],
		relationName: "topics_parentTopicId_topics_topicId"
	}),
	topics: many(topics, {
		relationName: "topics_parentTopicId_topics_topicId"
	}),
	subject: one(subjects, {
		fields: [topics.subjectId],
		references: [subjects.subjectId]
	}),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({one}) => ({
	question: one(questions, {
		fields: [questionAttempts.questionId],
		references: [questions.questionId]
	}),
	practiceSession: one(practiceSessions, {
		fields: [questionAttempts.sessionId],
		references: [practiceSessions.sessionId]
	}),
	sessionQuestion: one(sessionQuestions, {
		fields: [questionAttempts.sessionQuestionId],
		references: [sessionQuestions.sessionQuestionId]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	questionAttempts: many(questionAttempts),
	questionPaper: one(questionPapers, {
		fields: [questions.paperId],
		references: [questionPapers.paperId]
	}),
	subject: one(subjects, {
		fields: [questions.subjectId],
		references: [subjects.subjectId]
	}),
	subtopic: one(subtopics, {
		fields: [questions.subtopicId],
		references: [subtopics.subtopicId]
	}),
	topic: one(topics, {
		fields: [questions.topicId],
		references: [topics.topicId]
	}),
	sessionQuestions: many(sessionQuestions),
	topicMasteries: many(topicMastery),
	questionTags: many(questionTags),
}));

export const sessionQuestionsRelations = relations(sessionQuestions, ({one, many}) => ({
	questionAttempts: many(questionAttempts),
	question: one(questions, {
		fields: [sessionQuestions.questionId],
		references: [questions.questionId]
	}),
	practiceSession: one(practiceSessions, {
		fields: [sessionQuestions.sessionId],
		references: [practiceSessions.sessionId]
	}),
	topic: one(topics, {
		fields: [sessionQuestions.topicId],
		references: [topics.topicId]
	}),
}));

export const questionPapersRelations = relations(questionPapers, ({one, many}) => ({
	examYear: one(examYears, {
		fields: [questionPapers.examYearId],
		references: [examYears.yearId]
	}),
	subject: one(subjects, {
		fields: [questionPapers.subjectId],
		references: [subjects.subjectId]
	}),
	questions: many(questions),
}));

export const examYearsRelations = relations(examYears, ({many}) => ({
	questionPapers: many(questionPapers),
}));

export const topicMasteryRelations = relations(topicMastery, ({one}) => ({
	question: one(questions, {
		fields: [topicMastery.questionId],
		references: [questions.questionId]
	}),
	practiceSession: one(practiceSessions, {
		fields: [topicMastery.sessionId],
		references: [practiceSessions.sessionId]
	}),
	topic: one(topics, {
		fields: [topicMastery.topicId],
		references: [topics.topicId]
	}),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({many}) => ({
	userSubscriptions: many(userSubscriptions),
}));

export const questionTagsRelations = relations(questionTags, ({one}) => ({
	question: one(questions, {
		fields: [questionTags.questionId],
		references: [questions.questionId]
	}),
	tag: one(tags, {
		fields: [questionTags.tagId],
		references: [tags.tagId]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	questionTags: many(questionTags),
}));