import { AuthProvider } from "../context/AuthContext";
import Head from "next/head";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>Voca Quiz</title>
        <meta
          name="description"
          content="영어 단어 학습 및 퀴즈 애플리케이션"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
