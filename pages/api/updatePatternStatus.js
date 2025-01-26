import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("patterns");
    const { patternId, completed } = req.body;

    const updateData = {
      $set: {
        completed: completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      },
    };

    const result = await collection.updateOne({ id: patternId }, updateData);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "패턴을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "패턴 상태가 업데이트되었습니다." });
  } catch (error) {
    console.error("Update pattern status error:", error);
    res.status(500).json({
      message: "패턴 상태 업데이트 실패",
      error: error.message,
    });
  }
}
