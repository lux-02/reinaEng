import { connectToDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { email, name, loginTime, userAgent, ipAddress } = req.body;

    const collection = db.collection("login_history");

    const result = await collection.insertOne({
      email,
      name,
      loginTime: new Date(loginTime),
      userAgent,
      ipAddress,
      createdAt: new Date(),
    });

    res.status(200).json({
      message: "Login history saved",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Login history error:", error);
    res.status(500).json({
      error: "Failed to save login history",
      details: error.message,
    });
  }
}
