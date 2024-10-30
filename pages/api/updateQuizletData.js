import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const quizletUrl = req.body.url || "https://quizlet.com/ph/960787628/english-flash-cards/?i=61ajga&x=1jqt";

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    const page = await browser.newPage();
    await page.goto(quizletUrl, { waitUntil: "domcontentloaded", timeout: 90000 });

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 400); 
      });
    });

    const data = await page.evaluate(() => {
      const terms = Array.from(document.querySelectorAll(".SetPageTerms-term"));
      return terms.map(term => {
        const word = term.querySelector(".TermText.lang-en")?.innerText.trim();
        const meaning = term.querySelector(".TermText.lang-ja")?.innerText.trim();
        return { word, meaning };
      }).filter(term => term.word && term.meaning);
    });

    await browser.close();

    if (data.length === 0) {
      throw new Error("No data found. Check if the URL is correct or the page layout has changed.");
    }

    // 현재 날짜를 업데이트 일자로 추가
    const updatedData = {
      updatedAt: new Date().toISOString(),
      terms: data,
    };

    try {
      const filePath = path.join(process.cwd(), "public", "data.json");
      await fs.promises.writeFile(filePath, JSON.stringify(updatedData, null, 2));
      res.status(200).json({ message: "Data updated successfully", data: updatedData });
    } catch (fileError) {
      console.error("File write error:", fileError);
      res.status(500).json({ message: "Failed to write data to file", error: fileError.toString() });
    }

  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ message: "Failed to update data", error: error.toString() });
  }
}
