import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("patterns");

    // 마지막 패턴의 ID를 가져와서 새 ID 생성
    const lastPattern = await collection
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    const nextId =
      lastPattern.length > 0
        ? (parseInt(lastPattern[0].id) + 1).toString()
        : "1";

    const { name_ko, name_jp, explanation, examples } = req.body;

    const result = await collection.insertOne({
      id: nextId,
      name_ko,
      name_jp,
      explanation,
      examples,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const insertedPattern = await collection.findOne({
      _id: result.insertedId,
    });

    res.status(201).json({
      message: "패턴이 추가되었습니다",
      pattern: insertedPattern,
    });
  } catch (error) {
    console.error("Add pattern error:", error);
    res.status(500).json({ message: "패턴 추가 실패", error: error.message });
  }
}
