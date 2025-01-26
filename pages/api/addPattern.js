import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("patterns");

    // 모든 패턴의 ID를 가져와서 가장 큰 ID 찾기
    const patterns = await collection
      .find({}, { projection: { id: 1 } })
      .toArray();
    const maxId = patterns.reduce((max, pattern) => {
      const currentId = parseInt(pattern.id);
      return currentId > max ? currentId : max;
    }, 0);

    const nextId = (maxId + 1).toString();

    const { name_ko, name_jp, explanation, examples } = req.body;

    // ID 중복 체크
    const existingPattern = await collection.findOne({ id: nextId });
    if (existingPattern) {
      return res.status(400).json({
        message: "ID 생성 오류",
        error: "패턴 ID가 중복되었습니다. 다시 시도해주세요.",
      });
    }

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
    res.status(500).json({
      message: "패턴 추가 실패",
      error: error.message,
      details:
        "패턴을 추가하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}
