const fs = require('fs');
const path = 'c:/Users/hiros/OneDrive/ドキュメント/Time Regulus_v3.1.2_Renovation_/script.js';

let content = fs.readFileSync(path, 'utf8');

// Fix 1: Remove misplaced block at 3524
const misplacedBlock = `  // Radarのマーカー生成
  const radarFace = document.getElementById("radarFace");
  if (radarFace && radarFace.querySelectorAll('.star-marker').length === 0) {
    for (let i = 0; i < 60; i++) {
      const dot = document.createElement("div");
      dot.className = "star-marker"; // クラス名を流用して二重生成を防止
      dot.style.position = "absolute";
      dot.style.top = "50%";
      dot.style.left = "50%";
      
      if (i % 5 !== 0) { // 5分刻み以外の細かいドット
        const angle = i * 6 * (Math.PI / 180);
        const radius = 135;
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius;
        dot.style.width = "2px";
        dot.style.height = "2px";
        dot.style.background = "rgba(0,255,128,0.3)";
        dot.style.borderRadius = "50%";
        dot.style.margin = "-1px 0 0 -1px";
        dot.style.transform = \`translate(\${x}px, \${y}px)\`;
      } else { // 0〜11のポイント（細い短い線）
        dot.style.width = "2px";
        dot.style.height = "10px";
        dot.style.background = "rgba(0,255,128,0.6)";
        dot.style.margin = "-5px 0 0 -1px";
        const angle = i * 6;
        dot.style.transform = \`rotate(\${angle}deg) translateY(-130px)\`;
      }
      radarFace.appendChild(dot);
    }
  }`;
content = content.replace(misplacedBlock, '');

// Fix 2: Update the original markers block
const originalBlock = `  // Radarのマーカー生成
  const radarFace = document.getElementById("radarFace");
  if (radarFace && radarFace.querySelectorAll('.star-marker').length === 0) {
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) { // 5分刻み以外の細かいドット
        const angle = i * 6 * (Math.PI / 180);
        const radius = 135;
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius;
        const dot = document.createElement("div");
        dot.className = "star-marker"; // クラス名を流用して二重生成を防止
        dot.style.position = "absolute";
        dot.style.width = "2px";
        dot.style.height = "2px";
        dot.style.background = "rgba(0,255,128,0.3)";
        dot.style.borderRadius = "50%";
        dot.style.top = "50%";
        dot.style.left = "50%";
        dot.style.margin = "-1px 0 0 -1px";
        dot.style.transform = \`translate(\${x}px, \${y}px)\`;
        radarFace.appendChild(dot);
      }
    }
  }`;

content = content.replace(new RegExp(originalBlock.replace(/[.*+?^$()|[\\]\\\\]/g, '\\\\$&'), 'g'), misplacedBlock);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed script.js successfully!');
