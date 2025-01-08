import clientPromise from "../../lib/mongodb";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "허용되지 않는 메소드입니다" });
  }

  try {
    // JSON 파일 읽기
    const filePath = path.join(process.cwd(), "public", "data.json");
    const fileData = await fs.promises.readFile(filePath, "utf8");
    const jsonData = JSON.parse(fileData);

    // MongoDB 연결
    const client = await clientPromise;
    const db = client.db("reinaeng");
    const collection = db.collection("words");

    // 기존 데이터 삭제
    await collection.deleteMany({});

    // 새 데이터 삽입
    const result = await collection.insertMany(
      jsonData.terms.map((term) => ({
        ...term,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    res.status(200).json({
      message: "데이터 마이그레이션이 완료되었습니다",
      insertedCount: result.insertedCount,
    });
  } catch (error) {
    console.error("마이그레이션 오류:", error);
    res
      .status(500)
      .json({ message: "마이그레이션 실패", error: error.message });
  }
}
