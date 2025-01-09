import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { sessionId, messages } = req.body;

    if (!sessionId || !messages) {
      return res.status(400).json({
        error: "필수 필드가 누락되었습니다",
        details: { sessionId, messagesLength: messages?.length },
      });
    }

    const collection = db.collection("conversations");

    // 메시지 데이터 정제 및 오디오 데이터 압축
    const cleanedMessages = messages.map((message) => {
      const cleanedMessage = {
        role: message.role,
        content: message.content,
      };

      // 오디오 데이터가 있는 경우에만 포함
      if (message.audioContent) {
        // base64 문자열에서 불필요한 패딩 제거
        const audioContent = message.audioContent.replace(/=/g, "");
        cleanedMessage.audioContent = audioContent;
      }

      return cleanedMessage;
    });

    // 청크 크기 계산 (대략적인 크기 추정)
    const messageSize = JSON.stringify(cleanedMessages).length;
    const maxChunkSize = 500000; // 약 500KB
    const numberOfChunks = Math.ceil(messageSize / maxChunkSize);

    if (numberOfChunks > 1) {
      // 메시지를 청크로 나누어 저장
      const chunks = [];
      for (let i = 0; i < numberOfChunks; i++) {
        const start = Math.floor((i * cleanedMessages.length) / numberOfChunks);
        const end = Math.floor(
          ((i + 1) * cleanedMessages.length) / numberOfChunks
        );
        chunks.push(cleanedMessages.slice(start, end));
      }

      // 각 청크를 개별 문서로 저장
      const results = await Promise.all(
        chunks.map((chunk, index) =>
          collection.insertOne({
            sessionId,
            messages: chunk,
            date: new Date(),
            chunkIndex: index,
            totalChunks: numberOfChunks,
          })
        )
      );

      if (results.every((result) => result.acknowledged)) {
        res.status(200).json({
          message: "대화가 저장되었습니다",
          conversationIds: results.map((r) => r.insertedId),
        });
      } else {
        throw new Error("일부 대화 청크 저장에 실패했습니다");
      }
    } else {
      // 단일 문서로 저장
      const result = await collection.insertOne({
        sessionId,
        messages: cleanedMessages,
        date: new Date(),
      });

      if (result.acknowledged) {
        res.status(200).json({
          message: "대화가 저장되었습니다",
          conversationId: result.insertedId,
        });
      } else {
        throw new Error("대화 저장에 실패했습니다");
      }
    }
  } catch (error) {
    console.error("Save conversation error:", error);
    res.status(500).json({
      message: "대화 저장 실패",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
