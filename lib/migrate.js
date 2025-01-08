async function migrateData() {
  try {
    const response = await fetch("http://localhost:3000/api/migrateData", {
      method: "POST",
    });
    const result = await response.json();
    console.log("마이그레이션 결과:", result);
  } catch (error) {
    console.error("마이그레이션 오류:", error);
  }
}

migrateData();
