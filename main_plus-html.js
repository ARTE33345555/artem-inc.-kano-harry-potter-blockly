// ------------------------------------------------
//   СТАН ПАЛОЧКИ
// ------------------------------------------------
const wandState = {
  tiltX: 0,
  tiltY: 0
};

// ------------------------------------------------
//   ІСТОРІЯ ДІЙ
// ------------------------------------------------
const history = [];

// ------------------------------------------------
//   ОГОНЁК-КУРСОР
// ------------------------------------------------
const magicCursor = {
  x: 0,
  y: 0,
  size: 25,
  img: null,
  visible: true
};

// Завантаження картинки огонька
magicCursor.img = new Image();
magicCursor.img.src = "fire_cursor.png";

// ------------------------------------------------
//   СЛІЖЕННЯ ЗА МИШКОЮ
// ------------------------------------------------
document.addEventListener("mousemove", (e) => {
  magicCursor.x = e.clientX;
  magicCursor.y = e.clientY;
});

// ------------------------------------------------
//   ЯКЩО МИШІ НЕМА — ВИКОРИСТОВУЄТЬСЯ ПАЛОЧКА
// ------------------------------------------------
function updateMagicCursorFromWand() {
  magicCursor.x = canvas.width / 2 + wandState.tiltX * 10;
  magicCursor.y = canvas.height / 2 + wandState.tiltY * 10;
}

// ------------------------------------------------
//   РЕНДЕР CANVAS
// ------------------------------------------------
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Малюємо елементи історії
  for (const item of history) {
    if (item.type === "sprite") {
      ctx.drawImage(item.img, item.x, item.y, item.w, item.h);
    }
  }

  // Малюємо огонёк-курсор
  if (magicCursor.visible && magicCursor.img) {
    ctx.drawImage(
      magicCursor.img,
      magicCursor.x - magicCursor.size / 2,
      magicCursor.y - magicCursor.size / 2,
      magicCursor.size,
      magicCursor.size
    );
  }

  requestAnimationFrame(render);
}
render();

// ------------------------------------------------
//   НОВИЙ BLOCKLY БЛОК (твій)
// ------------------------------------------------
Blockly.defineBlocksWithJsonArray([
  {
    type: "if_luminus_mag",
    message0: "Якщо Маги Люминус Фон %1 Спрайт %2",
    args0: [
      { type: "field_dropdown", name: "BACKGROUND", options: [["Синій","#1e1f33"],["Фіолетовий","#6A0DAD"],["Зелений","#8eff99"]] },
      { type: "field_input", name: "SPRITE_URL", text: "sprite.png" }
    ],
    previousStatement: null,
    nextStatement: null,
    style: "motion_blocks"
  }
]);

// ------------------------------------------------
//   JAVASCRIPT ГЕНЕРАТОР БЛОКА (твій + мій)
// ------------------------------------------------
Blockly.JavaScript['if_luminus_mag'] = function(block) {
  const bg = block.getFieldValue('BACKGROUND');
  const sprite = block.getFieldValue('SPRITE_URL');
  return `
    // Зміна фону
    canvas.style.background='${bg}';

    // Додавання спрайта
    (function(){
      const img = new Image();
      img.src = '${sprite}';
      img.onload = ()=>history.push({
        type:'sprite',
        img:img,
        x: magicCursor.x,
        y: magicCursor.y,
        w: 50,
        h: 50
      });
    })();
  `;
};
