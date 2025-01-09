import { GoogleAuth } from "google-auth-library";

let auth;

const getAuth = async () => {
  if (!auth) {
    try {
      const credentials = process.env.GOOGLE_CREDENTIALS
        ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
        : require("../service-account.json");

      auth = new GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      throw new Error(
        `Failed to initialize Google Auth: ${error.message}. Check if GOOGLE_CREDENTIALS environment variable is properly set.`
      );
    }
  }

  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.error("Token generation error:", error);
    throw new Error(`Failed to generate access token: ${error.message}`);
  }
};

export default getAuth;
