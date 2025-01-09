import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("conversations");

    // 모든 대화 가져오기
    const allConversations = await collection
      .find({})
      .sort({ date: -1 })
      .toArray();

    // 청크로 나뉜 대화들을 합치기
    const mergedConversations = [];
    const conversationMap = new Map();

    for (const conv of allConversations) {
      if (conv.totalChunks) {
        // 청크된 대화인 경우
        if (!conversationMap.has(conv.sessionId)) {
          conversationMap.set(conv.sessionId, {
            chunks: new Array(conv.totalChunks).fill(null),
            date: conv.date,
            sessionId: conv.sessionId,
          });
        }
        const convData = conversationMap.get(conv.sessionId);
        convData.chunks[conv.chunkIndex] = conv.messages;
      } else {
        // 단일 대화인 경우
        mergedConversations.push(conv);
      }
    }

    // 청크된 대화들 합치기
    for (const [sessionId, convData] of conversationMap.entries()) {
      if (convData.chunks.every((chunk) => chunk !== null)) {
        const messages = convData.chunks.flat();
        mergedConversations.push({
          sessionId,
          messages,
          date: convData.date,
        });
      }
    }

    // 날짜순으로 정렬
    mergedConversations.sort((a, b) => b.date - a.date);

    res.status(200).json({ conversations: mergedConversations });
  } catch (error) {
    console.error("대화 내역 조회 실패:", error);
    res.status(500).json({
      message: "대화 내역 조회 실패",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
