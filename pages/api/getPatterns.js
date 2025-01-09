import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "허용되지 않는 메소드입니다." });
  }

  try {
    const { db } = await connectToDatabase();

    const patterns = await db
      .collection("patterns")
      .find({})
      .sort({ id: 1 })
      .toArray();

    return res.status(200).json(patterns);
  } catch (error) {
    console.error("패턴을 가져오는 중 오류가 발생했습니다:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}
