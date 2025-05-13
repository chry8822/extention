// 요약 모듈

// 지원하는 언어 타입 정의
export type SupportedLanguage = "ko" | "en" | "ja" | "zh";

// 텍스트 언어 감지 함수 (간단한 구현)
export const detectLanguage = (text: string): SupportedLanguage => {
  // 한글이 포함되어 있으면 한국어로 판단
  if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text)) return "ko";

  // 일본어 문자가 포함되어 있으면 일본어로 판단
  if (/[\u3040-\u309F|\u30A0-\u30FF]/.test(text)) return "ja";

  // 중국어 문자가 포함되어 있으면 중국어로 판단
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";

  // 기본값은 영어
  return "en";
};

/**
 * Ollama API를 사용하여 텍스트를 요약합니다.
 * @param text 요약할 텍스트
 * @param language 요약 언어 (ko, en, ja, zh)
 * @returns 요약 결과 텍스트
 * @throws Error API 호출 중 오류가 발생하면
 */
export async function summarizeWithOpenAI(
  text: string,
  language: SupportedLanguage
): Promise<string> {
  if (!text || text.length < 10) {
    throw new Error("요약할 텍스트가 너무 짧습니다.");
  }

  // 백그라운드 스크립트를 통해 호출
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        {
          type: "SUMMARIZE_API",
          text: text,
          language: language,
        },
        (response) => {
          const lastError = chrome.runtime.lastError;
          console.log("응답 수신", {
            success: response?.success,
            error: lastError,
          });

          if (lastError) {
            console.error("Chrome 런타임 오류:", lastError);
            reject(new Error(lastError.message));
          } else if (!response) {
            console.error("응답이 없습니다");
            reject(new Error("응답을 받지 못했습니다"));
          } else if (!response.success) {
            console.error("API 응답 오류:", response.error);
            reject(new Error(response.error || "API 호출 실패"));
          } else {
            console.log("요약 성공, 데이터 수신", response);
            resolve(response.summary);
          }
        }
      );
    } catch (err) {
      console.error("메시지 전송 실패:", err);
      reject(err);
    }
  });
}

// 페이지 본문 텍스트 추출 함수
/**
 * 웹 페이지의 본문을 추출하여 반환합니다.
 * @returns 추출된 텍스트
 * @throws Error 추출 중 오류가 발생하면
 * @description
 *  - article 태그 확인
 *  - 주요 컨텐츠 영역으로 추정되는 요소 확인 (main, .content, .article, .post, #content, .entry, [role="main"], .main-content, .page-content, .entry-content)
 *  - 페이지에서 가장 텍스트가 많은 div 찾기
 *  - body 전체 사용
 * 추출된 텍스트가 너무 길 경우 10,000자로 제한
 */
export const extractMainContent = (): string => {
  console.log("페이지 콘텐츠 추출 시작");
  let content = "";
  let source = "";

  // 1. nav, aside 요소를 제외하고 텍스트 추출하는 헬퍼 함수
  const getCleanText = (element: HTMLElement): string => {
    const excludedTags = [
      "NAV",
      "ASIDE",
      "nav",
      "aside",
      "footer",
      "header",
      "SCRIPT",
      "script",
      "style",
      "STYLE",
      "iframe",
      "IFRAME",
    ];
    const excludedClasses = [
      "snb_menu",
      "menu",
      "gnb",
      "ad",
      "ad_area",
      "nav_header",
      "list",
      "newvisit_history vst",
      "footer",
      "header",
      "gnb_bar",
      "right_content",
      "gall_listwrap list",
      "issue_wrap",
      "blind",
      "concept_wrap",
      "listwrap clear",
      "dctrend_ranking",
      "stickyunit",
      "dcfoot type1",
      "skip",
      "dcheader typea",
      "lately_gall",
      "visit_bookmark",
      "footer_wrap",
      "viewListArea",
      "naver_ad",
      "bundle",
      "fr gall_issuebox",
      "page_head clear",
      "issue_setting",
      "pop_info",
      "tab_menubox",
      "inner",
      "pop_wrap type3",
      "btn_apply",
      "btn_cancle",
      "pop_tipbox setting_list",
      "pop_head bg",
      "gall_useinfo",
      "adr_copy",
    ];

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        // 중요: 직계 부모뿐만 아니라 모든 상위 요소 확인
        let parent = node.parentElement;

        // 상위 요소들을 모두 확인
        while (parent) {
          // 태그 이름으로 확인
          if (excludedTags.includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // 클래스 이름으로 확인
          if (parent.classList) {
            for (const excludedClass of excludedClasses) {
              if (parent.classList.contains(excludedClass)) {
                return NodeFilter.FILTER_REJECT;
              }
            }
          }

          // 상위로 이동
          parent = parent.parentElement;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let text = "";
    while (walker.nextNode()) {
      text += walker.currentNode.textContent?.trim() + " ";
    }
    return text.trim().replace(/\s+/g, " ");
  };

  try {
    // 1. article 태그 확인 (일반적인 기사)
    const articles = document.getElementsByTagName("article");
    if (articles.length > 0) {
      content = getCleanText(articles[0]);
      source = "article 태그";
    }

    // 2. 주요 컨텐츠 영역으로 추정되는 요소 확인
    if (!content) {
      const contentSelectors = [
        "main",
        ".content",
        ".article",
        ".post",
        "#content",
        ".entry",
        '[role="main"]',
        ".main-content",
        ".page-content",
        ".entry-content",
      ];

      for (const selector of contentSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (
            element instanceof HTMLElement &&
            element.innerText.length > content.length
          ) {
            content = getCleanText(element);
            source = selector;
          }
        }
      }
    }

    // 3. 여전히 내용이 없으면 페이지에서 가장 텍스트가 많은 div 찾기
    if (!content || content.length < 200) {
      const divs = document.getElementsByTagName("div");
      let maxLength = 200; // 최소 200자 이상

      for (const div of divs) {
        if (div.innerText.length > maxLength) {
          maxLength = div.innerText.length;
          content = getCleanText(div);
          source = "최대 텍스트 div";
        }
      }
    }

    // 4. 최후의 방법: body 전체 사용
    if (!content) {
      content = getCleanText(document.body);
      source = "body 전체";
    }

    // 너무 긴 경우 일부만 사용 (10,000자 제한)
    if (content.length > 10000) {
      content = content.substring(0, 10000);
      console.log("콘텐츠가 너무 길어 10,000자로 제한됨");
    }

    return content;
  } catch (error) {
    console.error("콘텐츠 추출 중 오류:", error);
    return document.body.innerText.substring(0, 5000); // 오류 시 body 텍스트 일부 반환
  }
};

export {}; // TypeScript 모듈 시스템 사용을 위한 빈 export
