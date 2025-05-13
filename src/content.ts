// 콘텐츠 스크립트
import {
  extractMainContent,
  summarizeWithOpenAI,
  type SupportedLanguage,
} from "./summarizer";

console.log("텍스트 요약 확장 프로그램 콘텐츠 스크립트 로드됨!");

// 요약 버튼 UI 삽입
function injectUI() {
  // 이미 존재하는지 확인
  if (document.getElementById("text-summarizer-container")) {
    return;
  }

  console.log("요약 UI 삽입 시작");

  const extensionContainer = document.createElement("div");
  extensionContainer.id = "text-summarizer-container";
  extensionContainer.style.position = "fixed";
  extensionContainer.style.bottom = "20px";
  extensionContainer.style.right = "20px";
  extensionContainer.style.zIndex = "9999";
  extensionContainer.style.fontFamily = "Arial, sans-serif";

  const button = document.createElement("button");
  button.textContent = "AI 요약하기";
  button.style.padding = "10px 20px";
  button.style.backgroundColor = "#4285f4";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "4px";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  button.style.fontSize = "14px";
  button.style.transition = "background-color 0.3s";

  // 마우스 오버 효과
  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#3367d6";
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "#4285f4";
  });

  // 요약 버튼 클릭 이벤트
  button.addEventListener("click", async function () {
    try {
      // 로딩 상태 표시
      button.textContent = "요약 중...";
      button.disabled = true;
      button.style.backgroundColor = "#cccccc";

      // 1. 페이지 콘텐츠 추출
      const content = extractMainContent();

      if (!content || content.length < 100) {
        alert("페이지에서 요약할 충분한 텍스트를 찾을 수 없습니다.");
        // 버튼 상태 복원
        button.textContent = "AI 요약하기";
        button.disabled = false;
        button.style.backgroundColor = "#4285f4";
        return;
      }

      // 2. 설정 가져오기
      const settings = await new Promise<{ language: SupportedLanguage }>(
        (resolve) => {
          chrome.storage.local.get(["settings"], (result) => {
            resolve(result.settings || { language: "ko" });
          });
        }
      );

      // 3. 백그라운드 스크립트를 통해 API 호출
      const summary = await summarizeWithOpenAI(content, settings.language);
      // 4. 요약 결과 표시
      showSummaryPopup(summary);

      // 5. 버튼 상태 복원
      button.textContent = "AI 요약하기";
      button.disabled = false;
      button.style.backgroundColor = "#4285f4";
    } catch (error) {
      console.error("요약 처리 중 오류:", error);

      // 버튼 상태 복원
      button.textContent = "AI 요약하기";
      button.disabled = false;
      button.style.backgroundColor = "#4285f4";

      alert("요약 중 오류가 발생했습니다. 콘솔을 확인하세요.");
    }
  });

  extensionContainer.appendChild(button);
  document.body.appendChild(extensionContainer);

  console.log("요약 UI 삽입 완료");
}

// 요약 결과 표시 팝업
function showSummaryPopup(summary: string) {
  // 기존 팝업 제거
  const existingPopup = document.getElementById("text-summarizer-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  const existingOverlay = document.getElementById("text-summarizer-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // 새 팝업 생성
  const popup = document.createElement("div");
  popup.id = "text-summarizer-popup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.maxWidth = "600px";
  popup.style.width = "80%";
  popup.style.maxHeight = "80vh";
  popup.style.backgroundColor = "white";
  popup.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
  popup.style.borderRadius = "8px";
  popup.style.zIndex = "10000";
  popup.style.padding = "20px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.display = "flex";
  popup.style.flexDirection = "column";

  // 헤더
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "15px";
  header.style.paddingBottom = "10px";
  header.style.borderBottom = "1px solid #eee";

  const title = document.createElement("h3");
  title.textContent = "AI 텍스트 요약";
  title.style.margin = "0";
  title.style.color = "#333";
  title.style.fontSize = "18px";

  const closeButton = document.createElement("button");
  closeButton.textContent = "✕";
  closeButton.style.background = "none";
  closeButton.style.border = "none";
  closeButton.style.fontSize = "18px";
  closeButton.style.cursor = "pointer";
  closeButton.style.color = "#666";

  closeButton.addEventListener("click", () => {
    popup.remove();
    const overlay = document.getElementById("text-summarizer-overlay");
    if (overlay) overlay.remove();
  });

  header.appendChild(title);
  header.appendChild(closeButton);

  // 요약 내용
  const content = document.createElement("div");
  content.style.overflow = "auto";
  content.style.flex = "1";
  content.style.lineHeight = "1.5";
  content.style.fontSize = "16px";
  content.style.color = "#333";
  content.style.padding = "10px";
  content.style.maxHeight = "300px";
  content.style.backgroundColor = "#f5f5f5";
  content.style.borderRadius = "4px";
  content.style.whiteSpace = "pre-line";
  content.textContent = summary;

  // 푸터
  const footer = document.createElement("div");
  footer.style.marginTop = "15px";
  footer.style.paddingTop = "10px";
  footer.style.borderTop = "1px solid #eee";
  footer.style.textAlign = "right";
  footer.style.fontSize = "12px";
  footer.style.color = "#999";
  footer.textContent = "AI 텍스트 요약 도우미";

  // 팝업 조립
  popup.appendChild(header);
  popup.appendChild(content);
  popup.appendChild(footer);

  // 페이지에 추가
  document.body.appendChild(popup);

  // 배경 오버레이 생성
  const overlay = document.createElement("div");
  overlay.id = "text-summarizer-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "9999";

  // 오버레이 클릭 시 팝업 닫기
  overlay.addEventListener("click", () => {
    popup.remove();
    overlay.remove();
  });

  document.body.appendChild(overlay);
}

// DOM이 준비되면 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectUI);
} else {
  injectUI();
}

// 백업으로 load 이벤트도 listen
window.addEventListener("load", function () {
  console.log("window load 이벤트: UI 삽입 시도");
  injectUI();
});

// 메시지 리스너
chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  // 확장 프로그램 활성화/비활성화 처리
  if (message.action === "extractContent") {
    // summarizer.ts의 extractMainContent 함수 내용을 여기에 구현
    const content = extractMainContent();
    console.log("추출된 콘텐츠 길이:", content.length);
    sendResponse({ text: content });
  }

  if (message.type === "TOGGLE_EXTENSION") {
    const container = document.getElementById("text-summarizer-container");
    if (container) {
      container.style.display = message.enabled ? "block" : "none";
    }
    sendResponse({ success: true });
  } else if (message.type === "EXTRACT_CONTENT") {
    // 페이지 콘텐츠 추출 요청 처리
    try {
      const content = extractMainContent();
      sendResponse({ success: true, content: content });
    } catch (error) {
      console.error("콘텐츠 추출 중 오류:", error);
      sendResponse({ success: false, error: String(error) });
    }
    return true; // 비동기 응답을 위해 true 반환
  } else if (message.type === "SUMMARIZE_CONTENT") {
    try {
      // 1. 페이지 콘텐츠 추출
      const content = extractMainContent();

      if (!content || content.length < 100) {
        sendResponse({
          success: false,
          error: "페이지에서 요약할 충분한 텍스트를 찾을 수 없습니다.",
        });
        return true;
      }

      // 2. 기본 요약 생성
      const summary = await summarizeWithOpenAI(content, message.language);

      // 3. 응답 전송
      sendResponse({ success: true, summary: summary });
    } catch (error) {
      console.error("피용업: 요약 중 오류", error);
      sendResponse({
        success: false,
        error: `요약 중 오류가 발생했습니다: ${String(error)}`,
      });
    }
    return true; // 비동기 응답을 위해 true 반환
  }

  return true; // 비동기 응답을 위해 true 반환
});

export {}; // TypeScript 모듈 시스템 사용을 위한 빈 export
