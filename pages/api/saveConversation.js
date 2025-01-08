import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { sessionId, messages } = req.body;

    if (!sessionId || !messages) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const collection = db.collection("conversations");
    const result = await collection.insertOne({
      sessionId,
      messages,
      date: new Date(),
    });

    if (result.acknowledged) {
      res.status(200).json({ message: "대화가 저장되었습니다" });
    } else {
      throw new Error("대화 저장에 실패했습니다");
    }
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ message: "대화 저장 실패", error: error.message });
  }
}
