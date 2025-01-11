import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { word, jp_mean, ko_mean } = req.body;
    const { db } = await connectToDatabase();
    const collection = db.collection("words");

    const result = await collection.insertOne({
      word,
      meaning: jp_mean,
      jp_mean,
      ko_mean,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const insertedWord = await collection.findOne({ _id: result.insertedId });

    res.status(201).json({
      message: "단어가 추가되었습니다",
      word: insertedWord,
    });
  } catch (error) {
    console.error("Add error:", error);
    res.status(500).json({ message: "단어 추가 실패", error: error.message });
  }
}
