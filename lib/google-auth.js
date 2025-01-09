import { JWT } from "google-auth-library";

async function getAuth() {
  try {
    let credentials;

    // 환경 변수에서 credentials 가져오기 시도
    if (process.env.GOOGLE_CREDENTIALS) {
      try {
        // base64 디코딩 후 JSON 파싱
        const decodedCredentials = Buffer.from(
          process.env.GOOGLE_CREDENTIALS,
          "base64"
        ).toString();
        credentials = JSON.parse(decodedCredentials);
        console.log("Using credentials from environment variable");
      } catch (parseError) {
        console.error("Failed to parse GOOGLE_CREDENTIALS:", parseError);
        throw new Error("Invalid GOOGLE_CREDENTIALS format");
      }
    } else {
      try {
        credentials = require("../service-account.json");
        console.log("Using credentials from service-account.json");
      } catch (requireError) {
        console.error("Failed to load service-account.json:", requireError);
        throw new Error("No credentials available");
      }
    }

    if (!credentials?.client_email || !credentials?.private_key) {
      console.error("Invalid credentials structure:", {
        hasEmail: !!credentials?.client_email,
        hasKey: !!credentials?.private_key,
      });
      throw new Error("Credentials missing required fields");
    }

    // private_key의 이스케이프된 문자 처리
    const privateKey = credentials.private_key.replace(/\\n/g, "\n");

    // JWT 토큰 생성
    const token = await new Promise((resolve, reject) => {
      const jwtClient = new JWT({
        email: credentials.client_email,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });

      jwtClient.authorize((error, tokens) => {
        if (error) {
          console.error("JWT Auth error:", error);
          reject(new Error(`JWT authorization failed: ${error.message}`));
          return;
        }
        if (!tokens?.access_token) {
          reject(new Error("No access token received"));
          return;
        }
        resolve(tokens.access_token);
      });
    });

    return token;
  } catch (error) {
    console.error("Auth error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
}

export default getAuth;
