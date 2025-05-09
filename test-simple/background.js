// 백그라운드 스크립트
console.log('백그라운드 스크립트 로드됨');

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('백그라운드: 메시지 수신됨', message);
  
  // 응답 보내기
  sendResponse({
    success: true,
    message: '응답이 백그라운드에서 왔습니다',
    timestamp: new Date().toISOString()
  });
  
  return true;  // 비동기 응답을 위해 true 반환
});

// 설치 이벤트
chrome.runtime.onInstalled.addListener(function() {
  console.log('확장 프로그램이 설치/업데이트되었습니다');
});

// 전역 변수에 테스트 함수 추가
window.testFunction = function() {
  console.log('테스트 함수 호출됨');
  return 'test result';
};