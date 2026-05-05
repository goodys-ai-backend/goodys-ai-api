// Vercel Serverless Function (Node.js)
export default async function handler(req, res) {
  const { modelName } = req.query;

  if (!modelName) {
    return res.status(400).json({ error: "모델명을 입력해주세요." });
  }

  try {
    // 1. AI 1 (Groq - Llama 3) 호출
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: `${modelName} 네트워크 장비 사양을 알려줘.` }]
      })
    }).then(r => r.json());

    // 2. AI 2 (Hugging Face) 호출 (예시: Mistral)
    const hfResponse = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-v0.1", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.HF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: `${modelName} technical specifications summary:` })
    }).then(r => r.json());

    // 3. 최종 제미나이(Gemini) 합성
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `다음 두 AI의 조사 내용을 바탕으로 ${modelName} 장비의 공통된 사양을 한국어로 요약해줘. 
            AI 1: ${JSON.stringify(groqResponse)}
            AI 2: ${JSON.stringify(hfResponse)}`
          }]
        }]
      })
    }).then(r => r.json());

    const finalAnswer = geminiResponse.candidates[0].content.parts[0].text;

    // TODO: 여기에 Google Drive API를 호출하여 finalAnswer를 저장하는 코드를 추가할 수 있습니다.

    res.status(200).json({ finalAnswer });

  } catch (error) {
    res.status(500).json({ error: "분석 중 오류가 발생했습니다." });
  }
}

