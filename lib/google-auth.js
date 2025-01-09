import { GoogleAuth } from "google-auth-library";
import { JWT } from "google-auth-library";

let auth;

async function getAuth() {
  try {
    // Vercel 환경에서는 환경 변수에서 credentials를 가져옵니다
    const credentials = process.env.GOOGLE_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
      : require("../service-account.json");

    if (!credentials) {
      throw new Error("Google credentials not found");
    }

    // JWT 토큰 생성
    const token = await new Promise((resolve, reject) => {
      const jwtClient = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });

      jwtClient.authorize((error, tokens) => {
        if (error) {
          console.error("Auth error:", error);
          reject(error);
          return;
        }
        resolve(tokens.access_token);
      });
    });

    return token;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

export default getAuth;
