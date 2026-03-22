import { GoogleGenAI, Type } from "@google/genai";
import { Subject, Task, Question, UserProfile, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const geminiService = {
  async generateDailyPlan(subjectPriorities: Subject[], weakTopics: string[], profile: UserProfile, avgAccuracy: number = 70): Promise<Task[]> {
    const difficultyLevel = avgAccuracy > 85 ? 'ADVANCED (A-Level/University Entry)' : 
                          avgAccuracy > 70 ? 'HARD (GCSE Higher Tier)' : 
                          avgAccuracy > 50 ? 'MEDIUM (GCSE Foundation/Higher)' : 'FOUNDATION (KS3/GCSE Foundation)';

    const prompt = `You are "Ace", ${profile.displayName}'s personal study buddy from ${profile.schoolName}.
    ${profile.displayName} is in Year ${profile.yearGroup} and needs to revise these subjects: ${subjectPriorities.join(', ')}.
    Their current focus areas (where they need more help) are: ${weakTopics.join(', ')}.
    
    ADAPTIVE DIFFICULTY (CRITICAL):
    - Student's current average accuracy is ${avgAccuracy}%.
    - Target difficulty level: ${difficultyLevel}.
    - Adjust the complexity of explanations and questions accordingly.
    
    Your goal is to be a supportive buddy. When explaining hard topics:
    1. Explain GRADUALLY: Break it down into small, digestible "buddy-talk" chunks.
    2. MOTIVATE: Use encouraging, friendly language. Remind them of their potential.
    3. REAL-WORLD: Use the real-world examples we discussed (budgeting for maths, sports for physics, cooking for chemistry).
    
    ACADEMIC RIGOUR (CRITICAL):
    - Provide ONLY academic content strictly aligned with the UK GCSE/KS3 curriculum.
    - Never provide incorrect academic content or hallucinate facts.
    - Double-check all calculations and scientific facts.
    - For complex problems, re-derive the answer step-by-step in your "thinking" before presenting the final explanation.
    - Aim for ${difficultyLevel} standard to challenge the student appropriately.
    - Focus on critical thinking, multi-step problem solving, and complex application of concepts.
    
    NO REPETITION (CRITICAL):
    - Ensure all questions are unique and have not been asked in previous sessions.
    - Do not repeat the same question or very similar variations within the same set.
    
    The plan should include 3 tasks (one for each subject). For each task, provide:
    1. Subject
    2. Topic (UK KS3/GCSE aligned). This MUST be a concise academic topic name (e.g., "Algebra", "Forces", "Cell Biology").
    3. Teaching content (Markdown, buddy-style explanation, step-by-step, worked examples). This should be a comprehensive lesson.
    4. 20 progressively harder questions (Multiple choice) for the assessment phase. The questions should scale up to extremely challenging "Boss Level" questions.
    
    IMPORTANT: For each question, the "topic" field MUST be the specific sub-topic name (e.g., "Quadratic Equations", "Newton's Second Law") and NOT a word from the question text.
    
    Ensure the tone is that of a helpful, smart peer who wants ${profile.displayName} to succeed.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              content: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.STRING }
                  },
                  required: ["text", "topic", "options", "correctAnswer", "explanation", "difficulty"]
                }
              }
            },
            required: ["subject", "topic", "content", "questions"]
          }
        }
      }
    });

    const tasksData = JSON.parse(response.text || "[]");
    return tasksData.map((t: any, index: number) => ({
      ...t,
      id: `task-${Date.now()}-${index}`,
      status: 'pending'
    }));
  },

  async generateAssessment(tasksStudied: Task[], profile: UserProfile, avgAccuracy: number = 70): Promise<Question[]> {
    const difficultyRange = avgAccuracy > 85 ? 'HARD to EXTREME (A-Level/University)' : 
                           avgAccuracy > 70 ? 'MEDIUM to VERY HARD (GCSE Higher)' : 
                           avgAccuracy > 50 ? 'EASY to HARD (GCSE Foundation/Higher)' : 'VERY EASY to MEDIUM (KS3)';

    const topicsStudied = tasksStudied.map(t => t.topic);
    const subjectsStudied = Array.from(new Set(tasksStudied.map(t => t.subject)));
    const questionCount = topicsStudied.length > 0 ? topicsStudied.length * 20 : 20;
    const prompt = `Generate a ${questionCount}-question TOUGH adaptive assessment for ${profile.displayName}, a Year ${profile.yearGroup} student.
    Subjects covered today: ${subjectsStudied.join(', ')}.
    Topics covered today: ${topicsStudied.join(', ')}.
    Include a mix of these topics and previous concepts.
    
    ADAPTIVE DIFFICULTY (CRITICAL):
    - Student's current average accuracy is ${avgAccuracy}%.
    - Target difficulty range: ${difficultyRange}.
    
    ACADEMIC RIGOUR (CRITICAL):
    - Provide ONLY academic content strictly aligned with the UK GCSE/KS3 curriculum.
    - Never provide incorrect academic content or hallucinate facts.
    
    NO REPETITION (CRITICAL):
    - Ensure all questions are unique and have not been asked in previous sessions.
    - Do not repeat the same question or very similar variations within the same set.
    
    Focus on high-level critical thinking, complex problem solving, and advanced real-world application.
    Avoid simple recall; require the student to apply multiple concepts together.
    Ensure exactly ${questionCount} questions are provided, with an equal distribution across the topics mentioned.
    
    IMPORTANT: For each question, the "subject" field MUST be one of: ${subjectsStudied.join(', ')}.
    IMPORTANT: For each question, the "topic" field MUST be the concise academic topic name (e.g., "Algebra", "Forces", "Cell Biology") and NOT a word from the question text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              subject: { type: Type.STRING, description: "The subject this question belongs to (must be one of the subjects studied today)" },
              topic: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["text", "subject", "topic", "options", "correctAnswer", "explanation", "difficulty"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  },

  async generateParentReport(data: {
    topics: string[],
    accuracy: number,
    timeSpent: number,
    improvementTrend: string
  }): Promise<string> {
    const prompt = `Generate a daily progress report for a parent of a Year 9 student.
    Topics covered: ${data.topics.join(', ')}.
    Accuracy: ${data.accuracy}%.
    Time spent: ${data.timeSpent} minutes.
    Trend: ${data.improvementTrend}.
    Use clear, non-technical, encouraging language. Focus on measurable progress.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text || "Report generation failed.";
  },

  async askAcademicQuestion(question: string, history: ChatMessage[], profile: UserProfile): Promise<string> {
    const systemInstruction = `You are "Ace", ${profile.displayName}'s personal academic tutor.
    
    STRICT RULES:
    1. ONLY answer questions related to academics, studies, school subjects, or educational concepts.
    2. If a question is NOT academic (e.g., about celebrities, entertainment, non-educational personal advice, etc.), politely decline and remind the student that you are here to help with their studies.
    3. NEVER hallucinate. If you don't know an answer, say so.
    4. ACADEMIC RIGOUR: Double-check all calculations and scientific facts. Re-derive answers step-by-step internally.
    5. Support the student's specific curriculum (Year ${profile.yearGroup} at ${profile.schoolName}).
    6. Maintain a supportive, encouraging "buddy" tone while being strictly professional about academic accuracy.
    7. If the student asks for something inappropriate or non-academic, say: "I'm sorry, I'm only able to help with your academic studies and school subjects. Is there a specific topic you'd like to revise?"
    `;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: { systemInstruction },
      history: history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    const response = await chat.sendMessage({ message: question });
    return response.text || "I'm sorry, I couldn't process that request.";
  }
};
