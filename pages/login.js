import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Login.module.css";

export default function Login() {
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Google OAuth 클라이언트 로드
    const loadGoogleScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.google?.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google?.accounts.id.renderButton(
          document.getElementById("googleButton"),
          { theme: "outline", size: "large", width: "100%" }
        );
      };
    };

    loadGoogleScript();
  }, []);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleCredentialResponse = async (response) => {
    try {
      // 서버에 토큰 검증 요청
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify token");
      }

      const userData = await verifyResponse.json();
      login(userData);
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      alert("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Voca Quiz</h1>
        <p className={styles.descriptionKR}>
          영어 학습을 시작하기 위해 로그인해주세요.
        </p>
        <p className={styles.descriptionJP}>
          英語学習を始めるには、ログインしてください。
        </p>
        <div id="googleButton" className={styles.googleButton}></div>
      </div>
    </div>
  );
}
