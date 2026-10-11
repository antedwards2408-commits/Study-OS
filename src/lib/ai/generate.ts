import { complete, extractJson, type ChatMessage } from "./groq";
import type { Difficulty } from "@/types/database";

export interface InferredTopic {
  name: string;
  description: string;
}

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  difficulty: Difficulty;
  topicName: string | null;
}

export interface GeneratedQuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  topicName: string | null;
}

const JSON_ONLY_RULE =
  "Respond with ONLY valid JSON - no markdown fences, no commentary before or after.";

/** Infers a small set of named topics that a piece of course material covers. */
export async function inferTopics(params: {
  courseName: string;
  materialTitle: string;
  text: string;
}): Promise<InferredTopic[]> {
  const text = await complete(
    [
      {
        role: "system",
        content:
          "You are an academic curriculum analyst. Given a student's course material, " +
          "identify the distinct topics/subtopics it covers so progress can be tracked per topic. " +
          "Use concise, student-recognizable topic names (e.g. 'Meiosis', 'Cell Communication'), " +
          `3-8 topics depending on material length. ${JSON_ONLY_RULE}`,
      },
      {
        role: "user",
        content:
          `Course: ${params.courseName}\nMaterial: ${params.materialTitle}\n\n` +
          `Content:\n${params.text.slice(0, 12000)}\n\n` +
          `Return a JSON array of objects: [{"name": string, "description": string}]`,
      },
    ],
    { maxTokens: 2000 },
  );

  return extractJson<InferredTopic[]>(text);
}

/** Generates flashcards grounded in the provided material chunks. */
export async function generateFlashcards(params: {
  materialTitle: string;
  chunks: string[];
  topics: string[];
  count: number;
}): Promise<GeneratedFlashcard[]> {
  const text = await complete(
    [
      {
        role: "system",
        content:
          "You are a study tool that converts a student's own course material into flashcards. " +
          "Every flashcard must be answerable strictly from the given material - never invent facts. " +
          "Vary difficulty (easy/medium/hard) based on how conceptually demanding the question is. " +
          `Tag each card with the closest matching topic name from the provided list, or null if none fit. ${JSON_ONLY_RULE}`,
      },
      {
        role: "user",
        content:
          `Material: ${params.materialTitle}\n` +
          `Known topics: ${params.topics.join(", ") || "(none yet)"}\n\n` +
          `Content:\n${params.chunks.join("\n\n").slice(0, 16000)}\n\n` +
          `Generate exactly ${params.count} flashcards as a JSON array: ` +
          `[{"question": string, "answer": string, "difficulty": "easy"|"medium"|"hard", "topicName": string|null}]`,
      },
    ],
    { maxTokens: 4000 },
  );

  return extractJson<GeneratedFlashcard[]>(text);
}

/** Generates a multiple-choice quiz grounded in the provided material chunks. */
export async function generateQuiz(params: {
  materialTitle: string;
  chunks: string[];
  topics: string[];
  count: number;
}): Promise<GeneratedQuizQuestion[]> {
  const text = await complete(
    [
      {
        role: "system",
        content:
          "You are a study tool that writes multiple-choice quizzes strictly grounded in a student's " +
          "own course material - never invent facts not supported by the content. Each question has " +
          "exactly 4 choices with exactly one correct answer, plus a short explanation of why the " +
          `correct choice is right. Tag each question with the closest matching topic name from the ` +
          `provided list, or null if none fit. ${JSON_ONLY_RULE}`,
      },
      {
        role: "user",
        content:
          `Material: ${params.materialTitle}\n` +
          `Known topics: ${params.topics.join(", ") || "(none yet)"}\n\n` +
          `Content:\n${params.chunks.join("\n\n").slice(0, 16000)}\n\n` +
          `Generate exactly ${params.count} multiple-choice questions as a JSON array: ` +
          `[{"question": string, "choices": [string,string,string,string], "correctIndex": number 0-3, ` +
          `"explanation": string, "topicName": string|null}]`,
      },
    ],
    { maxTokens: 4000 },
  );

  return extractJson<GeneratedQuizQuestion[]>(text);
}

/** Generates practice questions targeted at a single weak topic. */
export async function generatePracticeQuestions(params: {
  topicName: string;
  chunks: string[];
  count: number;
}): Promise<GeneratedQuizQuestion[]> {
  const text = await complete(
    [
      {
        role: "system",
        content:
          `You are a study tool generating targeted practice questions on one specific weak topic: ` +
          `"${params.topicName}". Ground every question strictly in the provided material. Each question ` +
          `has exactly 4 choices with exactly one correct answer and a short explanation. ${JSON_ONLY_RULE}`,
      },
      {
        role: "user",
        content:
          `Topic: ${params.topicName}\n\nRelevant material:\n${params.chunks.join("\n\n").slice(0, 14000)}\n\n` +
          `Generate exactly ${params.count} multiple-choice questions as a JSON array: ` +
          `[{"question": string, "choices": [string,string,string,string], "correctIndex": number 0-3, "explanation": string}]`,
      },
    ],
    { maxTokens: 3000 },
  );

  const questions = extractJson<Omit<GeneratedQuizQuestion, "topicName">[]>(text);
  return questions.map((q) => ({ ...q, topicName: params.topicName }));
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

/** Answers a student's question, grounded in retrieved material chunks. */
export async function askTutor(params: {
  courseName: string;
  materialTitle?: string;
  retrievedChunks: string[];
  history: TutorMessage[];
  question: string;
}): Promise<string> {
  const hasContext = params.retrievedChunks.length > 0;

  const system =
    "You are StudyOS's AI tutor, attached to a specific student's course material. " +
    `Course: ${params.courseName}` +
    (params.materialTitle ? `, Material: ${params.materialTitle}` : "") +
    ". Ground your answers in the EXCERPTS below whenever they are relevant - they are the " +
    "student's own uploaded material and take priority over general knowledge. If the excerpts " +
    "don't cover what's asked, say so plainly (e.g. 'Your uploaded material doesn't cover this, " +
    "but in general...') rather than pretending the material discusses it. You may still use your " +
    "general knowledge to explain concepts, give examples, and clarify terminology - just be " +
    "transparent about what comes from their material versus general knowledge. Be clear, patient, " +
    "and concise, like a good tutor, not a wall of text.\n\n" +
    (hasContext
      ? `EXCERPTS FROM STUDENT'S MATERIAL:\n${params.retrievedChunks.join("\n---\n").slice(0, 12000)}`
      : "No matching excerpts were found in the student's uploaded material for this question.");

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...params.history.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: "user", content: params.question },
  ];

  return complete(messages, { maxTokens: 1500 });
}
