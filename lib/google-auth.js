import { GoogleAuth } from "google-auth-library";
import { readFileSync } from "fs";
import path from "path";

let auth;

const getAuth = async () => {
  if (!auth) {
    try {
      if (process.env.GOOGLE_CREDENTIALS) {
        // Vercel 환경
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        auth = new GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        });
      } else {
        // 로컬 환경
        const credentialsPath = path.join(
          process.cwd(),
          "service-account.json"
        );
        const credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));
        auth = new GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      throw new Error("Failed to initialize Google Auth");
    }
  }

  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.error("Token generation error:", error);
    throw new Error("Failed to generate access token");
  }
};

export default getAuth;
