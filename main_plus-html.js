// ---------- Новые блоки ----------
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

// ---------- JS генератор ----------
Blockly.JavaScript['if_luminus_mag'] = function(block) {
  const bg = block.getFieldValue('BACKGROUND');
  const sprite = block.getFieldValue('SPRITE_URL');
  return `
    // Изменение фона
    canvas.style.background='${bg}';
    
    // Добавление спрайта в историю
    (function(){
      const img = new Image();
      img.src = '${sprite}';
      img.onload = ()=>history.push({type:'sprite', img:img, x:canvas.width/2 + wandState.tiltX, y:canvas.height/2 + wandState.tiltY, w:50, h:50});
    })();
  `;
};
