
/* ==========================================================================
   スライドアニメーション付きスワイプナビゲーション
   ========================================================================== */
(function() {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;
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
    // ロック画面が表示中の場合はスワイプ無効
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
    // 右スワイプ (deltaX > 0) -> 左から新しい画面が来る
    if (deltaX > 0) {
      // 誤差の計算モードからは右スワイプで補正時刻計算モードへ
      if (current === currentScreensDict.errorMode) return { screen: currentScreensDict.correctionMode, func: window.showCorrectionMode };
      // 補正時刻計算モードからは右スワイプで結果一覧へ
      if (current === currentScreensDict.correctionMode) return { screen: currentScreensDict.resultListPage, func: window.showResultList };
    } 
    // 左スワイプ (deltaX < 0) -> 右から新しい画面が来る
    else if (deltaX < 0) {
      // 結果一覧からは左スワイプで補正時刻計算モードへ
      if (current === currentScreensDict.resultListPage) return { screen: currentScreensDict.correctionMode, func: window.backToCorrectionMode };
      // 補正時刻計算モードからは左スワイプでモード選択へ
      if (current === currentScreensDict.correctionMode) return { screen: currentScreensDict.modeSelect, func: window.backToModeSelect };
    }
    return null; // 指定されていない遷移は弾く
  };

  let targetFunc = null;

  document.addEventListener("touchstart", function(e) {
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
    
    // ロック画面やモード選択画面は完全に固定（スワイプ開始しない）
    if (!currentScreen || currentScreen === currentScreensDict.modeSelect) {
      isSwiping = false;
      return;
    }

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    
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
    if (!isSwiping || !currentScreen) return;
    
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
    
    // 定義されていないスワイプ方向の場合は画面を微動だにさせない（完全固定）
    if (!potentialTarget) {
      return;
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
    const targetBase = deltaX > 0 ? -window.innerWidth : window.innerWidth;
    targetScreen.style.transform = `translateX(${targetBase + deltaX}px)`;
    
  }, { passive: false });

  document.addEventListener("touchend", function(e) {
    if (!isSwiping || !currentScreen) return;
    isSwiping = false;
    
    if (!hasDeterminedDirection) {
      currentScreen.style.transform = "";
      return;
    }
    
    const deltaX = currentX - startX;
    
    // スワイプ先が存在しない方向だった場合は何もしない
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
      }, 300);
    } else {
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
      }, 300);
    }
    
    currentScreen = null;
    targetScreen = null;
  });
})();

