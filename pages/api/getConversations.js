import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("conversations");

    const conversations = await collection
      .find({})
      .sort({ date: -1 })
      .toArray();

    res.status(200).json({ conversations });
  } catch (error) {
    console.error("대화 내역 조회 실패:", error);
    res
      .status(500)
      .json({ message: "대화 내역 조회 실패", error: error.message });
  }
}
