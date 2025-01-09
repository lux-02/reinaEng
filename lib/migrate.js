require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI가 설정되지 않았습니다.");
  process.exit(1);
}

const client = new MongoClient(uri);

async function migrate() {
  try {
    await client.connect();
    const db = client.db("reinaeng");

    // 단어 데이터 마이그레이션
    const wordsData = JSON.parse(fs.readFileSync("public/data.json", "utf8"));
    const wordsCollection = db.collection("words");
    await wordsCollection.deleteMany({});
    const wordsResult = await wordsCollection.insertMany(
      wordsData.terms.map((term) => ({
        ...term,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    console.log(`${wordsResult.insertedCount} words migrated successfully`);

    // 패턴 데이터 마이그레이션
    await db
      .collection("patterns")
      .drop()
      .catch(() => {});

    const rawPatternsData = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "public", "pattern.json"),
        "utf8"
      )
    );

    // 객체를 배열로 변환
    const patternsData = Object.entries(rawPatternsData).map(
      ([name, data]) => ({
        name_ko: name,
        name_jp: name,
        ...data,
      })
    );

    const patternsWithIds = patternsData.map((pattern, index) => ({
      ...pattern,
      id: (index + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await db.collection("patterns").insertMany(patternsWithIds);
    console.log(
      `${result.insertedCount} 개의 패턴이 성공적으로 마이그레이션되었습니다.`
    );

    await db.collection("patterns").createIndex({ id: 1 }, { unique: true });
    await db.collection("patterns").createIndex({ name: 1 });

    console.log("인덱스가 성공적으로 생성되었습니다.");
  } catch (error) {
    console.error("마이그레이션 중 오류가 발생했습니다:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
