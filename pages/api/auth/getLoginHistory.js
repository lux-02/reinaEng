import { connectToDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { email, limit = 10, skip = 0 } = req.query;

    const collection = db.collection("login_history");

    // 이메일로 필터링하고 최신 순으로 정렬
    const query = email ? { email } : {};
    const loginHistory = await collection
      .find(query)
      .sort({ loginTime: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    // 전체 기록 수 조회
    const total = await collection.countDocuments(query);

    res.status(200).json({
      history: loginHistory,
      total,
      currentPage: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get login history error:", error);
    res.status(500).json({
      error: "Failed to get login history",
      details: error.message,
    });
  }
}
