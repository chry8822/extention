// 올라마 모델 목록 확인 함수
async function checkOllamaModels() {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    console.log("모델 확인 상태 코드:", response.status);

    if (!response.ok) {
      console.error("모델 목록 확인 실패:", response.status);
      return "서버 응답 오류: " + response.status;
    }

    const data = await response.json();
    console.log("설치된 모델 목록:", data);
    return data;
  } catch (error) {
    console.error("모델 목록 확인 중 오류:", error);
    return error;
  }
}

// 요약 API 호출 함수
async function callSummaryApi(text: string, language: string) {
  const endPoint = "http://localhost:3000/proxy/generate";

  // 모델 이름 목록 가져오기
  let installedModels: string[] = [];
  try {
    const modelList = await checkOllamaModels();
    if (modelList && modelList.models) {
      installedModels = modelList.models.map((m: any) => m.name);
    }
  } catch (error) {
    console.error("모델 목록 가져오기 실패:", error);
  }

  let modelToUse = "falcon:latest";

  if (installedModels.length > 0) {
    modelToUse = installedModels[0];
  }

  const langPrompt: { [key: string]: string } = {
    ko: "한국어",
    en: "영어",
    ja: "일본어",
    zh: "중국어",
  };

  const prompt = `
    ${
      langPrompt[language] || "한국어"
    }로 다음 텍스트를 요약해주세요. 절대로 다른 언어로 응답하지 마세요.
요약 규칙:
    -반드시 ${langPrompt[language] || "한국어"}로 작성할 것
    -최소 5개 이상의 핵심 포인트만 포함할 것(원문이 길면 무조건 원문의 50% 이상으로 핵심포인트 만들기)
    -원문 텍스트수 파악해서 50% 이상으로 요약할것 그 이하는 안됨
    -각 포인트는 번호를 매겨 구분할 것
    -원문 길이의 50% 이상으로 작성할 것
    -요약본 이외에 다른 주석이나 말들은 포함하지 말것
    -요약본에 요약규칙등 불필요한 내용 포함하지 말것
    -필수! 한글 문맥에 맞게 요약할것 (더블체크)

     원문 : ${text}
  `;

  try {
    const response = await fetch(endPoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 응답 오류:", {
        status: response.status,
        error: errorText,
      });
      return {
        success: false,
        error: `API 오류 (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    console.log("API 응답 데이터 수신:", data);

    if (data && data.response) {
      return { success: true, summary: data.response };
    } else {
      console.error("API 응답 형식 오류:", data);
      return { success: false, error: "API 응답에 요약 결과가 없습니다" };
    }
  } catch (error: any) {
    console.error("API 호출 중 오류:", error);
    return { success: false, error: error.message };
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("메시지 수신:", message?.type);

  // PING 메시지 처리
  if (message?.type === "PING") {
    console.log("PING 메시지 수신");
    sendResponse({
      success: true,
      message: "서비스 워커 활성 상태",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // GET_MODELS 메시지 처리
  if (message?.type === "GET_MODELS") {
    console.log("GET_MODELS 메시지 수신");

    checkOllamaModels()
      .then((models) => {
        console.log("모델 정보 전송:", models);
        sendResponse({ success: true, models });
      })
      .catch((error) => {
        console.error("모델 정보 가져오기 실패:", error);
        sendResponse({ success: false, error: String(error) });
      });

    return true; // 비동기 응답을 위해 true 반환
  }

  // SUMMARIZE_API 메시지 처리
  if (message?.type === "SUMMARIZE_API") {
    if (!message.text) {
      console.error("텍스트가 없습니다");
      sendResponse({ success: false, error: "텍스트가 없습니다" });
      return true;
    }

    // API 호출 및 응답 처리
    callSummaryApi(message.text, message.language)
      .then((result) => {
        console.log("API 호출 결과:", result);
        sendResponse(result);
      })
      .catch((error) => {
        console.error("API 호출 실패:", error);
        sendResponse({ success: false, error: String(error) });
      });

    return true; // 비동기 응답을 위해 true 반환
  }

  return true; // 비동기 응답을 위해 true 반환
});

export {}; // TypeScript 모듈 시스템 사용을 위한 빈 export
