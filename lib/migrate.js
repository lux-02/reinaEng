const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

async function migrateData() {
  try {
    // MongoDB 연결
    const uri =
      process.env.MONGODB_URI ||
      "mongodb+srv://oys128950:4vXfOqc71u6GZPma@cluster.3sctb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";
    const client = new MongoClient(uri);
    await client.connect();
    console.log("MongoDB 연결 성공");

    const db = client.db("reinaeng");
    const collection = db.collection("words");

    // 기존 데이터 삭제
    await collection.deleteMany({});
    console.log("기존 데이터 삭제 완료");

    // data.json 읽기
    const filePath = path.join(process.cwd(), "public", "data.json");
    const fileData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileData);

    // 새 데이터 삽입
    const result = await collection.insertMany(
      data.terms.map((term) => ({
        word: term.word,
        meaning: term.meaning,
        jp_mean: term.jp_mean,
        ko_mean: term.ko_mean,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    console.log(
      `${result.insertedCount}개의 단어가 성공적으로 마이그레이션되었습니다.`
    );
    await client.close();
  } catch (error) {
    console.error("마이그레이션 오류:", error);
  }
}

migrateData();
