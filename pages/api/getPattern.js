import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "허용되지 않는 메소드입니다." });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "패턴 ID가 필요합니다." });
  }

  try {
    const { db } = await connectToDatabase();

    const pattern = await db.collection("patterns").findOne({ id: id });

    if (!pattern) {
      return res.status(404).json({ message: "패턴을 찾을 수 없습니다." });
    }

    return res.status(200).json(pattern);
  } catch (error) {
    console.error("패턴을 가져오는 중 오류가 발생했습니다:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}
