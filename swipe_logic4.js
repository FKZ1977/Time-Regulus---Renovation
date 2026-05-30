
/* ==========================================================================
   スライドアニメーション付きスワイプナビゲーション
   ========================================================================== */
(function() {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;
  let isTransitioning = false; // アニメーション中の連続スワイプ防止用
  let hasDeterminedDirection = false;
  
  let currentScreen = null;
  let targetScreen = null;
  let currentScreensDict = {};
  
  document.addEventListener("DOMContentLoaded", () => {
    currentScreensDict = {
      modeSelect: document.getElementById("modeSelect"),
      errorMode: document.getElementById("errorMode"),
      correctionMode: document.getElementById("correctionMode"),
      resultListPage: document.getElementById("resultListPage")
    };
  });

  const getVisibleScreen = () => {
    const lockScreen = document.getElementById("lockScreen");
    if (lockScreen && window.getComputedStyle(lockScreen).display !== "none") {
      return null;
    }

    for (const key in currentScreensDict) {
      const screen = currentScreensDict[key];
      if (screen && window.getComputedStyle(screen).display !== "none") {
        return screen;
      }
    }
    return null;
  };

  const getTargetScreenAndFunc = (current, deltaX) => {
    // 【修正】左スワイプ (deltaX < 0) -> 次へ進む (→の動き)
    if (deltaX < 0) {
      if (current === currentScreensDict.errorMode) return { screen: currentScreensDict.correctionMode, func: window.showCorrectionMode };
      if (current === currentScreensDict.correctionMode) return { screen: currentScreensDict.resultListPage, func: window.showResultList };
    } 
    // 【修正】右スワイプ (deltaX > 0) -> 前へ戻る (←の動き)
    else if (deltaX > 0) {
      if (current === currentScreensDict.resultListPage) return { screen: currentScreensDict.correctionMode, func: window.backToCorrectionMode };
      if (current === currentScreensDict.correctionMode) return { screen: currentScreensDict.modeSelect, func: window.backToModeSelect };
    }
    return null;
  };

  let targetFunc = null;

  document.addEventListener("touchstart", function(e) {
    if (isTransitioning) return; // 画面遷移中はスワイプをブロック
    if (typeof activeTimePickerGroup !== "undefined" && activeTimePickerGroup) return; 
    if (e.touches.length > 1) return;
    
    if (Object.keys(currentScreensDict).length === 0) {
        currentScreensDict = {
          modeSelect: document.getElementById("modeSelect"),
          errorMode: document.getElementById("errorMode"),
          correctionMode: document.getElementById("correctionMode"),
          resultListPage: document.getElementById("resultListPage")
        };
    }
    
    currentScreen = getVisibleScreen();
    
    // ロック画面・モード選択画面からはスワイプさせない
    if (!currentScreen || currentScreen === currentScreensDict.modeSelect) {
      isSwiping = false;
      return;
    }

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    
    // 画面端からのスワイプはブラウザネイティブの戻る動作と競合するため無視
    if (startX < 20 || startX > window.innerWidth - 20) {
      isSwiping = false;
      return;
    }

    isSwiping = true;
    hasDeterminedDirection = false;
    targetScreen = null;
    targetFunc = null;
    
    if (currentScreen) {
      currentScreen.style.transition = "none";
    }
  }, { passive: true });

  document.addEventListener("touchmove", function(e) {
    if (!isSwiping || !currentScreen || isTransitioning) return;
    
    currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    if (!hasDeterminedDirection) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        hasDeterminedDirection = true;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          isSwiping = false; 
          return;
        }
      } else {
        return; 
      }
    }
    
    const targetInfo = getTargetScreenAndFunc(currentScreen, deltaX);
    const potentialTarget = targetInfo ? targetInfo.screen : null;
    const potentialFunc = targetInfo ? targetInfo.func : null;
    
    if (!potentialTarget) {
      return; // 許可されていない方向の場合は画面を動かさない（固定）
    }
    
    if (targetScreen !== potentialTarget) {
      if (targetScreen) {
        targetScreen.style.display = "none";
      }
      targetScreen = potentialTarget;
      targetFunc = potentialFunc;
      
      targetScreen.style.transition = "none";
      targetScreen.style.position = "absolute";
      targetScreen.style.top = "0";
      targetScreen.style.left = "0";
      targetScreen.style.width = "100%";
      targetScreen.style.display = "block";
    }
    
    currentScreen.style.transform = `translateX(${deltaX}px)`;
    // deltaX < 0 (左スワイプ) なら target は 100vw の位置から引っ張ってくる
    // deltaX > 0 (右スワイプ) なら target は -100vw の位置から引っ張ってくる
    const targetBase = deltaX > 0 ? -window.innerWidth : window.innerWidth;
    targetScreen.style.transform = `translateX(${targetBase + deltaX}px)`;
    
  }, { passive: false });

  document.addEventListener("touchend", function(e) {
    if (!isSwiping || !currentScreen || isTransitioning) return;
    isSwiping = false;
    
    if (!hasDeterminedDirection) {
      currentScreen.style.transform = "";
      return;
    }
    
    const deltaX = currentX - startX;
    
    if (!targetScreen) {
      currentScreen.style.transform = "";
      return;
    }

    const threshold = window.innerWidth * 0.25; 
    
    currentScreen.classList.add("swipe-transition");
    if (targetScreen) targetScreen.classList.add("swipe-transition");
    
    currentScreen.style.transition = "";
    if (targetScreen) targetScreen.style.transition = "";

    if (Math.abs(deltaX) > threshold) {
      isTransitioning = true; // アニメーション開始ロック
      const finalTranslate = deltaX > 0 ? "100%" : "-100%";
      currentScreen.style.transform = `translateX(${finalTranslate})`;
      targetScreen.style.transform = `translateX(0px)`;
      
      setTimeout(() => {
        currentScreen.style.display = "none";
        currentScreen.style.transform = "";
        currentScreen.classList.remove("swipe-transition");
        
        targetScreen.style.position = "";
        targetScreen.style.top = "";
        targetScreen.style.left = "";
        targetScreen.style.width = "";
        targetScreen.style.transform = "";
        targetScreen.classList.remove("swipe-transition");
        
        if (typeof targetFunc === "function") {
          targetFunc();
        } else {
          if (targetScreen === currentScreensDict.resultListPage && typeof showResultList === "function") showResultList();
          else if (targetScreen === currentScreensDict.correctionMode && typeof backToCorrectionMode === "function") backToCorrectionMode();
          else if (targetScreen === currentScreensDict.modeSelect && typeof backToModeSelect === "function") backToModeSelect();
          else if (targetScreen === currentScreensDict.errorMode && typeof showErrorMode === "function") showErrorMode();
        }
        
        isTransitioning = false; // アニメーション完了でロック解除
      }, 300);
    } else {
      isTransitioning = true;
      currentScreen.style.transform = `translateX(0px)`;
      const initTranslate = deltaX > 0 ? "-100%" : "100%";
      targetScreen.style.transform = `translateX(${initTranslate})`;
      setTimeout(() => {
        targetScreen.style.display = "none";
        targetScreen.style.position = "";
        targetScreen.style.top = "";
        targetScreen.style.left = "";
        targetScreen.style.width = "";
        targetScreen.style.transform = "";
        targetScreen.classList.remove("swipe-transition");
        
        currentScreen.style.transform = "";
        currentScreen.classList.remove("swipe-transition");
        
        isTransitioning = false;
      }, 300);
    }
    
    currentScreen = null;
    targetScreen = null;
  });
})();

