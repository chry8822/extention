# chrome extension

## AI 텍스트 요약 도우미 TEST

토큰 제한 없이 테스트 하기위해 ai서버를 로컬로 실행합니다.
ollama + proxy server를 사용합니다. (POST시 403오류 발생 , GET은 정상)

### 환경 설정

1. ollama 설치 (현재 적용 LLM 버전 llama3:8b)
2. ollama 서버 실행
3. proxy server 실행

### 적용 방법

1. npm run build
2. Chrome -> chrome://extensions/
3. 우측 상단에 "개발자 모드"를 켜주세요.
4. 우측 상단에 "압축해제된 확장 프로그램을 로드합니다."를 클릭합니다.
5. ./dist 폴더를 선택합니다.

### 확인 하기

1. 예)) 뉴스페이지 진입
2. 엑세스된 확장프로그램에서 해당 익스텐션 클릭
3. 언어 선택후 요약하기 버튼 클릭
