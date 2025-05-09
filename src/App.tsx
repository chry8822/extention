import { useState, useEffect } from "react";
import "./App.css";
import { extractMainContent } from "./summarizer";

// SupportedLanguage 타입 정의
type SupportedLanguage = "ko" | "en" | "ja" | "zh";

// 지원되는 언어 옵션
const LANGUAGE_OPTIONS = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];

function App() {
  const [message, setMessage] = useState(
    "이것은 테스트 텍스트입니다. Ollama API로 요약을 테스트합니다."
  );
  const [summary, setSummary] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("ko");
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState("준비됨");
  const [status, setStatus] = useState("");
  const [modelsInfo, setModelsInfo] = useState<string>("");

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log("컴포넌트 마운트됨");
    checkServiceWorker();
  }, []);

  // 서비스 워커 상태 확인
  const checkServiceWorker = () => {
    setLog("서비스 워커 상태 확인 중...");

    chrome.runtime.sendMessage({ type: "PING" }, (response) => {
      if (chrome.runtime.lastError) {
        setLog(`서비스 워커 비활성: ${chrome.runtime.lastError.message}`);
        setStatus("error");
      } else if (response && response.success) {
        setLog(`서비스 워커 활성: ${response.message}`);
        setStatus("success");

        // 모델 정보 가져오기
        fetchModelsInfo();
      } else {
        setLog("알 수 없는 응답");
        setStatus("warning");
      }
    });
  };

  // 모델 정보 가져오기
  const fetchModelsInfo = () => {
    chrome.runtime.sendMessage({ type: "GET_MODELS" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("모델 정보 가져오기 실패:", chrome.runtime.lastError);
      } else {
        setModelsInfo(JSON.stringify(response, null, 2));
      }
    });
  };

  // API 요청 전송
  const sendApiRequest = () => {
    setIsLoading(true);
    setSummary("");
    setLog("API 요청 전송 중...");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        setLog("활성 탭을 찾을 수 없습니다");
        setIsLoading(false);
        return;
      }

      // 콘텐츠 스크립트에 내용 추출 요청
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "extractContent" },
        (response) => {
          if (chrome.runtime.lastError) {
            setLog(`콘텐츠 스크립트 오류: ${chrome.runtime.lastError.message}`);
            setIsLoading(false);
            return;
          }

          if (!response || !response.text) {
            setLog("추출된 텍스트가 없습니다");
            setIsLoading(false);
            return;
          }

          const text = response.text;
          console.log("텍스트 미리보기:", text.substring(0, 100) + "...");

          // 이제 백그라운드 스크립트에 요약 요청
          chrome.runtime.sendMessage(
            {
              type: "SUMMARIZE_API",
              text: text,
              language: language,
              timestamp: new Date().toISOString(),
            },
            (apiResponse) => {
              setIsLoading(false);

              if (chrome.runtime.lastError) {
                setLog(`오류: ${chrome.runtime.lastError.message}`);
                setStatus("error");
              } else if (!apiResponse) {
                setLog("응답이 없습니다");
                setStatus("error");
              } else if (!apiResponse.success) {
                setLog(`API 오류: ${apiResponse.error || "알 수 없는 오류"}`);
                setStatus("error");
              } else {
                setLog("API 요청 성공");
                setStatus("success");
                setSummary(apiResponse.summary || "요약 결과가 없습니다");
              }
            }
          );
        }
      );
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        width: "400px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "20px", marginBottom: "15px" }}>
        AI 텍스트 요약 도우미
      </h1>

      {/* 언어 선택 */}
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}
        >
          요약 언어:
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 요약 버튼 */}
      <button
        onClick={sendApiRequest}
        disabled={isLoading || !message}
        style={{
          padding: "10px 16px",
          backgroundColor: isLoading || !message ? "#cccccc" : "#4285f4",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading || !message ? "not-allowed" : "pointer",
          width: "100%",
          fontWeight: "bold",
          marginBottom: "15px",
        }}
      >
        {isLoading ? "요약 중..." : "요약하기"}
      </button>

      {/* 요약 결과 */}
      {summary && (
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{ margin: "0 0 10px 0", fontSize: "16px", color: "black" }}
          >
            요약 결과:
          </h3>
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "black",
            }}
          >
            {summary}
          </div>
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#666",
          marginTop: "20px",
        }}
      >
        © 2025 AI 텍스트 요약 도우미
      </div>
    </div>
  );
}

export default App;
