import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 채팅 기록을 저장할 Map 객체
const chatHistories = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    let chat = chatHistories.get(sessionId);

    // 새로운 대화 시작
    if (!chat || message === "START_CONVERSATION") {
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        weekday: "long",
      });

      chat = model.startChat({
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // 초기 시스템 프롬프트 전송
      await chat.sendMessage([
        {
          text: `You are Rex, a friendly English conversation tutor for Reina, a beginner-level English learner. Today is ${dateStr}. Follow these rules strictly:

1. Keep the conversation at a beginner level using simple vocabulary and basic sentence structures
2. Keep each response SHORT - one or two sentences maximum
3. Ask only ONE simple question at a time
4. Wait for Reina's response before moving forward
5. Gently correct any grammar mistakes by showing the correct form in parentheses
6. Use natural, everyday English that beginners can understand
7. Format responses in markdown for better readability
8. React to Reina's responses with encouragement
9. If Reina makes a mistake, provide the correction in a friendly way like this: "(correction: [correct form])"
10. Always address the student as Reina
11. Keep the conversation focused on practical, daily life situations
12. NEVER use speaker labels or name prefixes in your responses (like [Rex]: or Rex:)
13. Respond naturally as if in a real conversation, without any metadata or labels`,
        },
      ]);

      chatHistories.set(sessionId, chat);

      // 특별한 시작 메시지인 경우 첫 인사 보내기
      if (message === "START_CONVERSATION") {
        const result = await chat.sendMessage([
          {
            text: "Start with a friendly greeting to Reina and introduce yourself as her English tutor. Then continue with today's topic suggestion.",
          },
        ]);
        const response = await result.response;
        return res.status(200).json({ response: response.text() });
      }
    }

    // 일반적인 대화 계속하기
    const result = await chat.sendMessage([{ text: message }]);
    const response = await result.response;
    const text = response.text();

    // 30분 후 채팅 기록 삭제
    setTimeout(() => {
      chatHistories.delete(sessionId);
    }, 30 * 60 * 1000);

    res.status(200).json({ response: text });
  } catch (error) {
    console.error("Chat error details:", error);
    res.status(500).json({
      error: "Failed to generate response",
      details: error.message,
      code: error.status || 500,
    });
  }
}
