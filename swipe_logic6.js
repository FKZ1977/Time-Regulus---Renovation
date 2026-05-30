
/* ==========================================================================
   スライドアニメーション付きスワイプナビゲーション (改修版)
   ========================================================================== */
(function() {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;
  let isTransitioning = false;
  let swipeDirectionAxis = null; 
  
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
      return { id: "lockScreen", el: lockScreen };
    }

    // modeSelectを最優先でチェック（リセット時などの重複表示対策）
    const modeSelect = document.getElementById("modeSelect");
    if (modeSelect && window.getComputedStyle(modeSelect).display !== "none") {
      return { id: "modeSelect", el: modeSelect };
    }

    for (const key in currentScreensDict) {
      const screen = currentScreensDict[key];
      if (screen && window.getComputedStyle(screen).display !== "none") {
        return { id: key, el: screen };
      }
    }
    return null;
  };

  const getTargetScreenAndFunc = (currentId, deltaX) => {
    if (deltaX > 0) {
      if (currentId === "errorMode") return { screen: currentScreensDict.correctionMode, func: window.showCorrectionMode };
      if (currentId === "correctionMode") return { screen: currentScreensDict.resultListPage, func: window.showResultList };
    } 
    else if (deltaX < 0) {
      if (currentId === "correctionMode") return { screen: currentScreensDict.modeSelect, func: window.backToModeSelect };
      if (currentId === "resultListPage") return { screen: currentScreensDict.correctionMode, func: window.backToCorrectionMode };
    }
    return null;
  };

  let targetFunc = null;

  document.addEventListener("touchstart", function(e) {
    if (isTransitioning) return; 
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
    
    // ダイレクトチェックによる確実なロック
    const lockScreen = document.getElementById("lockScreen");
    const modeSelect = document.getElementById("modeSelect");
    const isLockVisible = lockScreen && window.getComputedStyle(lockScreen).display !== "none";
    const isModeVisible = modeSelect && window.getComputedStyle(modeSelect).display !== "none";
    
    if (isLockVisible || isModeVisible) {
      isSwiping = false;
      return; 
    }

    const visibleInfo = getVisibleScreen();
    if (!visibleInfo) return;
    currentScreen = visibleInfo.el;
    
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    
    if (startX < 20 || startX > window.innerWidth - 20) {
      isSwiping = false;
      return;
    }

    isSwiping = true;
    swipeDirectionAxis = null;
    targetScreen = null;
    targetFunc = null;
    
    currentScreen.style.transition = "none";
  }, { passive: true });

  document.addEventListener("touchmove", function(e) {
    // 【最重要】DOMを直接チェックして確実にブロック（getVisibleScreenの誤検知を防ぐ）
    const lockScreen = document.getElementById("lockScreen");
    const modeSelect = document.getElementById("modeSelect");
    const isLockVisible = lockScreen && window.getComputedStyle(lockScreen).display !== "none";
    const isModeVisible = modeSelect && window.getComputedStyle(modeSelect).display !== "none";
    
    if (isLockVisible || isModeVisible) {
      e.preventDefault(); // いかなる状況でもスクロールを許さない
      return;
    }

    if (!isSwiping || isTransitioning) return;
    
    const visibleInfo = getVisibleScreen();
    if (!visibleInfo) return;
    const currentId = visibleInfo.id;
    
    currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    if (!swipeDirectionAxis) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          swipeDirectionAxis = "vertical";
          isSwiping = false; 
          return;
        } else {
          swipeDirectionAxis = "horizontal";
        }
      } else {
        return; 
      }
    }
    
    if (swipeDirectionAxis === "horizontal") {
      e.preventDefault();

      const targetInfo = getTargetScreenAndFunc(currentId, deltaX);
      const potentialTarget = targetInfo ? targetInfo.screen : null;
      const potentialFunc = targetInfo ? targetInfo.func : null;
      
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
    }
  }, { passive: false });

  document.addEventListener("touchend", function(e) {
    if (!isSwiping || isTransitioning) return;
    isSwiping = false;
    
    if (swipeDirectionAxis !== "horizontal") {
      if (currentScreen) currentScreen.style.transform = "";
      return;
    }
    
    const deltaX = currentX - startX;
    
    if (!targetScreen) {
      if (currentScreen) currentScreen.style.transform = "";
      return;
    }

    const threshold = window.innerWidth * 0.25; 
    
    currentScreen.classList.add("swipe-transition");
    if (targetScreen) targetScreen.classList.add("swipe-transition");
    
    currentScreen.style.transition = "";
    if (targetScreen) targetScreen.style.transition = "";

    if (Math.abs(deltaX) > threshold) {
      isTransitioning = true; 
      
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
        
        // 遷移先の初期化処理
        if (typeof targetFunc === "function") {
          targetFunc();
        } else {
          if (targetScreen === currentScreensDict.resultListPage && typeof showResultList === "function") showResultList();
          else if (targetScreen === currentScreensDict.correctionMode && typeof backToCorrectionMode === "function") backToCorrectionMode();
          else if (targetScreen === currentScreensDict.modeSelect && typeof backToModeSelect === "function") backToModeSelect();
          else if (targetScreen === currentScreensDict.errorMode && typeof showErrorMode === "function") showErrorMode();
        }
        
        setTimeout(() => { isTransitioning = false; }, 200);
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

