import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { word, meaning, _id } = req.body;
    const client = await clientPromise;
    const db = client.db("reinaeng");
    const collection = db.collection("words");

    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          word,
          meaning,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "단어를 찾을 수 없습니다" });
    }

    res.status(200).json({ message: "단어가 수정되었습니다" });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "단어 수정 실패", error: error.message });
  }
}
