/* ========== ГЛОБАЛЬНІ ЗМІННІ ========== */
let isRunning = false;
let cursorX = 0;
let cursorY = 0;
let drawInterval;
let wandConnected = false;
let history = [];
let workspace;
let canvas, ctx;
let trailParticles = [];
let lastTrailTime = 0;
const trailInterval = 50;
let useWandPosition = false;
let bluetoothDevice, bluetoothServer, ledCharacteristic;

const wandState = {
    tiltX: 0,
    tiltY: 0,
    buttonPressed: false
};

const trailSettings = {
    type: 'fire',
    color: null,
    size: 1.0,
    enabled: true,
    particlesCount: 30,
    followSpeed: 0.15,
    trailLength: 100
};

/* ========== ТЕМА BLOCKLY ========== */
const DARK_THEME = Blockly.Theme.defineTheme('dark', {
    'base': Blockly.Themes.Classic,
    'blockStyles': {
        'start_blocks': {'colourPrimary':'#ffb347','colourSecondary':'#e6993e','colourTertiary':'#cca64d'},
        'motion_blocks': {'colourPrimary':'#8ec5ff','colourSecondary':'#6ab0f3','colourTertiary':'#aad1ff'},
        'flow_blocks': {'colourPrimary':'#ffd28e','colourSecondary':'#e6b86f','colourTertiary':'#ffd699'},
        'input_blocks': {'colourPrimary':'#8eff99','colourSecondary':'#6fdc77','colourTertiary':'#a4f3aa'},
        'variable_blocks': {'colourPrimary':'#ffde59','colourSecondary':'#e6c84d','colourTertiary':'#ffd699'}
    },
    'categoryStyles': {
        'logic_category': {'colour':'#ffd28e'},
        'loop_category': {'colour':'#ffb347'},
        'motion_category': {'colour':'#8ec5ff'},
        'sensor_category': {'colour':'#8eff99'},
        'wand_category': {'colour':'#ffde59'},
        'variable_category': {'colour':'#ffde59'}
    },
    'componentStyles': {
        'workspaceBackgroundColour': '#2d2f33',
        'toolboxBackgroundColour': '#1f2023',
        'toolboxForegroundColour': '#ffffff',
        'flyoutBackgroundColour': '#3a3c41',
        'flyoutForegroundColour': '#ffffff',
        'scrollbarColour': '#888',
        'scrollbarHoverColour': '#aaa'
    }
});

/* ========== ВИЗНАЧЕННЯ БЛОКІВ ========== */
function defineBlocks() {
    Blockly.defineBlocksWithJsonArray([
        { type:"start_program", message0:"Начало заклинания", nextStatement:null, style:"start_blocks" },
        { type:"wand_forever", message0:"Повторять вечно %1 %2", args0:[{type:"input_dummy"},{type:"input_statement",name:"DO"}], style:"flow_blocks" },
        { type:"wand_move_to_xy", message0:"Переместить курсор X:%1 Y:%2", args0:[
                {type:"input_value", name:"X", check:"Number"},
                {type:"input_value", name:"Y", check:"Number"}], previousStatement:null, nextStatement:null, style:"motion_blocks"
        },
        { type:"wand_draw_circle", message0:"Нарисовать круг радиус %1 цвет %2", args0:[
                {type:"input_value",name:"RADIUS",check:"Number"},
                {type:"field_colour", name:"COLOR", colour:"#6A0DAD"}], previousStatement:null, nextStatement:null, style:"motion_blocks"
        },
        { type:"wand_cast_color", message0:"Заклинание с цветом %1", args0:[
                {type:"field_dropdown", name:"COLOR", options:[["Синий","#8ec5ff"],["Зеленый","#8eff99"],["Красный","#ff8e8e"],["Random","random"]]}],
                previousStatement:null, nextStatement:null, style:"motion_blocks"
        },
        { type: "remove_fire", message0: "Удалить все объекты огня", previousStatement: null, nextStatement: null, style: "motion_blocks" },
        { type: "create_object", message0: "Создать Объект из URL %1 в X:%2 Y:%3", args0:[
                { type: "input_value", name: "SPRITE_URL", check: "String" },
                { type: "input_value", name: "X", check: "Number" },
                { type: "input_value", name: "Y", check: "Number" }
            ], previousStatement: null, nextStatement: null, style: "motion_blocks"
        },
        { type: "set_price", message0: "Сменить цену %1 на %2", args0:[
                { type: "field_variable", name: "VAR", variable: "цена" },
                { type: "input_value", name: "VALUE", check: "Number" }
            ], previousStatement: null, nextStatement: null, style: "variable_blocks"
        },
        { type:"wand_led_color", message0:"Изменить цвет индикатора %1", args0:[{type:"field_colour", name:"COLOR", colour:"#ffde59"}], previousStatement:null, nextStatement:null, style:"motion_blocks" },
        { type:"wand_led_set", message0:"Светодиод палочки цвет %1 яркость %2", args0:[
                { type: "field_colour", name: "COLOR", colour: "#ffde59" },
                { type: "field_number", name: "BRIGHT", value: 100, min:0, max:100 }
            ], previousStatement:null, nextStatement:null, style:"motion_blocks"
        },
        { type:"wand_led_signal", message0:"Сигнал LED %1", args0:[
                {type:"field_dropdown", name:"COLOR", options:[["Красный","red"],["Синий","blue"],["Зеленый","green"],["Случайный","random"]]}],
                previousStatement:null, nextStatement:null, style:"motion_blocks"
        },
        { type:"wand_up", message0:"Палочка вверх", output:"Boolean", style:"input_blocks" },
        { type:"wand_down", message0:"Палочка вниз", output:"Boolean", style:"input_blocks" },
        { type:"wand_left", message0:"Палочка влево", output:"Boolean", style:"input_blocks" },
        { type:"wand_right", message0:"Палочка вправо", output:"Boolean", style:"input_blocks" },
        { type:"wand_moved_x", message0:"Палочка сдвинулась по X", output:"Boolean", style:"input_blocks" },
        { type:"wand_moved_y", message0:"Палочка сдвинулась по Y", output:"Boolean", style:"input_blocks" },
        { type:"wait_seconds", message0:"Подождать %1 сек", args0:[{type:"input_value",name:"SECONDS",check:"Number"}], previousStatement:null, nextStatement:null, style:"flow_blocks" },
        { type:"math_number", message0:"%1", args0:[{type:"field_number",name:"NUM",value:0}], output:"Number", style:"input_blocks" },
        { type: "text", message0: "%1", args0: [{ type: "field_input", name: "TEXT", text: "" }], output: "String", style: "input_blocks" },
        
        /* НОВІ БЛОКИ */
        { type: "if_luminus_mag", message0: "Если %1 то Маги Люминус %2 фон %3 спрайт %4", args0:[
                { type: "field_dropdown", name: "CONDITION", options: [["палочка вверху","WAND_UP"],["палочка внизу","WAND_DOWN"],["всегда","ALWAYS"]] },
                { type: "field_dropdown", name: "MAGIC_TYPE", options: [["заклинание","SPELL"],["трансформация","TRANSFORM"],["исчезновение","DISAPPEAR"]] },
                { type: "field_dropdown", name: "BACKGROUND", options: [["Синий","#1e1f33"],["Фиолетовый","#6A0DAD"],["Зеленый","#8eff99"],["Огненный","#ff6b6b"]] },
                { type: "field_input", name: "SPRITE_URL", text: "sprite.png" }
            ], previousStatement: null, nextStatement: null, colour: 290
        },
        { type: "luminus_effect", message0: "Эффект Люминус %1 длительность %2 секунд", args0:[
                { type: "field_dropdown", name: "EFFECT", options: [["свечение","GLOW"],["пульсация","PULSE"],["вспышка","FLASH"]] },
                { type: "input_value", name: "DURATION", check: "Number" }
            ], previousStatement: null, nextStatement: null, colour: 210
        },
        { type: "set_trail_type", message0: "Установить тип следа: %1", args0:[
                { type: "field_dropdown", name: "TYPE", options: [["огонь","fire"],["искры","sparkles"],["радуга","rainbow"],["снег","snow"],["магия","magic"],["выключить","none"]] }
            ], previousStatement: null, nextStatement: null, colour: 230
        },
        { type: "set_trail_color", message0: "Установить цвет следа: %1", args0:[
                { type: "field_colour", name: "COLOR", colour: "#ff9900" }
            ], previousStatement: null, nextStatement: null, colour: 230
        },
        { type: "set_trail_size", message0: "Установить размер следа: %1", args0:[
                { type: "input_value", name: "SIZE", check: "Number" }
            ], previousStatement: null, nextStatement: null, colour: 230
        },
        { type: "clear_trail", message0: "Очистить след", previousStatement: null, nextStatement: null, colour: 230 },
        { type: "wand_get_x", message0: "Позиция палочки X", output: "Number", style: "input_blocks" },
        { type: "wand_get_y", message0: "Позиция палочки Y", output: "Number", style: "input_blocks" },
        { type: "use_wand_position", message0: "Использовать позицию палочки", previousStatement: null, nextStatement: null, style: "motion_blocks" }
    ]);
}

/* ========== ГЕНЕРАТОРИ КОДУ ========== */
function setupCodeGenerators() {
    Blockly.JavaScript['start_program'] = () => '';
    
    Blockly.JavaScript['wand_forever'] = block => {
        const branch = Blockly.JavaScript.statementToCode(block, 'DO');
        return `async function loop(){while(isRunning){${branch}await new Promise(r=>setTimeout(r,10));}}loop();`;
    };
    
    Blockly.JavaScript['wand_move_to_xy'] = block => {
        const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_NONE) || 0;
        const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_NONE) || 0;
        return `cursorX=${x}; cursorY=${y};`;
    };
    
    Blockly.JavaScript['wand_draw_circle'] = block => {
        const r = Blockly.JavaScript.valueToCode(block, 'RADIUS', Blockly.JavaScript.ORDER_NONE) || 10;
        const color = block.getFieldValue('COLOR');
        return `history.push({type:'circle',x:cursorX+canvas.width/2,y:cursorY+canvas.height/2,r:${r},c:'${color}'});`;
    };
    
    Blockly.JavaScript['wand_cast_color'] = block => {
        const color = block.getFieldValue('COLOR');
        return `let c='${color}'; if(c==='random'){c='#'+Math.floor(Math.random()*16777215).toString(16);} history.push({type:'circle',x:cursorX+canvas.width/2,y:cursorY+canvas.height/2,r:20,c:c});`;
    };
    
    Blockly.JavaScript['remove_fire'] = () => {
        return `history = history.filter(item => item.type !== 'circle');\n`;
    };
    
    Blockly.JavaScript['create_object'] = block => {
        const url = Blockly.JavaScript.valueToCode(block, 'SPRITE_URL', Blockly.JavaScript.ORDER_NONE) || '""';
        const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_NONE) || 0;
        const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_NONE) || 0;
        return `
            (function() {
                const img = new Image();
                img.src = ${url};
                img.onload = function() {
                    history.push({type:'sprite', img: img, x:(${x})+canvas.width/2, y:(${y})+canvas.height/2, w: 50, h: 50});
                };
            })();
        `;
    };
    
    Blockly.JavaScript['set_price'] = block => {
        const variable = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
        return `${variable} = ${value};\n`;
    };
    
    Blockly.JavaScript['wand_led_color'] = block => `sendLedColor('${block.getFieldValue('COLOR')}');`;
    
    Blockly.JavaScript['wand_led_set'] = block => `sendLedColor('${block.getFieldValue('COLOR')}', ${block.getFieldValue('BRIGHT')});`;
    
    Blockly.JavaScript['wand_led_signal'] = block => {
        const color = block.getFieldValue('COLOR');
        return `sendLedSignal('${color}');`;
    };
    
    Blockly.JavaScript['wand_up'] = () => [`wandState.tiltY>20`, Blockly.JavaScript.ORDER_ATOMIC];
    Blockly.JavaScript['wand_down'] = () => [`wandState.tiltY<-20`, Blockly.JavaScript.ORDER_ATOMIC];
    Blockly.JavaScript['wand_left'] = () => [`wandState.tiltX<-20`, Blockly.JavaScript.ORDER_ATOMIC];
    Blockly.JavaScript['wand_right'] = () => [`wandState.tiltX>20`, Blockly.JavaScript.ORDER_ATOMIC];
    Blockly.JavaScript['wand_moved_x'] = () => [`Math.abs(wandState.tiltX)>5`, Blockly.JavaScript.ORDER_ATOMIC];
    Blockly.JavaScript['wand_moved_y'] = () => [`Math.abs(wandState.tiltY)>5`, Blockly.JavaScript.ORDER_ATOMIC];
    
    Blockly.JavaScript['wait_seconds'] = block => {
        const sec = Blockly.JavaScript.valueToCode(block, 'SECONDS', Blockly.JavaScript.ORDER_NONE) || 1;
        return `await new Promise(r=>setTimeout(r,${sec}*1000));`;
    };
    
    Blockly.JavaScript['math_number'] = block => [Number(block.getFieldValue('NUM')), Blockly.JavaScript.ORDER_ATOMIC];
    
    Blockly.JavaScript['text'] = block => {
        const text = block.getFieldValue('TEXT');
        return [`'${text}'`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    /* НОВІ ГЕНЕРАТОРИ */
    Blockly.JavaScript['if_luminus_mag'] = block => {
        const condition = block.getFieldValue('CONDITION');
        const magicType = block.getFieldValue('MAGIC_TYPE');
        const bg = block.getFieldValue('BACKGROUND');
        const sprite = block.getFieldValue('SPRITE_URL');
        
        let conditionCode = '';
        switch(condition) {
            case 'WAND_UP': conditionCode = 'wandState.tiltY > 20'; break;
            case 'WAND_DOWN': conditionCode = 'wandState.tiltY < -20'; break;
            case 'ALWAYS': conditionCode = 'true'; break;
        }
        
        return `
            if (${conditionCode}) {
                document.getElementById('canvasBox').style.backgroundColor = '${bg}';
                (function(){
                    const img = new Image();
                    img.src = '${sprite}';
                    img.onload = function() {
                        history.push({
                            type: 'sprite',
                            img: img,
                            x: canvas.width/2,
                            y: canvas.height/2,
                            w: 60,
                            h: 60,
                            magicType: '${magicType}'
                        });
                    };
                })();
            }
        `;
    };
    
    Blockly.JavaScript['luminus_effect'] = block => {
        const effect = block.getFieldValue('EFFECT');
        const duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        
        return `
            if ('${effect}' === 'FLASH') {
                const original = document.getElementById('canvasBox').style.backgroundColor;
                document.getElementById('canvasBox').style.backgroundColor = '#ffffff';
                setTimeout(() => {
                    document.getElementById('canvasBox').style.backgroundColor = original;
                }, 300);
            }
        `;
    };
    
    Blockly.JavaScript['set_trail_type'] = block => {
        const type = block.getFieldValue('TYPE');
        if (type === 'none') {
            return `trailSettings.enabled = false;\n`;
        }
        return `trailSettings.type = '${type}';\ntrailSettings.enabled = true;\n`;
    };
    
    Blockly.JavaScript['set_trail_color'] = block => {
        const color = block.getFieldValue('COLOR');
        return `trailSettings.color = '${color}';\n`;
    };
    
    Blockly.JavaScript['set_trail_size'] = block => {
        const size = Blockly.JavaScript.valueToCode(block, 'SIZE', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        return `trailSettings.size = ${size};\n`;
    };
    
    Blockly.JavaScript['clear_trail'] = () => `clearAllTrails();\n`;
    
    Blockly.JavaScript['wand_get_x'] = () => [`wandState.tiltX`, Blockly.JavaScript.ORDER_ATOMIC];
    Blockly.JavaScript['wand_get_y'] = () => [`wandState.tiltY`, Blockly.JavaScript.ORDER_ATOMIC];
    Blockly.JavaScript['use_wand_position'] = () => `useWandPosition = true;\n`;
}

/* ========== КЛАС ЧАСТИНКИ СЛІДУ ========== */
class TrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        this.life = 1;
        this.fadeSpeed = 0.01 + Math.random() * 0.02;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.5 + 0.2;
        this.color = this.getColorForType();
        this.createdAt = Date.now();
    }

    getColorForType() {
        const type = trailSettings.type;
        const customColor = trailSettings.color;
        
        if (customColor) {
            return this.hexToRgb(customColor);
        }
        
        switch(type) {
            case 'fire':
                return [[255,100,0],[255,50,0],[255,150,0],[255,200,100]][Math.floor(Math.random()*4)];
            case 'sparkles':
                return [[255,255,200],[200,255,255],[255,200,255],[200,255,200]][Math.floor(Math.random()*4)];
            case 'snow':
                return [255,255,255];
            case 'magic':
                return [[138,197,255],[142,255,153],[255,142,142],[255,222,89]][Math.floor(Math.random()*4)];
            case 'rainbow':
                const hue = Date.now() * 0.001 + Math.random() * Math.PI * 2;
                return this.hslToRgb(hue % (Math.PI * 2), 1, 0.5);
            default:
                return [255,100,0];
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255,100,0];
    }

    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
    }

    update(targetX, targetY) {
        switch(trailSettings.type) {
            case 'fire':
                this.x += Math.sin(this.angle) * this.speed;
                this.y -= this.speed * 2;
                this.angle += (Math.random() - 0.5) * 0.2;
                break;
            case 'sparkles':
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.angle += 0.05;
                break;
            case 'rainbow':
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.angle += 0.03;
                this.color = this.hslToRgb((Date.now()*0.001 + this.angle) % (Math.PI*2), 1, 0.5);
                break;
            case 'snow':
                this.x += (Math.random() - 0.5) * 0.5;
                this.y += this.speed;
                break;
            case 'magic':
                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 5) {
                    this.x += dx * 0.02;
                    this.y += dy * 0.02;
                }
                this.size = Math.sin(Date.now()*0.001 + this.angle) * 3 + 5;
                break;
        }
        
        this.life -= this.fadeSpeed;
        this.size *= 0.99;
    }

    draw() {
        if (this.life <= 0) return;
        
        const [r, g, b] = this.color;
        const alpha = this.life;
        const size = this.size * trailSettings.size;
        
        ctx.save();
        
        switch(trailSettings.type) {
            case 'sparkles':
                ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`;
                ctx.shadowBlur = 10;
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.beginPath();
                for (let i=0; i<5; i++) {
                    const angle = (Math.PI*2/5)*i;
                    const spike = size*1.5;
                    const x2 = this.x + Math.cos(angle)*spike;
                    const y2 = this.y + Math.sin(angle)*spike;
                    if (i===0) ctx.moveTo(x2,y2);
                    else ctx.lineTo(x2,y2);
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'snow':
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, size, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = `rgba(200,230,255,${alpha*0.7})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x-size, this.y);
                ctx.lineTo(this.x+size, this.y);
                ctx.moveTo(this.x, this.y-size);
                ctx.lineTo(this.x, this.y+size);
                ctx.stroke();
                break;
            default:
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size);
                if (trailSettings.type === 'fire') {
                    gradient.addColorStop(0, `rgba(255,255,200,${alpha})`);
                    gradient.addColorStop(0.5, `rgba(${r},${g},${b},${alpha*0.7})`);
                    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
                } else {
                    gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
                    gradient.addColorStop(0.7, `rgba(${r},${g},${b},${alpha*0.5})`);
                    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
                }
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, size, 0, Math.PI*2);
                ctx.fill();
        }
        
        ctx.restore();
    }
}

/* ========== ФУНКЦІЇ ДЛЯ СЛІДУ ========== */
function clearAllTrails() {
    trailParticles = [];
}

function updateTrail(targetX, targetY) {
    if (!trailSettings.enabled) return;
    
    const now = Date.now();
    
    if (now - lastTrailTime > trailInterval) {
        for (let i=0; i<3; i++) {
            const offsetX = (Math.random()-0.5)*20;
            const offsetY = (Math.random()-0.5)*20;
            trailParticles.push(new TrailParticle(targetX+offsetX, targetY+offsetY));
        }
        lastTrailTime = now;
    }
    
    trailParticles = trailParticles.filter(particle => {
        particle.update(targetX, targetY);
        return particle.life > 0 && particle.size > 0.5;
    });
    
    if (trailParticles.length > 500) {
        trailParticles = trailParticles.slice(-500);
    }
}

function drawTrail() {
    trailParticles.forEach(particle => {
        particle.draw();
    });
}

/* ========== CANVAS ТА РЕНДЕР ========== */
let trailTargetX, trailTargetY;

function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    trailTargetX = canvas.width / 2;
    trailTargetY = canvas.height / 2;
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        trailTargetX = e.clientX - rect.left;
        trailTargetY = e.clientY - rect.top;
        wandState.tiltX = Math.round((trailTargetX/canvas.width)*200-100);
        wandState.tiltY = Math.round((trailTargetY/canvas.height)*200-100);
    });
    
    canvas.addEventListener('mouseleave', () => {
        trailTargetX = canvas.width/2;
        trailTargetY = canvas.height/2;
        wandState.tiltX = 0;
        wandState.tiltY = 0;
    });
}

function draw() {
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (useWandPosition && wandConnected) {
        trailTargetX = canvas.width/2 + wandState.tiltX*(canvas.width/200);
        trailTargetY = canvas.height/2 + wandState.tiltY*(canvas.height/200);
    }
    
    updateTrail(trailTargetX, trailTargetY);
    
    history.forEach(item => {
        if (item.type === 'circle') {
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.r, 0, Math.PI*2);
            ctx.fillStyle = item.c;
            ctx.fill();
        } else if (item.type === 'sprite' && item.img && item.img.complete) {
            const drawX = item.x - item.w/2;
            const drawY = item.y - item.h/2;
            ctx.drawImage(item.img, drawX, drawY, item.w, item.h);
        }
    });
    
    drawTrail();
}

function resizeCanvas() {
    const box = document.getElementById('canvasBox');
    canvas.width = box.clientWidth - 8;
    canvas.height = box.clientHeight - 8;
    trailTargetX = canvas.width/2;
    trailTargetY = canvas.height/2;
    clearAllTrails();
    draw();
}

function updateCursor() {
    if (isRunning) {
        cursorX = wandState.tiltX;
        cursorY = wandState.tiltY;
    }
    requestAnimationFrame(updateCursor);
}

/* ========== ОСНОВНІ ФУНКЦІЇ ========== */
function runCode() {
    if (isRunning) return;
    isRunning = true;
    history = [];
    cursorX = wandState.tiltX;
    cursorY = wandState.tiltY;
    clearInterval(drawInterval);
    drawInterval = setInterval(draw, 33);
    
    const code = Blockly.JavaScript.workspaceToCode(workspace);
    try {
        (async () => {
            window.trailSettings = trailSettings;
            window.clearAllTrails = clearAllTrails;
            window.wandState = wandState;
            window.useWandPosition = useWandPosition;
            await eval(code);
        })();
    } catch (e) {
        console.error('Ошибка выполнения кода:', e);
    }
}

function stopCode() {
    isRunning = false;
    clearInterval(drawInterval);
}

/* ========== НАЛАШТУВАННЯ ========== */
function setupSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });
    
    window.closeSettings = function() {
        settingsModal.style.display = 'none';
    };
}

async function connectBluetooth() {
    try {
        if (!navigator.bluetooth) {
            throw new Error('Bluetooth не поддерживается в этом браузере');
        }
        
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service', 'generic_access']
        });
        
        bluetoothServer = await bluetoothDevice.gatt.connect();
        console.log('Подключено к', bluetoothDevice.name);
        wandConnected = true;
        useWandPosition = true;
        alert('Устройство подключено: ' + bluetoothDevice.name);
        
    } catch (e) {
        console.error(e);
        alert('Ошибка подключения: ' + e.message);
    }
}

function emulateConnection() {
    wandConnected = true;
    useWandPosition = true;
    alert('Эмуляция подключения активна. Используйте мышь для управления палочкой.');
}

function changeLanguage() {
    alert('Смена языка (функция в разработке)');
}

function sendLedColor(color, brightness = 100) {
    console.log(`LED: цвет ${color}, яркость ${brightness}%`);
}

function sendLedSignal(color) {
    let c = color;
    if (c === 'random') {
        c = '#' + Math.floor(Math.random()*16777215).toString(16);
    }
    console.log('Сигнал LED:', c);
    sendLedColor(c);
}

/* ========== ІНІЦІАЛІЗАЦІЯ ========== */
function init() {
    defineBlocks();
    setupCodeGenerators();
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        theme: DARK_THEME,
        grid: {spacing:20, length:3, colour:'#3a3c41', snap:true},
        trashcan: true
    });
    
    initCanvas();
    setupSettings();
    updateCursor();
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    drawInterval = setInterval(draw, 33);
    
    console.log('Kano Wand Coding Kit инициализирован!');
}

/* ========== ЗАВАНТАЖЕННЯ ========== */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/* ========== ЕКСПОРТ ГЛОБАЛЬНИХ ЗМІННИХ ========== */
window.runCode = runCode;
window.stopCode = stopCode;
window.connectBluetooth = connectBluetooth;
window.emulateConnection = emulateConnection;
window.changeLanguage = changeLanguage;
window.sendLedColor = sendLedColor;
window.sendLedSignal = sendLedSignal;
