document.addEventListener("DOMContentLoaded", function() {

    // ------------------------
    // Canvas
    // ------------------------
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    // ------------------------
    // Состояние палочки
    // ------------------------
    const wandState = { tiltX: 0, tiltY: 0 };

    // ------------------------
    // История спрайтов
    // ------------------------
    const history = [];

    // ------------------------
    // Огнекурсор
    // ------------------------
    const magicCursor = { x: 0, y: 0, size: 25, img: null, visible: true };
    magicCursor.img = new Image();
    magicCursor.img.src = "fire_cursor.png";

    // ------------------------
    // Следим за мышкой
    // ------------------------
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        magicCursor.x = e.clientX - rect.left;
        magicCursor.y = e.clientY - rect.top;
    });

    // ------------------------
    // Используем палочку, если нет мышки
    // ------------------------
    function updateMagicCursorFromWand() {
        magicCursor.x = canvas.width / 2 + wandState.tiltX * 10;
        magicCursor.y = canvas.height / 2 + wandState.tiltY * 10;
    }

    // ------------------------
    // Render
    // ------------------------
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Рисуем историю спрайтов
        for(const item of history){
            if(item.type === 'sprite'){
                ctx.drawImage(item.img, item.x, item.y, item.w, item.h);
            }
        }

        // Рисуем огнекурсор
        if(magicCursor.visible && magicCursor.img){
            ctx.drawImage(
                magicCursor.img,
                magicCursor.x - magicCursor.size/2,
                magicCursor.y - magicCursor.size/2,
                magicCursor.size,
                magicCursor.size
            );
        }

        requestAnimationFrame(render);
    }
    render();

    // ------------------------
    // Blockly
    // ------------------------
    const workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        scrollbars: true,
        trashcan: true,
        renderer: 'zelos'
    });

    // ------------------------
    // Кастомный блок
    // ------------------------
    Blockly.defineBlocksWithJsonArray([
        {
            type: "if_luminus_mag",
            message0: "Если фон %1 и спрайт %2",
            args0: [
                { type: "field_dropdown", name: "BACKGROUND", options: [["Синий","#1e1f33"],["Фиолетовый","#6A0DAD"],["Зелёный","#8eff99"]] },
                { type: "field_input", name: "SPRITE_URL", text: "sprite.png" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "logic_blocks"
        }
    ]);

    Blockly.JavaScript['if_luminus_mag'] = function(block){
        const bg = block.getFieldValue('BACKGROUND');
        const sprite = block.getFieldValue('SPRITE_URL');
        return `
            canvas.style.background='${bg}';
            (function(){
                const img = new Image();
                img.src='${sprite}';
                img.onload = ()=>history.push({type:'sprite', img:img, x:magicCursor.x, y:magicCursor.y, w:50, h:50});
            })();
        `;
    };

    // ------------------------
    // Run / Stop код
    // ------------------------
    window.runCode = function() {
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        try {
            eval(code);
        } catch(e) {
            console.error(e);
        }
    };

    window.stopCode = function() {
        history.length = 0;
        ctx.clearRect(0,0,canvas.width,canvas.height);
    };

    // ------------------------
    // Модалка настроек
    // ------------------------
    window.closeSettings = function(){
        document.getElementById('settingsModal').style.display = 'none';
    };

});
