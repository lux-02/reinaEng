import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    console.log("MongoDB 연결 시도...");
    const client = await clientPromise;
    console.log("MongoDB 연결 성공");

    const db = client.db("reinaeng");
    const collection = db.collection("words");

    console.log("데이터 조회 시작...");
    const words = await collection.find({}).toArray();
    console.log(`조회된 단어 수: ${words.length}`);

    const latestWord = await collection.findOne(
      {},
      { sort: { updatedAt: -1 } }
    );

    if (!words || words.length === 0) {
      console.log("데이터가 없습니다");
      return res.status(404).json({ message: "데이터가 없습니다" });
    }

    res.status(200).json({
      terms: words,
      updatedAt: latestWord?.updatedAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error("API 에러:", error);
    res.status(500).json({ message: "데이터 조회 실패", error: error.message });
  }
}
