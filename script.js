const currentVersion = "2.1.3";
let lastError = null;
let hasCalculated = false;
let reverseMode = "toStandard";
let hasCalculatedError = false;
let resultHistory = [];
let isStandardOnTop = false; // 標準時刻が上に配置されているかを示す状態変数
const QR_CODE_URL_BASE = "https://fkz1977.github.io/Time-Regulus/";

function checkPass() {
  const inputField = document.getElementById("passcode");
  const input = inputField.value;
  const correct = "164";
  const errorMessage = document.getElementById("error");

  if (input === correct) {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("modeSelect").style.display = "block";
    inputField.blur();
    inputField.style.border = "";
    errorMessage.innerText = "";
    gtag('event', 'unlock_success'); // Google Analyticsイベント
  } else {
    errorMessage.innerText = "暗証番号が違います";
    inputField.style.border = "2px solid red";
    inputField.value = "";
    inputField.focus();
    generateKeypad();
  }
}

function generateKeypad() {
  const keypad = document.getElementById("keypad");
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const shuffled = numbers.sort(() => Math.random() - 0.5);
  keypad.innerHTML = "";

  shuffled.forEach(num => {
    const btn = document.createElement("button");
    btn.innerText = num;
    btn.onclick = () => {
      const input = document.getElementById("passcode");
      input.value += num;
    };
    keypad.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // 起動時のポップアップ
  if (localStorage.getItem("lastVersion") !== currentVersion) {
    alert("Time RegulusはV2.1.3です！");
    localStorage.setItem("lastVersion", currentVersion);
  }

  const passInput = document.getElementById("passcode");
  if (passInput) {
    passInput.focus();
    passInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        checkPass();
      }
    });
  }

  generateKeypad();

  populateSeconds("standardSeconds");
  populateSeconds("displaySeconds");
  populateSeconds("reverseDisplaySeconds");
  populateErrorDropdowns();

  // 誤差計算の自動化のためのリスナー設定
  const errorInputs = [
    "standardDate", "standardTime", "displayDate", "displayTime", "standardSeconds", "displaySeconds"
  ];
  errorInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", calculateError);
      el.addEventListener("change", calculateError);
    }
  });


  // 結果一覧の復元
  const savedHistory = localStorage.getItem('resultHistory');
  if (savedHistory) {
    const parsedHistory = JSON.parse(savedHistory);
    resultHistory = parsedHistory.map(group => ({
      ...group,
      entries: group.entries.map(entry => ({
        ...entry,
        base: new Date(entry.base),
        result: new Date(entry.result)
      }))
    }));
  }
  if (resultHistory.length > 0) {
    document.getElementById("showListLink").style.display = "block";
  }

  const reverseInputs = [
    "errorDays", "errorTime", "errorSeconds",
    "errorDirection", "reverseDisplayDate", "reverseDisplayTime", "reverseDisplaySeconds"
  ];
  reverseInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", handleReverseCalculation);
      el.addEventListener("change", handleReverseCalculation);
    }
  });
});

/**
 * 結果履歴をlocalStorageに保存する
 */
function saveResultHistory() {
  localStorage.setItem('resultHistory', JSON.stringify(resultHistory));
}


function populateSeconds(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  // 既存のオプションをクリア
  select.innerHTML = ""; 

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "ss"; // 「秒」から「ss」へ変更
  select.appendChild(defaultOption);

  for (let i = 0; i <= 59; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = i.toString().padStart(2, '0');
    select.appendChild(option);
  }
}

function populateErrorDropdowns() {
  const secondSelect = document.getElementById("errorSeconds");
  if (!secondSelect) return;

  // オプションをクリア
  secondSelect.innerHTML = "";

  // 初期値の ss を追加
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "ss";
  secondSelect.appendChild(defaultOption);

  for (let i = 0; i <= 59; i++) {
    const secOpt = document.createElement("option");
    secOpt.value = i;
    secOpt.text = i.toString().padStart(2, '0');
    secondSelect.appendChild(secOpt);
  }
}

function setNowToStandard() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = now.getSeconds();

  const dateVal = `${yyyy}-${mm}-${dd}`;
  const timeVal = `${hh}:${min}`;

  document.getElementById("standardDate").value = dateVal;
  document.getElementById("standardTime").value = timeVal;
  document.getElementById("standardSeconds").value = sec;

  calculateError();
}

function showErrorMode() {
  document.getElementById("modeSelect").style.display = "none";
  document.getElementById("errorMode").style.display = "block";
}

function showCorrectionMode() { 
  document.getElementById("modeSelect").style.display = "none"; 
  document.getElementById("correctionMode").style.display = "block";
  if (lastError) { 
    applyLastErrorToReverseInputs();
  }
  reverseMode = "toStandard";
  toggleReverseMode(false);
}

function backToModeSelect() {
  document.getElementById("errorMode").style.display = "none";
  document.getElementById("correctionMode").style.display = "none";
  document.getElementById("resultListPage").style.display = "none";
  document.getElementById("modeSelect").style.display = "block";
  document.getElementById("resetConfirmContainer").style.display = "none"; 
}

function backToCorrectionMode() {
  document.getElementById("resultListPage").style.display = "none";
  document.getElementById("correctionMode").style.display = "block";
}

/**
 * アプリをリセットする
 */
function resetApp(onlyInputs = false) {
  
  // 入力内容のリセット処理
  document.getElementById("displayDate").value = "";
  document.getElementById("displayTime").value = "";
  document.getElementById("standardDate").value = "";
  document.getElementById("standardTime").value = "";
  document.getElementById("displaySeconds").value = "";
  document.getElementById("standardSeconds").value = "";
  document.getElementById("result").innerHTML = "";
  document.getElementById("toReverseButton").style.display = "none";
  
  document.getElementById("errorDays").value = "";
  document.getElementById("errorTime").value = "";
  document.getElementById("errorSeconds").value = "";
  setDirection("late");
  document.getElementById("reverseDisplayDate").value = "";
  document.getElementById("reverseDisplayTime").value = "";
  document.getElementById("reverseDisplaySeconds").value = "";
  document.getElementById("reverseResult").innerHTML = "";

  lastError = null;
  hasCalculated = false;
  reverseMode = "toStandard";
  hasCalculatedError = false;

  if (isStandardOnTop) {
    swapErrorModeInputs(); // isStandardOnTopをfalseに戻すために実行
  } else {
     const nowButton = document.getElementById("standardNowButton");
     const standardSeconds = document.getElementById("standardSeconds");
     nowButton.style.display = "inline-block";
     standardSeconds.disabled = false;
     standardSeconds.style.pointerEvents = 'auto';
     standardSeconds.classList.remove('seconds-fixed-00'); // スタイルを戻す
     standardSeconds.value = "";
  }
  
  toggleReverseMode(false);

  if (onlyInputs) { 
     resultHistory = [];
     localStorage.removeItem('resultHistory');
     document.getElementById("showListLink").style.display = "none";
  } else {
     return;
  }
}

/**
 * 入力情報のリセット確認ボタンを表示する
 */
function showResetConfirmation() {
  document.getElementById("errorMode").style.display = "none";
  document.getElementById("correctionMode").style.display = "none";
  document.getElementById("resultListPage").style.display = "none";
  document.getElementById("modeSelect").style.display = "block";
  document.getElementById("resetConfirmContainer").style.display = "block";
}

/**
 * 入力情報を消去し、初期画面に戻る
 */
function resetAppAndReturnToLock() {
  resetApp(true); 

  document.getElementById("modeSelect").style.display = "none";
  document.getElementById("lockScreen").style.display = "block";
  
  document.getElementById("passcode").value = "";
  document.getElementById("passcode").focus();

  document.getElementById("resetConfirmContainer").style.display = "none"; 

  alert("全てのリセットが完了しました。初期画面に戻ります。");
}

/**
 * 誤差計算モードで表示時刻と標準時刻の入力フィールドを入れ替える
 */
function swapErrorModeInputs() {
  const displayGroup = document.getElementById("errorModeDisplayInputGroup");
  const standardGroup = document.getElementById("errorModeStandardInputGroup");
  const modeCard = displayGroup.parentElement;
  const nowButton = document.getElementById("standardNowButton");
  const standardSeconds = document.getElementById("standardSeconds");
  const swapButtonWrapper = document.querySelector('.swap-btn').parentElement; // ⇅ボタンの親div

  // 既存のアニメーションクラスをクリア
  displayGroup.className = "input-group";
  standardGroup.className = "input-group";

  const isMovingStandardUp = !isStandardOnTop;

  // 1. アニメーションクラスの適用（OUT）
  if (isMovingStandardUp) {
    displayGroup.classList.add("animate-down-out");
    standardGroup.classList.add("animate-up-out");
  } else {
    displayGroup.classList.add("animate-up-out");
    standardGroup.classList.add("animate-down-out");
  }

  // 2. DOM操作と機能変更をsetTimeout内で実行
  setTimeout(() => {
    
    if (isMovingStandardUp) {
      // 標準時刻を上 (isStandardOnTop = true) にする
      modeCard.insertBefore(standardGroup, displayGroup); 
      modeCard.insertBefore(swapButtonWrapper, displayGroup);
      
      // 機能の変更 (標準時刻が上)
      nowButton.style.display = "none";
      standardSeconds.value = "0"; // 00秒に固定
      standardSeconds.disabled = true; // 無効化
      standardSeconds.style.pointerEvents = 'none'; // 無効化の視覚的強調
      standardSeconds.classList.add('seconds-fixed-00'); // 新しいスタイル適用
      
    } else {
      // 標準時刻を下 (isStandardOnTop = false) に戻す
      modeCard.insertBefore(displayGroup, standardGroup);
      modeCard.insertBefore(swapButtonWrapper, standardGroup);
      
      // 機能の復元 (標準時刻が下)
      nowButton.style.display = "inline-block"; // NOWボタン表示
      standardSeconds.disabled = false; // 有効化
      standardSeconds.style.pointerEvents = 'auto'; // 有効化
      standardSeconds.classList.remove('seconds-fixed-00'); // スタイルを削除
      standardSeconds.value = ""; // 「ss」に戻す (初期値)
    }
    
    // 状態更新
    isStandardOnTop = isMovingStandardUp;

    // 3. 入れ替え後のフェードインクラスを適用
    displayGroup.classList.remove("animate-down-out", "animate-up-out");
    standardGroup.classList.remove("animate-down-out", "animate-up-out");

    if (isMovingStandardUp) {
      standardGroup.classList.add("animate-up-in");
      displayGroup.classList.add("animate-down-in");
    } else {
      standardGroup.classList.add("animate-down-in");
      displayGroup.classList.add("animate-up-in");
    }
    
    // アニメーション終了後にクラスをクリア
    setTimeout(() => {
      displayGroup.classList.remove("animate-up-in", "animate-down-in");
      standardGroup.classList.remove("animate-up-in", "animate-down-in");
      calculateError(); // 入れ替え後にも計算を試みる
    }, 300);

  }, 300); // 0.3秒のアニメーション後にDOM操作
}


function calculateError() {
  const standardDateVal = document.getElementById("standardDate").value;
  const standardTimeVal = document.getElementById("standardTime").value;
  const displayDateVal = document.getElementById("displayDate").value;
  const displayTimeVal = document.getElementById("displayTime").value;
  
  const standardSecValue = document.getElementById("standardSeconds").value; 
  const displaySecValue = document.getElementById("displaySeconds").value;
  
  const resultElement = document.getElementById("result");
  const toReverseButton = document.getElementById("toReverseButton");
  
  // --- 入力チェック ---
  
  const missingStandardInputs = [];
  const missingDisplayInputs = [];
  
  // 1. 標準時刻の入力欄チェック
  if (!standardDateVal) {
    missingStandardInputs.push("年月日");
  }
  if (!standardTimeVal) {
    missingStandardInputs.push("時分");
  }
  
  // 2. 表示時刻の入力欄チェック
  if (!displayDateVal) {
    missingDisplayInputs.push("年月日");
  }
  if (!displayTimeVal) {
    missingDisplayInputs.push("時分");
  }
  
  // 秒の入力チェックに必要な変数の定義
  // isStandardOnTop が true の場合、standardSecValue は "0" に固定されている
  const isStandardSecValid = isStandardOnTop ? (standardSecValue === "0") : (standardSecValue !== "" && standardSecValue !== "ss" && standardSecValue !== "秒");
  const isDisplaySecValid = (displaySecValue !== "" && displaySecValue !== "ss" && displaySecValue !== "秒");

  // 3. 標準時刻の秒入力チェック
  if (!isStandardSecValid) {
    missingStandardInputs.push("秒");
  }
  
  // 4. 表示時刻の秒入力チェック
  if (!isDisplaySecValid) {
    missingDisplayInputs.push("秒");
  }
  
  // すべての入力が揃っていない場合
  if (missingStandardInputs.length > 0 || missingDisplayInputs.length > 0) {
    
    // 標準時刻と表示時刻の両方で「年月日」「時分」「秒」が不足しているかチェック
    const isTotallyEmpty = (isStandardOnTop ?
        (!standardDateVal && !standardTimeVal && !displayDateVal && !displayTimeVal && !isDisplaySecValid) :
        (!standardDateVal && !standardTimeVal && !displayDateVal && !displayTimeVal && !isStandardSecValid && !isDisplaySecValid)
    );
    
    let messageContent;
    let messageStyle = `font-size: 14px; color: #FFFF00; font-weight: bold; line-height: 1.5;`;

    if (isTotallyEmpty) {
        const firstLine = isStandardOnTop ? "標準時刻から誤差を算出" : "表示時刻から誤差を算出";
        messageContent = `
            ${firstLine}<br>
            <span style="font-size: 14px; color: var(--text-sub); font-weight: normal; line-height: 1.5;">
                年月日、時分、秒を入力してください
            </span>
        `;
        messageStyle = `font-size: 16px; color: var(--accent); font-weight: bold; line-height: 1.5; text-decoration: none;`; 

    } else {
        const standardMessage = missingStandardInputs.length > 0
          ? `標準時刻: ${missingStandardInputs.join(", ")}が不足`
          : "";
          
        const displayMessage = missingDisplayInputs.length > 0
          ? `表示時刻: ${missingDisplayInputs.join(", ")}が不足`
          : "";

        let finalMessageLines = [];
        
        if (isStandardOnTop) {
            if (standardMessage) finalMessageLines.push(standardMessage);
            if (displayMessage) finalMessageLines.push(displayMessage);
        } else {
            if (displayMessage) finalMessageLines.push(displayMessage);
            if (standardMessage) finalMessageLines.push(standardMessage);
        }
        
        messageContent = finalMessageLines.join("<br>");
        messageStyle = `font-size: 14px; color: #FFFF00; font-weight: bold; line-height: 1.5;`; 
    }
    
    resultElement.innerHTML = `
        <span style="${messageStyle}">
            ${messageContent}
        </span>
    `;
    
    toReverseButton.style.display = "none";
    hasCalculatedError = false;
    return;
  }
  
  // すべての入力が揃っている
  hasCalculatedError = true;

  const standardSec = Number(standardSecValue);
  const displaySec = Number(displaySecValue);

  // iOS/Androidでの互換性を高めるため、ISO 8601形式の文字列（T区切り）を生成してパース
  const standardDateStr = `${standardDateVal}T${standardTimeVal}:${String(standardSec).padStart(2, '0')}`;
  const displayDateStr = `${displayDateVal}T${displayTimeVal}:${String(displaySec).padStart(2, '0')}`;

  const standard = new Date(standardDateStr);
  const display = new Date(displayDateStr);

  const diffMs = standard.getTime() - display.getTime(); // 標準 - 表示
  const diffAbsMs = Math.abs(diffMs);
  
  const isLate = diffMs > 0; // 標準 > 表示 なら、表示時刻は遅れている (isLate = true)
  const isFast = diffMs < 0; // 標準 < 表示 なら、表示時刻は進んでいる (isFast = true)

  const totalSeconds = Math.floor(diffAbsMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (totalSeconds === 0) {
    resultElement.innerHTML = `
      <span style="color: var(--accent); font-weight: bold;">Precision Sync!</span><br>
      <span style="color: var(--text-sub); font-size: 15px;">表示時刻は標準時刻と完全に一致しています。</span>
    `;
    document.getElementById("toReverseButton").style.display = "none";
    lastError = null;
    return;
  }

  const parts = [];
  if (days > 0) parts.push(`${days}日`);
  if (hours > 0) parts.push(`${hours}時間`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (seconds > 0) parts.push(`${seconds}秒`);

  let directionText;
  let directionColor;

  if (isFast) {
    directionText = "進んでいます。";
    directionColor = "var(--error-late-color)"; // 太文字の赤
  } else {
    directionText = "遅れています。";
    directionColor = "var(--error-early-color)"; // 太文字の黄緑
  }

  resultElement.innerHTML = `
    <span style="color: var(--accent); font-weight: bold;">${parts.join("")}</span><br>
    <span style="color: ${directionColor}; font-weight: bold;">${directionText}</span>
  `;

  gtag('event', 'calculate_error'); 

  lastError = { days, hours, minutes, seconds, isFast };
  document.getElementById("toReverseButton").style.display = "block";
}

function setDirection(value) {
  const select = document.getElementById("errorDirection");
  if (!select) return;
  
  select.value = value;
  
  const btnLate = document.getElementById("btnLate");
  const btnEarly = document.getElementById("btnEarly");
  
  if (value === "late") {
    btnLate.classList.add("active-late");
    btnEarly.classList.remove("active-early");
  } else {
    btnLate.classList.remove("active-late");
    btnEarly.classList.add("active-early");
  }
  
  // 変更イベントを発火させて再計算をトリガー
  const event = new Event('change', { bubbles: true });
  select.dispatchEvent(event);
}

function applyLastErrorToReverseInputs() {
  if (!lastError) return;
  document.getElementById("errorDays").value = lastError.days || 0;
  
  // hh:mm 形式にフォーマットして errorTime に代入
  const padH = String(lastError.hours || 0).padStart(2, '0');
  const padM = String(lastError.minutes || 0).padStart(2, '0');
  document.getElementById("errorTime").value = `${padH}:${padM}`;
  
  document.getElementById("errorSeconds").value = lastError.seconds || 0;
  
  // UIトグルの同期と計算実行
  setDirection(lastError.isFast ? "late" : "early");
}

function switchToCorrectionMode() {
  document.getElementById("errorMode").style.display = "none";
  document.getElementById("correctionMode").style.display = "block";

  const prevSeconds = document.getElementById("reverseDisplaySeconds").value;
  populateSeconds("reverseDisplaySeconds");
  if (prevSeconds !== "" && prevSeconds !== "ss" && prevSeconds !== "--") {
    document.getElementById("reverseDisplaySeconds").value = prevSeconds;
  }

  applyLastErrorToReverseInputs();
  reverseMode = "toStandard";
  toggleReverseMode(false); 
}

function toggleReverseMode(doToggle = true) {
  const toggleBtn = document.getElementById("reverseModeToggleBtn");
  const label = document.getElementById("reverseTimeLabel");
  
  if (doToggle) {
    reverseMode = reverseMode === "toStandard" ? "toDisplay" : "toStandard";
  }

  toggleBtn.innerText = "⇆切替";

  if (reverseMode === "toDisplay") {
    label.innerHTML = '<span style="color: var(--toggle-bg); font-weight: bold;">探している時刻:</span>'; 
    toggleBtn.classList.add("active-toggle-pink");
    toggleBtn.classList.remove("active-toggle");
  } else {
    label.innerHTML = '<span style="color: var(--accent); font-weight: bold;">表示時刻:</span>'; 
    toggleBtn.classList.remove("active-toggle-pink");
    toggleBtn.classList.add("active-toggle"); 
  }

  handleReverseCalculation();
}

function handleReverseCalculation() {
  const resultElement = document.getElementById("reverseResult");
  resultElement.innerHTML = "";

  const days = Number(document.getElementById("errorDays").value || 0);
  const errorTimeVal = document.getElementById("errorTime").value;
  const seconds = Number(document.getElementById("errorSeconds").value || 0);
  const direction = document.getElementById("errorDirection").value;

  let hours = 0;
  let minutes = 0;
  if (errorTimeVal) {
    const parts = errorTimeVal.split(":");
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
  }

  const timeDateVal = document.getElementById("reverseDisplayDate").value;
  const timeTimeVal = document.getElementById("reverseDisplayTime").value;
  const timeSec = document.getElementById("reverseDisplaySeconds").value;

  const hasError = (days > 0) || (errorTimeVal !== "") || (seconds > 0);
  const hasTime = timeDateVal && timeTimeVal && timeSec !== "" && timeSec !== "ss" && timeSec !== "--";

  document.getElementById("addToListButton").style.display = hasTime && hasError ? "inline-block" : "none";

  if (!hasError && !hasTime) {
    resultElement.innerText = "時刻と誤差を入力してください";
    return;
  }

  // 時間入力項目が一部不足している場合に親切なエラーを表示
  if (!hasTime && hasError) {
    const missing = [];
    if (!timeDateVal) missing.push("年月日");
    if (!timeTimeVal) missing.push("時分");
    if (timeSec === "" || timeSec === "ss" || timeSec === "--") missing.push("秒");
    
    if (missing.length === 3) {
      resultElement.innerText = reverseMode === "toDisplay"
        ? "探している時刻を入力してください"
        : "表示時刻を入力してください";
    } else {
      resultElement.innerText = `${reverseMode === "toDisplay" ? "探している時刻" : "表示時刻"}: ${missing.join(", ")}が不足`;
    }
    return;
  }

  if (hasTime && !hasError) {
    resultElement.innerText = "補正に使う誤差を入力してください";
    return;
  }

  const baseTimeStr = `${timeDateVal}T${timeTimeVal}:${String(timeSec).padStart(2, '0')}`;
  const baseTime = new Date(baseTimeStr);

  const totalMs = ((days * 86400) + (hours * 3600) + (minutes * 60) + seconds) * 1000;
  const isDisplayFast = direction === "late";

  let resultTimeMs;
  if (reverseMode === "toStandard") {
    resultTimeMs = baseTime.getTime() + (isDisplayFast ? -totalMs : totalMs);
  } else {
    resultTimeMs = baseTime.getTime() + (isDisplayFast ? totalMs : -totalMs);
  }

  const resultTime = new Date(resultTimeMs);

  gtag('event', 'calculate_correction'); 

  const baseStr = formatDate(baseTime, true);
  const resultStr = formatDate(resultTime, true);
  
  const isToStandard = reverseMode === "toStandard";
  const resultBgColor = isToStandard ? "var(--result-standard-bg)" : "var(--result-display-bg)";
  const resultBorderColor = isToStandard ? "var(--accent)" : "var(--toggle-bg)";
  const resultColor = isToStandard ? "var(--accent)" : "var(--toggle-text)";

  const baseLabel = isToStandard ? "表示時刻" : "探している時刻";
  const resultLabel = isToStandard ? "補正時刻" : "表示時刻";

  resultElement.style.border = `2px solid ${resultBorderColor}`;
  resultElement.style.backgroundColor = resultBgColor;
  resultElement.style.color = 'var(--text-main)'; 

  resultElement.innerHTML = `
    <div style="padding: 0 10px;">
      <p style="margin: 0; line-height: 1.5;">${baseLabel}が</p>
      <div style="background-color: var(--bg-dark); border: 1px solid ${resultBorderColor}; border-radius: 6px; padding: 6px 10px; margin: 4px 0; display: inline-block;">
        <strong style="color: ${resultColor};">${baseStr}</strong>
      </div>
      <p style="margin: 0; line-height: 1.5;">のとき</p>
      <p style="margin: 10px 0 0; line-height: 1.5;">${resultLabel}は</p>
      <div style="background-color: var(--bg-dark); border: 1px solid ${resultBorderColor}; border-radius: 6px; padding: 6px 10px; margin: 4px 0; display: inline-block;">
        <strong style="color: ${resultColor};">${resultStr}</strong>
      </div>
      <p style="margin: 0; line-height: 1.5;">である</p>
    </div>
  `;

  document.getElementById("showListLink").style.display = "block";

  const result = {
    id: Date.now(), 
    error: { days, hours, minutes, seconds, direction },
    mode: reverseMode,
    base: baseTime,
    result: resultTime
  };
  window.latestResult = result;

  // 計算結果出力時および数値変更時の画面自動押し上げ（iOS対応・ブレのない固定スクロール）
  setTimeout(() => {
    const listLink = document.getElementById("showListLink");
    const addBtn = document.getElementById("addToListButton");

    // 対象となる要素を選択（「結果一覧を表示」リンクがあればそこまで、無ければ「記録する」ボタン）
    const targetEl = (listLink && listLink.style.display !== "none") ? listLink : addBtn;

    if (targetEl && targetEl.style.display !== "none") {
      // 1. 標準スクロール（PC・Android用）
      targetEl.scrollIntoView({ behavior: "smooth", block: "end" });

      // 2. 【スマートフォーカス】二重フォーカスを回避しつつ、iOSの画面押し上げを安全に強制発動
      if (document.activeElement !== targetEl) {
        targetEl.focus();
      }

      // 3. 【ブレ防止】ドキュメント絶対最下部（scrollHeight）への物理固定スクロール
      // 座標計算のズレを物理的に無くすため、コンテンツの最下部へスッとスクロールさせます
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
    }
  }, 120);
}

function addResultToList() {
  const r = window.latestResult;
  if (!r) return;

  const padH = String(r.error.hours || 0).padStart(2, '0');
  const padM = String(r.error.minutes || 0).padStart(2, '0');
  const errorKey = `${r.error.days}-${padH}-${padM}-${r.error.seconds}-${r.error.direction}`;
  
  let group = resultHistory.find(g => g.errorKey === errorKey);

  if (!group) {
    group = {
      errorKey,
      error: r.error,
      entries: []
    };
    resultHistory.push(group);
  }
  
  // 重複チェック
  const baseMs = r.base.getTime();
  const resultMs = r.result.getTime();
  const isDuplicate = group.entries.some(entry => 
    entry.base.getTime() === baseMs && 
    entry.result.getTime() === resultMs && 
    entry.mode === r.mode
  );

  if (isDuplicate) {
    const msg = document.getElementById("recordSuccessMessage");
    const originalText = msg.innerText;
    msg.innerText = "既に記録されています";
    msg.style.display = 'inline-block';
    msg.classList.remove('fade-out');
    msg.classList.add('fade-in-out');
    setTimeout(() => {
        msg.classList.remove('fade-in-out');
        msg.classList.add('fade-out');
        setTimeout(() => {
            msg.style.display = 'none';
            msg.classList.remove('fade-out');
            msg.innerText = originalText; 
        }, 500); 
    }, 1000); 
    return;
  }
  
  const newEntry = {
    id: Date.now(),
    base: r.base, 
    result: r.result, 
    mode: r.mode 
  };
  group.entries.push(newEntry);
  
  saveResultHistory();

  gtag('event', 'add_to_list'); 

  renderResultList();
  
  if (resultHistory.length > 0) {
      const listLink = document.getElementById("showListLink");
      listLink.style.display = "block"; 
      listLink.innerText = "結果一覧を表示 →"; 
  }

  // 成功メッセージ表示アニメーション
  const msg = document.getElementById("recordSuccessMessage");
  msg.innerText = "✔ 追加しました";
  msg.style.display = 'inline-block';
  msg.classList.remove('fade-out');
  msg.classList.add('fade-in-out');
  setTimeout(() => {
      msg.classList.remove('fade-in-out');
      msg.classList.add('fade-out');
      setTimeout(() => {
          msg.style.display = 'none';
          msg.classList.remove('fade-out');
      }, 500); 
  }, 1000); 
}

function showResultList() {
    document.getElementById("correctionMode").style.display = "none";
    document.getElementById("resultListPage").style.display = "block";
    renderResultList();
}

function renderResultList() {
  const container = document.getElementById("resultListContainer");
  container.innerHTML = "";
  
  if (resultHistory.length === 0) {
    container.innerHTML = "<p style='color: var(--text-sub); text-align: center;'>記録された結果はありません。</p>";
    document.getElementById("showListLink").style.display = "none";
    return;
  }

  resultHistory.forEach(group => {
    const { days, hours, minutes, seconds, direction } = group.error;
    const errorText = `${days || 0}日${hours || 0}時間${minutes || 0}分${seconds || 0}秒（${direction === "late" ? "進み" : "遅れ" }）`;
    
    const entriesByMode = group.entries.reduce((acc, entry) => {
      if (!acc[entry.mode]) {
        acc[entry.mode] = [];
      }
      acc[entry.mode].push(entry);
      return acc;
    }, {});
    
    Object.keys(entriesByMode).forEach(mode => {
      entriesByMode[mode].sort((a, b) => a.base.getTime() - b.base.getTime());
    });

    const outerBox = document.createElement("div");
    outerBox.className = "result-list-group-outer";
    outerBox.style.padding = "16px";
    outerBox.style.marginBottom = "24px";
    outerBox.style.border = '2px solid var(--text-sub)';
    outerBox.style.borderRadius = "12px";
    outerBox.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
    outerBox.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

    const title = document.createElement("h3");
    title.innerHTML = `<strong>補正に使った誤差：</strong>${errorText}`;
    title.style.color = 'var(--accent)';
    title.style.marginBottom = "16px";
    title.style.borderBottom = "1px dashed var(--text-sub)";
    title.style.paddingBottom = "10px";
    outerBox.appendChild(title);

    ['toStandard', 'toDisplay'].forEach(mode => {
      const modeEntries = entriesByMode[mode];
      if (!modeEntries || modeEntries.length === 0) return;

      const isToStandard = mode === 'toStandard';
      const baseLabel = isToStandard ? "表示時刻" : "探している時刻";
      const resultLabel = isToStandard ? "補正時刻" : "表示時刻";
      const resultColor = isToStandard ? "var(--accent)" : "var(--toggle-text)"; 
      const borderColor = isToStandard ? "var(--accent)" : "var(--toggle-bg)"; 
      const bgColor = isToStandard ? "rgba(0, 255, 224, 0.05)" : "rgba(255, 0, 170, 0.05)";

      const innerBox = document.createElement("div");
      innerBox.className = "result-list-group-inner";
      innerBox.style.border = `1px solid ${borderColor}`;
      innerBox.style.backgroundColor = bgColor;
      innerBox.style.borderRadius = "8px";
      innerBox.style.padding = "12px";
      innerBox.style.marginBottom = "12px";
      innerBox.style.textAlign = "left";

      const modeHeader = document.createElement("div");
      modeHeader.innerHTML = `<strong style="color: ${borderColor};">${baseLabel} → ${resultLabel} の計算</strong>`;
      modeHeader.style.marginBottom = "8px";
      modeHeader.style.paddingBottom = "4px";
      innerBox.appendChild(modeHeader);

      modeEntries.forEach(entry => {
        const line = document.createElement("div");
        line.style.marginBottom = "6px";
        line.style.display = "flex";
        line.style.justifyContent = "space-between";
        line.style.alignItems = "center";
        
        const baseStr = formatDate(entry.base, true);
        const resultStr = formatDate(entry.result, true);

        const textSpan = document.createElement("span");
        textSpan.innerHTML = `
          <span style="font-size: 15px; color: var(--text-sub);">${baseStr}</span>
          <span style="font-size: 14px; color: var(--text-sub);">→</span>
          <span style="font-size: 16px; font-weight: bold; color: ${resultColor};">${resultStr}</span>
        `;
        line.appendChild(textSpan);
        
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerText = "削除";
        deleteBtn.onclick = () => deleteResultById(entry.id); 
        line.appendChild(deleteBtn);
        
        innerBox.appendChild(line);
      });

      outerBox.appendChild(innerBox);
    });

    container.appendChild(outerBox);
  });
}

function deleteResultById(idToDelete) {
  let isDeleted = false;
  
  resultHistory = resultHistory.map(group => {
    const initialLength = group.entries.length;
    group.entries = group.entries.filter(entry => entry.id !== idToDelete);
    if (group.entries.length < initialLength) {
      isDeleted = true;
    }
    return group;
  }).filter(group => group.entries.length > 0); 

  if (isDeleted) {
    saveResultHistory();
    renderResultList();
  }
}


function formatDate(date, includeSeconds = false) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  
  if (includeSeconds) {
    return `${y}/${m}/${d} ${h}:${min}:${s}`;
  }
  return `${y}/${m}/${d} ${h}:${min}`;
}

function showInformationPage() {
  document.getElementById("lockScreen").style.display = "none";
  document.getElementById("informationPage").style.display = "block";
}

function backToLockScreen() {
  document.getElementById("informationPage").style.display = "none";
  document.getElementById("qrCodePage").style.display = "none"; 
  document.getElementById("lockScreen").style.display = "block";
}

function showQRCodePage() {
  document.getElementById("informationPage").style.display = "none";
  document.getElementById("qrCodePage").style.display = "block";
}

function closeQRCodePage() {
  document.getElementById("qrCodePage").style.display = "none";
  document.getElementById("informationPage").style.display = "block";
}

// ======================
// PWA 更新通知ロジック 
// ======================

let newWorker;
const updateNotification = document.getElementById('updateNotification');
const updateButton = document.getElementById('updateButton');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => {
                console.log('Service Worker 登録成功:', reg.scope);

                reg.addEventListener('updatefound', () => {
                    newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New content available, show update prompt');
                            updateNotification.style.display = 'block'; 
                        }
                    });
                });
            })
            .catch(error => {
                console.log('Service Worker 登録失敗:', error);
            });
    });

    if (updateButton) {
        updateButton.addEventListener('click', () => {
            if (newWorker) {
                newWorker.postMessage({ action: 'skipWaiting' });
            }
        });
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}