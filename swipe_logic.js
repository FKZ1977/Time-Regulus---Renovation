
/* ==========================================================================
   補正時刻の計算モード ⇆ 結果一覧画面 のスワイプナビゲーション
   ========================================================================== */
let swipeStartX = 0;
let swipeStartY = 0;

document.addEventListener("touchstart", function(e) {
  if (typeof activeTimePickerGroup !== "undefined" && activeTimePickerGroup) return;
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", function(e) {
  if (typeof activeTimePickerGroup !== "undefined" && activeTimePickerGroup) return;
  const swipeEndX = e.changedTouches[0].clientX;
  const swipeEndY = e.changedTouches[0].clientY;
  
  const deltaX = swipeEndX - swipeStartX;
  const deltaY = swipeEndY - swipeStartY;
  
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
    const correctionMode = document.getElementById("correctionMode");
    const resultListPage = document.getElementById("resultListPage");
    
    if (!correctionMode || !resultListPage) return;
    
    const isCorrectionVisible = window.getComputedStyle(correctionMode).display !== "none";
    const isResultListVisible = window.getComputedStyle(resultListPage).display !== "none";
    
    if (deltaX < 0 && isCorrectionVisible) {
      showResultList();
    }
    else if (deltaX > 0 && isResultListVisible) {
      backToCorrectionMode();
    }
  }
}, { passive: true });

