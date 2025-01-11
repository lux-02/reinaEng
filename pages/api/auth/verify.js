import { OAuth2Client } from "google-auth-library";
import { connectToDatabase } from "../../../lib/mongodb";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // 필요한 사용자 정보만 클라이언트에 반환
    const userData = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    // 로그인 기록 저장
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection("login_history");

      const ipAddress =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      await collection.insertOne({
        email: userData.email,
        name: userData.name,
        loginTime: new Date(),
        userAgent: req.headers["user-agent"],
        ipAddress: ipAddress,
        createdAt: new Date(),
      });

      console.log("Login history saved for:", userData.email);
    } catch (logError) {
      console.error("Failed to save login history:", logError);
      // 로그인 기록 저장 실패는 전체 로그인 프로세스를 실패시키지 않음
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}
