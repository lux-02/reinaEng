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

    // 인증 토큰 가져오기
    const token = await getAuth();
    if (!token) {
      throw new Error("Failed to get authentication token");
    }

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
      throw new Error(
        `Google TTS API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ""
        }`
      );
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error("No audio content received from Google TTS API");
    }

    res.status(200).json({ audioContent: data.audioContent });
  } catch (error) {
    console.error("Speech synthesis error:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
