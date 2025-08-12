import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Voca Quiz</title>
        <meta
          name="description"
          content="영어 단어 학습 및 퀴즈 애플리케이션"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
