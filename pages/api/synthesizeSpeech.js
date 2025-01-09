import getAuth from "../../lib/google-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    console.log("Attempting to get auth token...");
    // 인증 토큰 가져오기
    let token;
    try {
      token = await getAuth();
    } catch (authError) {
      console.error("Authentication error details:", {
        message: authError.message,
        stack: authError.stack,
        name: authError.name,
      });
      return res.status(401).json({
        error: "Authentication failed",
        details: authError.message,
      });
    }

    console.log("Token received, calling Google TTS API...");
    // Google TTS API 호출
    const response = await fetch(
      "https://texttospeech.googleapis.com/v1/text:synthesize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          input: {
            text: text,
          },
          voice: {
            languageCode: "en-US",
            name: "en-US-Casual-K",
          },
          audioConfig: {
            audioEncoding: "MP3",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Google TTS API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        headers: response.headers,
      });
      throw new Error(
        `Google TTS API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ""
        }`
      );
    }

    console.log("Received response from Google TTS API");
    const data = await response.json();

    if (!data.audioContent) {
      console.error("No audio content in response:", data);
      throw new Error("No audio content received from Google TTS API");
    }

    console.log("Successfully processed TTS request");
    res.status(200).json({ audioContent: data.audioContent });
  } catch (error) {
    console.error("Speech synthesis error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      error: error.message,
      details: error.stack,
    });
  }
}
