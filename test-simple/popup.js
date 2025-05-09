// 팝업 스크립트
document.addEventListener('DOMContentLoaded', function() {
  const testBtn = document.getElementById('testBtn');
  const responseDiv = document.getElementById('response');
  
  testBtn.addEventListener('click', function() {
    responseDiv.textContent = '메시지 전송 중...';
    
    console.log('메시지 전송 시도 중...');
    
    try {
      chrome.runtime.sendMessage(
        { 
          type: 'TEST_MESSAGE',
          message: '테스트 메시지입니다',
          timestamp: new Date().toISOString()
        },
        function(response) {
          console.log('응답 수신:', response);
          
          if (chrome.runtime.lastError) {
            console.error('오류:', chrome.runtime.lastError);
            responseDiv.textContent = '오류: ' + chrome.runtime.lastError.message;
          } else if (!response) {
            responseDiv.textContent = '응답이 없습니다.';
          } else {
            responseDiv.textContent = '응답: ' + JSON.stringify(response, null, 2);
          }
        }
      );
      
      console.log('메시지 전송 완료, 응답 대기 중...');
    } catch (error) {
      console.error('예외 발생:', error);
      responseDiv.textContent = '예외: ' + error;
    }
  });
});