"use strict";
function showEl(el) {
    el.classList.remove("hide");
}
function hideEl(el) {
    el.classList.add("hide");
}
async function start() {
    class SoundManager {
        constructor() {
            this.audio = {};
            this.audioCtx = new (window.AudioContext
                || window.webkitAudioContext)();
            this.sources = [];
        }
        produce(name, pitch = 1) {
            const soundBuffer = this.audio[name];
            if (!soundBuffer) {
                return;
            }
            if (this.audioCtx.state === "suspended") {
                const timeout = 1000;
                const callTime = performance.now();
                this.audioCtx.resume()
                    .then(() => {
                    if (callTime + timeout > performance.now()) {
                        this.playSoundF(soundBuffer, pitch);
                    }
                });
            }
            else {
                this.playSoundF(soundBuffer, pitch);
            }
        }
        play(name, pitch = 1) {
        }
        playSoundF(soundBuffer, pitch) {
            const source = this.audioCtx.createBufferSource();
            source.buffer = soundBuffer;
            if (pitch !== 1)
                source.playbackRate.value = pitch;
            source.connect(this.audioCtx.destination);
            source.start(0);
        }
    }
    const soundManager = new SoundManager();
    const images = {};
    const files = {};
    const resourcesToLoad = {
        images: {
            "blankTile": "assets/blankTile.svg",
            "red": "assets/red.svg",
            "green": "assets/green.svg",
            "blue": "assets/blue.svg",
            "yellow": "assets/yellow.svg",
            "bomb-f1": "assets/bomb-f1.svg",
            "bomb-f2": "assets/bomb-f2.svg",
            "red_ball": "assets/red_ball.svg",
            "green_ball": "assets/green_ball.svg",
            "blue_ball": "assets/blue_ball.svg",
            "yellow_ball": "assets/yellow_ball.svg",
            "row_block-particle": "assets/row_block-particle.svg",
            "row_block-1": "assets/row_block-1.svg",
            "row_block-2": "assets/row_block-2.svg",
            "row_block-3": "assets/row_block-3.svg",
            "overflow_warning_effect": "assets/overflow_warning_effect.svg",
            "field_background": "assets/field_background.svg",
            "cover_background": "assets/cover_background.svg",
            "window_instructions-text": "assets/static_instructions-text.svg",
            "window-frame1": "assets/static-frame1.svg",
            "window-frame2": "assets/static-frame2.svg",
            "window-frame3": "assets/static-frame3.svg",
            "window-frame4": "assets/static-frame4.svg",
            "text_pause": "assets/text_pause.svg",
            "button_play": "assets/button_play.svg",
            "button_play-p": "assets/button_play-p.svg",
            "button_left": "assets/button_left.svg",
            "button_left-p": "assets/button_left-p.svg",
            "button_left-disabled": "assets/button_left-disabled.svg",
            "button_right": "assets/button_right.svg",
            "button_right-p": "assets/button_right-p.svg",
            "button_right-disabled": "assets/button_right-disabled.svg",
            "button_pause": "assets/button_pause.svg",
            "button_pause-p": "assets/button_pause-p.svg",
            "button_continue": "assets/button_continue.svg",
            "button_continue-p": "assets/button_continue-p.svg",
            "button_quit": "assets/button_quit.svg",
            "button_quit-p": "assets/button_quit-p.svg",
            "reporter1": "assets/reporter1.svg",
            "reporter2": "assets/reporter2.svg",
            "level_side_reporter_bg": "assets/level_side_reporter_bg.svg",
            "magic_ball-particle": "assets/magic_ball-particle.svg"
        },
        audio: {
            "pop": "assets/Pop.wav",
            "cannot_break": "assets/knock.wav",
            "lift": "assets/lift.wav",
            "bomb": "assets/Squish Pop.wav",
            "magic_ball": "assets/magic-wand-wave-3.wav",
            "next_level": "assets/pluck.wav",
            "level_complete": "assets/apert.wav",
            "row_block_appear": "assets/row_block_appear.wav",
            "alert": "assets/alert.wav",
            "game_over": "assets/Freesound-133283__leszek_szary__game-over.wav",
        },
        fonts: {
            "JetBrains Mono": [
                "assets/JetBrains_Mono.woff2",
                "assets/JetBrains_Mono-cyrillic.woff2"
            ]
        }
    };
    const subcanvasImagesBlacklist = [
        "magic_ball-particle"
    ];
    {
        let error = false;
        const els = {
            progressBarValue: document.getElementById("progressBarValue"),
            progressBarText: document.getElementById("progressBarText"),
            progressBarError: document.getElementById("progressBarError")
        };
        const resourcesToLoadA = [];
        if (resourcesToLoad.images) {
            for (let index in resourcesToLoad.images) {
                resourcesToLoadA.push({
                    type: "image",
                    name: index,
                    source: resourcesToLoad.images[index]
                });
            }
        }
        if (resourcesToLoad.audio) {
            for (let index in resourcesToLoad.audio) {
                resourcesToLoadA.push({
                    type: "audio",
                    name: index,
                    source: resourcesToLoad.audio[index]
                });
            }
        }
        if (resourcesToLoad.fonts) {
            for (let index in resourcesToLoad.fonts) {
                const fontsData = resourcesToLoad.fonts[index];
                for (let fontData of fontsData) {
                    resourcesToLoadA.push({
                        type: "font",
                        name: index,
                        source: fontData
                    });
                }
            }
        }
        if (resourcesToLoad.files) {
            for (let index in resourcesToLoad.files) {
                resourcesToLoadA.push({
                    type: "file",
                    name: index,
                    source: resourcesToLoad.files[index]
                });
            }
        }
        let resourcesLoadedCount = 0;
        const resourcesCount = resourcesToLoadA.length + 1;
        function updateProgressBar() {
            if (!error) {
                resourcesLoadedCount += 1;
                const percent = Math.floor(resourcesLoadedCount / resourcesCount * 100);
                els.progressBarText.textContent = `Загрузка... ${percent}%`;
                els.progressBarValue.style.width = `${percent}%`;
            }
        }
        function displayError(reason) {
            error = true;
            els.progressBarText.textContent = "Ошибка загрузки";
            showEl(els.progressBarError);
            els.progressBarError.textContent = reason;
        }
        updateProgressBar();
        function addResourcesToLoad(resourcesToLoadA) {
            function promiseImage(name, url) {
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        updateProgressBar();
                        resolve({
                            type: "image",
                            name: name,
                            v: {
                                v: image,
                                width: image.naturalWidth,
                                height: image.naturalHeight,
                                scalable: true
                            }
                        });
                    };
                    image.onerror = () => {
                        displayError(url);
                        reject(Error(`Cannot load image: ${url}`));
                    };
                    image.src = url;
                });
            }
            async function promiseAudio(name, url) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`${url}: ${response.status} ${response.statusText}`);
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    const soundBuffer = await soundManager.audioCtx.decodeAudioData(arrayBuffer);
                    updateProgressBar();
                    return {
                        type: "audio",
                        name: name,
                        v: soundBuffer
                    };
                }
                catch (error) {
                    displayError(url);
                    throw error;
                }
            }
            function promiseFont(name, url) {
                return new Promise((resolve, reject) => {
                    const font = new FontFace(name, `url(${url})`);
                    font.load()
                        .then(loadedFont => {
                        updateProgressBar();
                        resolve({
                            type: "font",
                            font: loadedFont
                        });
                    })
                        .catch(() => {
                        displayError(url);
                        reject(Error(`Cannot load font: ${url}`));
                    });
                });
            }
            async function promiseFile(name, url) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`${url}: ${response.status} ${response.statusText}`);
                    }
                    const result = await response.text();
                    updateProgressBar();
                    return {
                        type: "file",
                        name: name,
                        v: result
                    };
                }
                catch (error) {
                    displayError(url);
                    throw error;
                }
            }
            const promises = [];
            for (let resource of resourcesToLoadA) {
                if (resource.type === "image") {
                    promises.push(promiseImage(resource.name, resource.source));
                }
                if (resource.type === "audio") {
                    promises.push(promiseAudio(resource.name, resource.source));
                }
                if (resource.type === "font") {
                    promises.push(promiseFont(resource.name, resource.source));
                }
                if (resource.type === "file") {
                    promises.push(promiseFile(resource.name, resource.source));
                }
            }
            return promises;
        }
        const resourcesLoadedA = await Promise.all(addResourcesToLoad(resourcesToLoadA));
        for (let resource of resourcesLoadedA) {
            if (resource.type === "image") {
                images[resource.name] = resource.v;
            }
            if (resource.type === "audio") {
                soundManager.audio[resource.name] = resource.v;
            }
            if (resource.type === "font") {
                document.fonts.add(resource.font);
            }
            if (resource.type === "file") {
                files[resource.name] = resource.v;
            }
        }
    }
    function randomNumber(min, max, span = 1) {
        return (Math.floor(Math.random() * Math.abs(max - min + span) / span) * span) + min;
    }
    function scale(value, fromLow, fromHigh, toLow, toHigh) {
        return ((value - fromLow) / ((fromHigh - fromLow) / (toHigh - toLow))) + toLow;
    }
    function clamp(value, min, max) {
        if (min > max) {
            let temp = min;
            min = max;
            max = temp;
        }
        return (value < min) ? min : ((value > max) ? max : value);
    }
    function scaleClamp(value, fromLow, fromHigh, toLow, toHigh) {
        return clamp(scale(value, fromLow, fromHigh, toLow, toHigh), toLow, toHigh);
    }
    function between(min, max, range = 0.5) {
        return ((max - min) * range) + min;
    }
    function moveBy(x, y, steps, direction) {
        const relX = steps * Math.cos(direction);
        const relY = steps * Math.sin(direction);
        return { x: (x + relX), y: (y + relY) };
    }
    function ease(t, easeMode) {
        switch (easeMode) {
            case "sineIn":
                return 1 - Math.cos(t * Math.PI / 2);
            case "sineOut":
                return Math.sin(t * Math.PI / 2);
            case "sineInOut":
                return -(Math.cos(Math.PI * t) - 1) / 2;
            case "quadIn":
                return t * t;
            case "quadOut":
                return 1 - ((1 - t) * (1 - t));
            case "quadInOut":
                return ((t < 0.5)
                    ? (t * 2 * t * 2) / 2
                    : 1 - ((1 - t) * 2 * (1 - t) * 2) / 2);
            case "cubicIn":
                return t * t * t;
            case "cubicOut":
                return 1 - ((1 - t) * (1 - t) * (1 - t));
            default:
                return t;
        }
    }
    function createCanvas(width, height) {
        const subcanvas = document.createElement("canvas");
        subcanvas.width = Math.ceil(width);
        subcanvas.height = Math.ceil(height);
        return subcanvas;
    }
    class Service {
        static imageToSubcanvas(image, scaleFactor = 1) {
            const subcanvas = createCanvas(Math.ceil(image.naturalWidth * scaleFactor), Math.ceil(image.naturalHeight * scaleFactor));
            const subctx = subcanvas.getContext("2d");
            subctx.scale(scaleFactor, scaleFactor);
            subctx.drawImage(image, 0, 0);
            return subcanvas;
        }
        static getSubcanvasImages() {
            const subcanvasImages = {};
            for (const imageName in images) {
                if (subcanvasImagesBlacklist.includes(imageName)) {
                    continue;
                }
                const imageProp = images[imageName];
                subcanvasImages[imageName] = {
                    v: Service.imageToSubcanvas(imageProp.v),
                    width: imageProp.width,
                    height: imageProp.height,
                    scalable: false
                };
            }
            return subcanvasImages;
        }
        static cacheMasks() {
        }
        static cacheSubcanvasImages() {
            for (const imageName in subcanvasImages) {
                subcanvasImages[imageName].v = Service.imageToSubcanvas(images[imageName].v, m.scaleFactor);
            }
        }
        static resizeDivCanvas() {
            const viewportWidth = window.innerWidth * dp;
            const viewportHeight = window.innerHeight * dp;
            const newScaleFactor = Math.min((viewportWidth / canvasSize.width), (viewportHeight / canvasSize.height));
            if (newScaleFactor !== m.scaleFactor && newScaleFactor > 0.05) {
                m.isResized = true;
                m.scaleFactor = newScaleFactor;
                const newWidth = Math.floor(sf(canvasSize.width));
                const newHeight = Math.floor(sf(canvasSize.height));
                canvasSize.scaledWidth = newWidth;
                canvasSize.scaledHeight = newHeight;
                els.divCanvas.style.width = `${Math.floor(newWidth / dp)}px`;
                els.divCanvas.style.height = `${Math.floor(newHeight / dp)}px`;
                canvas.style.width = `${Math.floor(newWidth / dp)}px`;
                canvas.style.height = `${Math.floor(newHeight / dp)}px`;
                canvas.width = newWidth;
                canvas.height = newHeight;
                Service.cacheSubcanvasImages();
                els.divCanvasElements.style.transform = `scale(${newScaleFactor / dp})`;
            }
            {
                const divCanvasClientRect = els.divCanvas.getBoundingClientRect();
                divCanvasPos.x = divCanvasClientRect.x;
                divCanvasPos.y = divCanvasClientRect.y;
            }
        }
        static updateBFullscreenImg() {
            els.bFullscreenImgSwitch.forEach((el) => { hideEl(el); });
            if (isFullscreen) {
                showEl(els.bFullscreenImgSwitch[1]);
            }
            else {
                if (waitingForFullscreen) {
                    showEl(els.bFullscreenImgSwitch[2]);
                }
                else {
                    showEl(els.bFullscreenImgSwitch[0]);
                }
            }
        }
        static showDialog1() {
            waitingForFullscreen = true;
            showEl(els.divDialog1);
        }
        static hideDialog1() {
            waitingForFullscreen = false;
            hideEl(els.divDialog1);
        }
        static findTouchPosition(event) {
            const oTouch = event.touches.item(0);
            m.mouseX = Math.floor((oTouch.clientX - divCanvasPos.x) / m.scaleFactor * dp);
            m.mouseY = Math.floor((oTouch.clientY - divCanvasPos.y) / m.scaleFactor * dp);
        }
    }
    const subcanvasImages = Service.getSubcanvasImages();
    class Messages {
        constructor() {
            this.messages = [];
        }
        broadcastFirst(value) {
            if (!this.messages.includes(value)) {
                this.messages.unshift(value);
            }
        }
        broadcast(value) {
            if (!this.messages.includes(value)) {
                this.messages.push(value);
            }
        }
        obtain() {
            return this.messages.shift();
        }
        isNotEmpty() {
            return (this.messages.length !== 0);
        }
    }
    class ACompCollidable {
        constructor(sprite) {
            this.offsetX = 0;
            this.offsetY = 0;
            this.width = 0;
            this.height = 0;
            this.sprite = sprite;
        }
        hitboxCollidePoint(x, y) {
            let left = (this.sprite.x - this.sprite.anchor.x + this.offsetX);
            let top = (this.sprite.y - this.sprite.anchor.y + this.offsetY);
            return ((x >= left)
                && (x < left + this.width)
                && (y >= top)
                && (y < top + this.height));
        }
    }
    class CompHitbox extends ACompCollidable {
        constructor(sprite, hitbox) {
            super(sprite);
            if (hitbox) {
                this.setHitbox(hitbox);
            }
            else {
                this.setHitboxAuto();
            }
        }
        setHitbox(hitbox) {
            this.offsetX = hitbox.offsetX;
            this.offsetY = hitbox.offsetY;
            this.width = hitbox.width;
            this.height = hitbox.height;
        }
        setHitboxAuto() {
            this.offsetX = 0;
            this.offsetY = 0;
            this.width = this.sprite.width;
            this.height = this.sprite.height;
        }
        collidePoint(x, y) {
            return this.hitboxCollidePoint(x, y);
        }
        collide(other) {
            let left = (this.sprite.x - this.sprite.anchor.x + this.offsetX);
            let top = (this.sprite.y - this.sprite.anchor.y + this.offsetY);
            let otherLeft = (other.sprite.x - other.sprite.anchor.x + other.offsetX);
            let otherTop = (other.sprite.y - other.sprite.anchor.y + other.offsetY);
            return ((left + this.width > otherLeft)
                && (left < otherLeft + other.width)
                && (top + this.height > otherTop)
                && (top < otherTop + other.height));
        }
    }
    class CompMask extends ACompCollidable {
        constructor(sprite, mask) {
            super(sprite);
            this.offsetX = mask.offsetX;
            this.offsetY = mask.offsetY;
            this.width = mask.width;
            this.height = mask.height;
            this.matrix = mask.matrix;
        }
        collidePoint(x, y) {
            let left = (this.sprite.x - this.sprite.anchor.x + this.offsetX);
            let top = (this.sprite.y - this.sprite.anchor.y + this.offsetY);
            let rx = x - left;
            let ry = y - top;
            let i = rx + (ry * this.width);
            let B = Math.floor(i / 8);
            let b = i % 8;
            let byte = this.matrix[B];
            let bit = ((byte & (1 << b)) !== 0);
            return (this.hitboxCollidePoint(x, y) && bit);
        }
    }
    class CompClickable {
        constructor(sprite, Collidable) {
            this.sprite = sprite;
            this.Collidable = Collidable;
            this.clickable = true;
        }
        checkClick() {
            if (this.clickable && this.sprite.visible) {
                let touch = this.Collidable.collidePoint(m.mouseX, m.mouseY);
                if (m.mouseDown === 1 && touch) {
                    return true;
                }
            }
            return false;
        }
    }
    class CompScale {
        constructor() {
            this.x = 1;
            this.y = 1;
        }
    }
    class CompRotation {
        constructor() {
            this.angleValue = 0;
        }
        get angle() {
            return this.angleValue;
        }
        set angle(b) {
            this.angleValue = ((b + Math.PI) % (Math.PI * 2)) - Math.PI;
        }
    }
    class CompOpacity {
        constructor() {
            this.opacity = 1;
        }
    }
    class Sprite {
        setImage(image) {
            this.image = image;
            if (this.image !== null) {
                this.width = this.image.width;
                this.height = this.image.height;
            }
            else {
                this.width = 0;
                this.height = 0;
            }
        }
        setAnchorPoint(cx = 0, cy = 0) {
            this.anchor.x = Math.round(this.width * cx);
            this.anchor.y = Math.round(this.height * cy);
        }
        setAbsoluteAnchorPoint(x = 0, y = 0) {
            this.anchor.x = x;
            this.anchor.y = y;
        }
        goTo(x, y) {
            this.x = x;
            this.y = y;
        }
        goBy(x, y) {
            this.x += x;
            this.y += y;
        }
        constructor(x = 0, y = 0, image = null) {
            this.width = 0;
            this.height = 0;
            this.anchor = { x: 0, y: 0 };
            this.visible = true;
            this.delete = false;
            this.new = true;
            this.layer = 0;
            this.master = null;
            this.realPositioning = false;
            this.setImage(image);
            this.x = x;
            this.y = y;
            this.setAnchorPoint();
        }
        messageStep(message) { }
        drawPosition(ctx) {
            if (this.realPositioning) {
                ctx.translate(sf(this.x - this.anchor.x), sf(this.y - this.anchor.y));
            }
            else {
                ctx.translate(sfR(this.x - this.anchor.x), sfR(this.y - this.anchor.y));
            }
        }
        drawTransformation(ctx) {
            if (this.Rotation || this.Scale) {
                ctx.translate(sf(this.anchor.x), sf(this.anchor.y));
                if (this.Rotation) {
                    ctx.rotate(this.Rotation.angle);
                }
                if (this.Scale) {
                    ctx.scale(this.Scale.x, this.Scale.y);
                }
                ctx.translate(sf(-this.anchor.x), sf(-this.anchor.y));
            }
            if (this.Opacity) {
                ctx.globalAlpha = clamp(this.Opacity.opacity, 0, 1);
            }
        }
        drawSelf(ctx) {
            if (this.image !== null) {
                if (this.image.scalable) {
                    ctx.scale(m.scaleFactor, m.scaleFactor);
                }
                ctx.drawImage(this.image.v, 0, 0);
            }
        }
        drawResult(ctx) {
            this.drawSelf(ctx);
        }
        draw(ctx) {
            this.drawPosition(ctx);
            this.drawTransformation(ctx);
            this.drawResult(ctx);
        }
    }
    class SensingProperties {
        constructor() {
            this.scaleFactor = 0;
            this.isResized = false;
            this.isFocused = false;
            this.mouseX = -1;
            this.mouseY = -1;
            this.mouseDown = 0;
            this.time = 0;
            this.delta = 0;
            this.messages = new Messages();
            this.clickedSprite = null;
            this.isMobile = matchMedia("((min-resolution: 2dppx) or (max-width: 600px))").matches;
            this.isTouchDevice = !(matchMedia("(pointer: fine)").matches);
        }
    }
    const m = new SensingProperties();
    function sf(number) {
        return number * m.scaleFactor;
    }
    function sfR(number) {
        return Math.round(number * m.scaleFactor);
    }
    let Msg;
    (function (Msg) {
        Msg[Msg["START"] = 0] = "START";
        Msg[Msg["TICK"] = 1] = "TICK";
        Msg[Msg["SHOW_MENU"] = 2] = "SHOW_MENU";
        Msg[Msg["SHOW_PLAY_BUTTON"] = 3] = "SHOW_PLAY_BUTTON";
        Msg[Msg["HIDE_PLAY_BUTTON"] = 4] = "HIDE_PLAY_BUTTON";
        Msg[Msg["SHOW_LEVEL_SELECTION"] = 5] = "SHOW_LEVEL_SELECTION";
        Msg[Msg["GAME_START"] = 6] = "GAME_START";
        Msg[Msg["GAME_CLEAR_GRID"] = 7] = "GAME_CLEAR_GRID";
        Msg[Msg["ANIM_START_DISPLAY_LEVEL"] = 8] = "ANIM_START_DISPLAY_LEVEL";
        Msg[Msg["ANIM_START_DISPLAY_LEVEL_SIDE"] = 9] = "ANIM_START_DISPLAY_LEVEL_SIDE";
        Msg[Msg["LEVEL_START1"] = 10] = "LEVEL_START1";
        Msg[Msg["GAME_PAUSE"] = 11] = "GAME_PAUSE";
        Msg[Msg["GAME_RESUME"] = 12] = "GAME_RESUME";
        Msg[Msg["TICK_RESUMED"] = 13] = "TICK_RESUMED";
        Msg[Msg["HIDE_PAUSE_BUTTON"] = 14] = "HIDE_PAUSE_BUTTON";
        Msg[Msg["GAME_OVER1"] = 15] = "GAME_OVER1";
        Msg[Msg["GAME_OVER2"] = 16] = "GAME_OVER2";
        Msg[Msg["LEVEL_COMPLETE_WAIT"] = 17] = "LEVEL_COMPLETE_WAIT";
        Msg[Msg["LEVEL_COMPLETE1"] = 18] = "LEVEL_COMPLETE1";
        Msg[Msg["LEVEL_COMPLETE2"] = 19] = "LEVEL_COMPLETE2";
        Msg[Msg["ANIM_SPAWN_ROW_BLOCK"] = 20] = "ANIM_SPAWN_ROW_BLOCK";
        Msg[Msg["LEVEL_COMPLETE3"] = 21] = "LEVEL_COMPLETE3";
    })(Msg || (Msg = {}));
    ;
    function createArray(value, length) {
        return new Array(length).fill(value);
    }
    function create2DArray(value, rows, columns) {
        let arr = new Array(rows);
        for (let i = 0; i < rows; i++) {
            arr[i] = new Array(columns);
            for (let j = 0; j < columns; j++) {
                arr[i][j] = value;
            }
        }
        return arr;
    }
    function ctxLinearGradient(ctx, x0 = 0, y0 = 0, x1 = 100, y1 = 0, colorStops = [{ "color": "#000000", "stop": 0 }, { "color": "#ffffff", "stop": 1 }]) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        colorStops.forEach((v) => {
            gradient.addColorStop(v.stop, v.color);
        });
        return gradient;
    }
    function getColorFromGradient(colors = ["#000000", "#ffffff"], factor = 0) {
        factor = clamp(factor, 0, 1);
        if (colors.length === 1)
            return colors[0];
        const index = (colors.length - 1) * factor;
        const i = Math.floor(index);
        const t = index - i;
        const color1 = colors[i];
        const color2 = colors[Math.min(i + 1, colors.length - 1)];
        const rgb = [0, 1, 2].map(j => {
            const c1 = parseInt(color1.slice(1 + j * 2, 3 + j * 2), 16);
            const c2 = parseInt(color2.slice(1 + j * 2, 3 + j * 2), 16);
            return Math.round(c1 * (1 - t) + c2 * t);
        });
        return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
    }
    class CompPause {
        constructor(sprite) {
            this.visibleHolder = false;
            this.sprite = sprite;
        }
        hideOnPause(message) {
            switch (message) {
                case Msg.GAME_PAUSE:
                    this.visibleHolder = this.sprite.visible;
                    this.sprite.visible = false;
                    break;
                case Msg.GAME_RESUME:
                    this.sprite.visible = this.visibleHolder;
                    break;
            }
        }
    }
    function getDateString(date) {
        return (String(date.getDate()).padStart(2, "0")
            + "." + String(date.getMonth() + 1).padStart(2, "0")
            + "." + String(date.getFullYear()).padStart(4, "0"));
    }
    class RecordHolder {
        constructor() {
            this.previousScore = 0;
            const rawValue = localStorage.getItem("highScore");
            if (rawValue) {
                const splitValues = rawValue.split(",");
                this.highScore = Number(splitValues[0]);
                this.recordDate = splitValues[1];
                this.highLevel = Number(splitValues[2]);
            }
            else {
                this.highScore = 0;
                this.recordDate = "";
                this.highLevel = 1;
            }
        }
        clear() {
            this.previousScore = this.highScore;
        }
        save(score, level) {
            let needSave = false;
            if (score > this.highScore) {
                this.highScore = score;
                this.recordDate = getDateString(new Date());
                needSave = true;
            }
            if (level > this.highLevel) {
                this.highLevel = level;
                needSave = true;
            }
            if (needSave) {
                localStorage.setItem("highScore", [String(this.highScore), String(this.recordDate), String(this.highLevel)].join(','));
            }
        }
    }
    class Subcanvas {
        constructor(width, height, draw, properties) {
            this.currentWidth = 0;
            this.currentHeight = 0;
            this.scaleSelf = (properties && properties.scaleSelf) ? properties.scaleSelf : false;
            this.draw = draw;
            this.c = document.createElement("canvas");
            this.ctx = this.c.getContext("2d");
            this.width = width;
            this.height = height;
            if (properties && properties.autoResize)
                this.resizeToFactor();
        }
        refresh(...parameters) {
            const ctx1 = this.ctx;
            this.clear();
            if (this.scaleSelf)
                ctx1.scale(m.scaleFactor, m.scaleFactor);
            this.draw(ctx1, ...parameters);
            if (this.scaleSelf)
                ctx1.resetTransform();
        }
        resizeToFactor() {
            this.c.width = sfR(this.width);
            this.c.height = sfR(this.height);
        }
        clear() {
            this.ctx.clearRect(0, 0, this.c.width, this.c.height);
        }
        display(ctx) {
            ctx.drawImage(this.c, 0, 0);
        }
    }
    class GlobalProperties {
        constructor() {
            this.state = "menu";
            this.pause = false;
            this.recordHolder = new RecordHolder();
        }
    }
    const g = new GlobalProperties();
    class Main extends Sprite {
        constructor() {
            super();
            this.visible = false;
            this.selectedLevel = 0;
        }
        messageStep(message) {
            switch (message) {
                case Msg.START:
                    m.messages.broadcast(Msg.SHOW_MENU);
                    break;
                case Msg.SHOW_MENU:
                    g.state = "menu";
                    showEl(els.bFullscreen);
                    s.window_instructions.visible = true;
                    s.window_frame_bg.image_frame = ((g.recordHolder.highLevel > 1)
                        ? subcanvasImages["window-frame2"]
                        : subcanvasImages["window-frame1"]);
                    s.window_frame_bg.visible = true;
                    s.high_score_reporter.tryShow();
                    m.messages.broadcast(Msg.SHOW_PLAY_BUTTON);
                    break;
                case Msg.SHOW_PLAY_BUTTON:
                    this.selectedLevel = g.recordHolder.highLevel;
                    if (g.recordHolder.highLevel > 1) {
                        s.button_play.goTo(104, 222);
                        m.messages.broadcast(Msg.SHOW_LEVEL_SELECTION);
                        this.changeLevel(0);
                    }
                    else {
                        s.button_play.goTo(104, 202);
                    }
                    break;
                case Msg.GAME_START:
                    hideEl(els.bFullscreen);
                    g.recordHolder.clear();
                    s.window_instructions.visible = false;
                    s.window_game_over_label.visible = false;
                    s.window_frame_bg.visible = false;
                    s.high_score_reporter.visible = false;
                    s.score_reporter.visible = true;
                    s.score_reporter.switchToDrawScore();
                    s.high_score_label.tryShow();
                    s.lines_left_reporter.visible = true;
                    s.level_side_bg.visible = true;
                    break;
                case Msg.GAME_OVER2:
                    g.state = "menu";
                    s.window_game_over_label.tryShow();
                    s.window_frame_bg.image_frame = ((g.recordHolder.highLevel > 1)
                        ? subcanvasImages["window-frame4"]
                        : subcanvasImages["window-frame3"]);
                    s.window_frame_bg.visible = true;
                    s.lines_left_reporter.visible = false;
                    s.high_score_label.visible = false;
                    s.level_side_bg.visible = false;
                    s.score_reporter.visible = true;
                    s.score_reporter.switchToDrawScoreEarned();
                    if (g.recordHolder.previousScore > 0) {
                        if (s.game.score > g.recordHolder.previousScore) {
                            s.high_score_reporter.switchToDrawPreviousScore();
                        }
                        else {
                            s.high_score_reporter.switchToDrawHighScore();
                        }
                        s.high_score_reporter.tryShow();
                    }
                    m.messages.broadcast(Msg.SHOW_PLAY_BUTTON);
                    break;
                case Msg.HIDE_PAUSE_BUTTON:
                    showEl(els.bFullscreen);
                    break;
                case Msg.TICK:
                    if (!g.pause) {
                        m.messages.broadcast(Msg.TICK_RESUMED);
                    }
                    break;
                case Msg.GAME_PAUSE:
                    showEl(els.bFullscreen);
                    g.pause = true;
                    break;
                case Msg.GAME_RESUME:
                    hideEl(els.bFullscreen);
                    g.pause = false;
                    break;
            }
        }
        changeLevel(by) {
            this.selectedLevel += by;
            s.button_left.disabled = (this.selectedLevel <= 1);
            s.button_right.disabled = (this.selectedLevel >= g.recordHolder.highLevel);
            s.level_selection_number.update();
        }
    }
    class SGame extends Sprite {
        constructor() {
            super();
            this.visible = false;
            this.ROWS = 15;
            this.COLUMNS = 12;
            this.grid = create2DArray(0, this.ROWS, this.COLUMNS);
            this.creationRow = createArray(0, this.COLUMNS);
            this.b = {
                lift: false,
                checkColumns: false,
                levelComplete: false
            };
            this.a = {
                creationBlockY: 0,
                columnsToShift: createArray(0, this.COLUMNS),
                moveToX: createArray(0, this.COLUMNS),
                row: 0,
                time: 0,
                bonusPoints: 0
            };
            this.creationColumn = 0;
            this.interval = 0;
            this.spawnTime = 0;
            this.score = 0;
            this.visibleScore = 0;
            this.level = 0;
            this.rowsLeft = 0;
            this.startRows = 0;
            this.blockColors = 0;
            this.bombCount = 0;
            this.magicBallCount = 0;
            this.placedItems = [];
        }
        createLevel(level) {
            this.blockColors = ((level <= 5)
                ? ((level - 1) % 5 <= 2) ? 3 : 4
                : ((level - 1) % 5 <= 1) ? 3 : 4);
            this.bombCount = ((level === 2) ? 5
                : (level === 5) ? 3
                    : (level === 7 || level === 10) ? 6
                        : ([12, 15, 17, 20].includes(level)) ? 8
                            : 0);
            this.magicBallCount = ((level === 3) ? 5
                : ([5, 15, 20].includes(level)) ? 3
                    : (level === 9) ? 4
                        : (level === 10) ? 2
                            : (level === 14 || level === 19) ? 6
                                : 0);
            this.startRows = (level === 1 || level === 4 || level === 5) ? 5 : 7;
            this.rowsLeft = ((level === 1 || level === 4) ? 15
                : (level === 2) ? 20
                    : ([3, 5, 8].includes(level)) ? 25
                        : ([6, 7, 9, 10].includes(level)) ? 40
                            : (level === 13) ? 50
                                : ([11, 12, 14, 15, 18].includes(level)) ? 75
                                    : 100);
            this.interval = ((level === 1 || level === 4) ? 4 / 13
                : ([2, 5, 8].includes(level)) ? 3 / 13
                    : ([3, 6, 9].includes(level)) ? 2.5 / 13
                        : ([7, 10, 13].includes(level)) ? 2 / 13
                            : ([11, 14, 15, 18].includes(level)) ? 1.5 / 13
                                : (level === 17) ? 0.8 / 13
                                    : 1 / 13);
            this.b.levelComplete = false;
            this.creationColumn = 0;
            this.spawnTime = this.interval;
            this.placedItems = this.distributeItemsToRows(this.bombCount, this.magicBallCount);
        }
        getRandomBlock() {
            return randomNumber(0, this.blockColors - 1);
        }
        distributeItemsToRows(bombCount, magicBallCount) {
            let placedItemRows = [];
            let placedItems = [];
            const items = bombCount + magicBallCount;
            const lineRange = (this.rowsLeft - 10) / items;
            for (let i = 0; i < items; i++) {
                placedItemRows.splice(randomNumber(0, i), 0, Math.round((i * lineRange) + randomNumber(0, lineRange - 1) + 10));
            }
            for (let i = 0; i < bombCount; i++) {
                placedItems.push({ line: placedItemRows.pop(), tileN: SGame.BOMB });
            }
            for (let i = 0; i < magicBallCount; i++) {
                placedItems.push({ line: placedItemRows.pop(), tileN: SGame.MAGIC_BALLS[this.getRandomBlock()] });
            }
            return placedItems;
        }
        pregenerateCreationRow() {
            this.rowsLeft -= 1;
            for (let col = 0; col < this.COLUMNS; col += 1) {
                this.creationRow[col]
                    = (this.rowsLeft !== 0)
                        ? SGame.BLOCKS[this.getRandomBlock()]
                        : 0;
            }
            const oPlacedItem = this.placedItems.find((value) => (value.line == this.rowsLeft));
            if (oPlacedItem) {
                this.creationRow[randomNumber(0, this.COLUMNS - 1)] = oPlacedItem.tileN;
            }
        }
        spawnRowsOfBlocks(rows) {
            for (let i = 0; i < rows; i += 1) {
                for (let col = 0; col < this.COLUMNS; col += 1) {
                    s.tiles.push(spawnTile(this.ROWS - 2 - i, col, SGame.BLOCKS[this.getRandomBlock()]));
                }
            }
        }
        getHighestColumn() {
            let highestColumn = 0;
            for (let col = 0; col < this.COLUMNS; col += 1) {
                let blocksInColumn = 0;
                for (let row = 0; row < this.ROWS; row += 1) {
                    if (this.grid[row][col] > 0) {
                        blocksInColumn += 1;
                    }
                }
                if (blocksInColumn == this.ROWS - 1) {
                    return blocksInColumn;
                }
                else if (blocksInColumn > highestColumn) {
                    highestColumn = blocksInColumn;
                }
            }
            return highestColumn;
        }
        checkEmptyColumn(col) {
            for (let row = 0; row < this.ROWS; row += 1) {
                if (this.grid[row][col] > 0) {
                    return false;
                }
            }
            return true;
        }
        checkEmptyRow(row) {
            for (let col = 0; col < this.COLUMNS; col += 1) {
                if (this.grid[row][col] > 0) {
                    return false;
                }
            }
            return true;
        }
        destroyTiles(clickedTile) {
            if (clickedTile) {
                if (clickedTile.tile.tileType === "block") {
                    const checkBlockToDestroy = (row, column, color) => {
                        if ((row >= 0 && row < this.ROWS && column >= 0 && column < this.COLUMNS)
                            && this.grid[row][column] === color) {
                            this.grid[row][column] = -1;
                            count += 1;
                            destroyers.push({ row: row, column: column });
                        }
                    };
                    let count = 0;
                    let destroyers = [];
                    checkBlockToDestroy(clickedTile.row, clickedTile.column, clickedTile.tileN);
                    while (destroyers.length) {
                        let d = destroyers.pop();
                        checkBlockToDestroy(d.row, d.column - 1, clickedTile.tileN);
                        checkBlockToDestroy(d.row, d.column + 1, clickedTile.tileN);
                        checkBlockToDestroy(d.row - 1, d.column, clickedTile.tileN);
                        checkBlockToDestroy(d.row + 1, d.column, clickedTile.tileN);
                    }
                    if (count < 3) {
                        soundManager.produce("cannot_break");
                        for (let row = 0; row < this.ROWS; row += 1) {
                            for (let col = 0; col < this.COLUMNS; col += 1) {
                                if (this.grid[row][col] === -1) {
                                    this.grid[row][col] = clickedTile.tileN;
                                }
                            }
                        }
                    }
                    else {
                        soundManager.produce("pop", randomNumber(1.5, 2, 0.1));
                        let points = 0;
                        let multiplier = 1;
                        for (let i = 0; i <= (count - 3); i++) {
                            if (i % 3 === 0) {
                                multiplier += 1;
                            }
                            points += 5 * multiplier;
                        }
                        this.score += points;
                        this.visibleScore = this.score;
                        this.animScoreSplash(clickedTile.row, clickedTile.column, points);
                    }
                }
                else if (clickedTile.tile.tileType === "bomb") {
                    const bombExplosionPattern = "0011100011111011111111111111111111101111100011100";
                    const hitBombs = [{ row: clickedTile.row, column: clickedTile.column }];
                    let count = 0;
                    while (hitBombs.length) {
                        const hitBomb = hitBombs.pop();
                        s.bomb_explosion_particles.unshift(new SBombExplosionParticles(hitBomb.row, hitBomb.column));
                        let column = hitBomb.column - 3;
                        let row = hitBomb.row - 3;
                        for (let i = 0; i < bombExplosionPattern.length; i++) {
                            if (row >= 0
                                && row < this.ROWS - 1
                                && column >= 0
                                && column < this.COLUMNS
                                && bombExplosionPattern[i] === "1") {
                                if (this.grid[row][column] === SGame.BOMB
                                    && !(row === hitBomb.row && column === hitBomb.column)) {
                                    hitBombs.push({ row: row, column: column });
                                }
                                this.grid[row][column] = -1;
                            }
                            column += 1;
                            if (i % 7 === 6) {
                                column = hitBomb.column - 3;
                                row += 1;
                            }
                        }
                        count += 1;
                    }
                    let points = count * 100;
                    this.score += points;
                    this.visibleScore = this.score;
                    this.animScoreSplash(clickedTile.row, clickedTile.column, points);
                    soundManager.produce("bomb");
                }
                else if (clickedTile.tile.tileType === "magicBall") {
                    let count = 0;
                    for (let row = 0; row < this.ROWS; row += 1) {
                        for (let col = 0; col < this.COLUMNS; col += 1) {
                            const cell = this.grid[row][col];
                            if (cell === SGame.BLOCKS[clickedTile.tile.color] || cell === SGame.MAGIC_BALLS[clickedTile.tile.color]) {
                                this.grid[row][col] = -1;
                                count += 1;
                            }
                        }
                    }
                    let points = count * 2;
                    this.score += points;
                    this.visibleScore = this.score;
                    this.animScoreSplash(clickedTile.row, clickedTile.column, points);
                    soundManager.produce("magic_ball");
                    s.flood_screen_effect.begin(clickedTile.tile.color);
                }
            }
        }
        animScoreSplash(row, column, points) {
            s.score_splash.begin(32 + (20 * (column + 0.5)), 29 + (20 * row), points);
            this.b.checkColumns = true;
        }
        messageStep(message) {
            switch (message) {
                case Msg.GAME_START:
                    this.score = 0;
                    this.visibleScore = this.score;
                    this.level = s.main.selectedLevel - 1;
                    m.messages.broadcast(Msg.ANIM_START_DISPLAY_LEVEL);
                    break;
                case Msg.TICK_RESUMED:
                    if (g.state === "game") {
                        let clickedTile = null;
                        let allTilesStand = false;
                        let startCheckColumns = false;
                        let startMoveColumns = false;
                        let startLift = false;
                        let startWaitLevelComplete = false;
                        let endLift = false;
                        if (!this.b.levelComplete) {
                            s.tiles.forEach((tile) => {
                                if (m.clickedSprite === tile) {
                                    clickedTile = {
                                        column: tile.column,
                                        row: tile.row,
                                        tileN: tile.tileN,
                                        tile: tile.tile
                                    };
                                }
                                if ((tile.row !== -1)) {
                                    tile.Clickable.clickable = true;
                                }
                                else {
                                    tile.Clickable.clickable = false;
                                }
                            });
                        }
                        if (!this.b.levelComplete && m.clickedSprite === s.c_bottom_row) {
                            if ((this.getHighestColumn() !== this.ROWS - 1 || this.rowsLeft === 0) && (!this.b.lift)) {
                                for (this.creationColumn; this.creationColumn < this.COLUMNS; this.creationColumn++) {
                                    s.tiles.unshift(spawnTile(-1, this.creationColumn, this.creationRow[this.creationColumn]));
                                }
                                if (this.rowsLeft !== 0) {
                                    startLift = true;
                                    this.spawnTime = this.interval;
                                }
                                else {
                                    startWaitLevelComplete = true;
                                }
                            }
                        }
                        s.tiles.forEach((tile) => {
                            if (tile.row !== -1) {
                                if (tile.b.lift) {
                                    tile.y = this.a.creationBlockY;
                                }
                                else {
                                    tile.tickFall();
                                }
                                if (tile.b.moveColumn) {
                                    let targetX = s.game.a.moveToX[tile.column];
                                    let side = Math.sign(targetX - tile.x);
                                    if (side === 0) {
                                        tile.b.moveColumn = false;
                                        tile.b.updateColumn = true;
                                    }
                                    else {
                                        tile.x += m.delta * 120 * side;
                                        if (side > 0 ? (tile.x > targetX) : (tile.x < targetX)) {
                                            tile.x = targetX;
                                            tile.b.moveColumn = false;
                                            tile.b.updateColumn = true;
                                        }
                                    }
                                }
                            }
                        });
                        {
                            for (let row = 0; row < this.ROWS; row += 1) {
                                for (let col = 0; col < this.COLUMNS; col += 1) {
                                    this.grid[row][col] = 0;
                                }
                            }
                            s.tiles.forEach((tile) => {
                                if (tile.row !== -1) {
                                    tile.row = tile.calculateRow(tile.y);
                                    if (tile.b.updateColumn) {
                                        tile.column = tile.calculateColumn(tile.x);
                                        tile.b.updateColumn = false;
                                    }
                                    this.grid[tile.row][tile.column] = tile.tileN;
                                }
                            });
                        }
                        if (!this.b.levelComplete) {
                            this.spawnTime -= m.delta;
                            if (this.spawnTime < 0) {
                                if (this.creationColumn < this.COLUMNS) {
                                    s.tiles.unshift(spawnTile(-1, this.creationColumn, this.creationRow[this.creationColumn]));
                                    this.creationColumn += 1;
                                }
                                else {
                                    if (this.rowsLeft !== 0) {
                                        const highestColumn = this.getHighestColumn();
                                        if (highestColumn === this.ROWS - 1) {
                                            clickedTile = null;
                                            m.messages.broadcast(Msg.GAME_OVER1);
                                        }
                                        else {
                                            if (this.b.lift) {
                                                this.a.creationBlockY = 289;
                                                endLift = true;
                                            }
                                            if (this.level <= 10) {
                                                if (highestColumn >= this.ROWS - 2 && this.rowsLeft > 1) {
                                                    s.overflow_warning_effect.begin();
                                                }
                                            }
                                            startLift = true;
                                        }
                                    }
                                    else {
                                        clickedTile = null;
                                        startWaitLevelComplete = true;
                                        m.messages.broadcast(Msg.LEVEL_COMPLETE_WAIT);
                                    }
                                }
                                this.spawnTime += this.interval;
                            }
                            if (this.b.lift) {
                                this.a.creationBlockY -= m.delta * 120;
                                if (this.a.creationBlockY < 289) {
                                    this.a.creationBlockY = 289;
                                    endLift = true;
                                }
                            }
                        }
                        if (startWaitLevelComplete) {
                            this.b.levelComplete = true;
                            s.tiles.forEach((tile) => {
                                tile.Clickable.clickable = false;
                            });
                        }
                        {
                            allTilesStand = s.tiles.every((obj) => (obj.gravity === 0));
                            if (allTilesStand && this.b.checkColumns) {
                                startCheckColumns = true;
                            }
                            if (this.b.levelComplete && allTilesStand) {
                                if (!(this.b.checkColumns)
                                    && s.tiles.every((obj) => (!obj.b.moveColumn))) {
                                    m.messages.broadcast(Msg.LEVEL_COMPLETE1);
                                }
                            }
                        }
                        if (startCheckColumns) {
                            let emptyColumns = createArray(false, this.COLUMNS).map((e, col) => (this.checkEmptyColumn(col)));
                            let divisionColumn = -1;
                            {
                                let c = {
                                    left: 0,
                                    gap: 0,
                                    right: 0
                                };
                                let countWhat;
                                countWhat = "empty";
                                for (let col = 0; col < this.COLUMNS; col += 1) {
                                    let isEmptyColumn = emptyColumns[col];
                                    if (countWhat === "empty") {
                                        if (!isEmptyColumn) {
                                            countWhat = "occupied";
                                        }
                                    }
                                    else {
                                        if (isEmptyColumn) {
                                            break;
                                        }
                                    }
                                    c.left += 1;
                                }
                                countWhat = "empty";
                                for (let col = this.COLUMNS - 1; col >= (c.left); col -= 1) {
                                    let isEmptyColumn = emptyColumns[col];
                                    if (countWhat === "empty") {
                                        if (!isEmptyColumn) {
                                            countWhat = "occupied";
                                        }
                                    }
                                    else {
                                        if (isEmptyColumn) {
                                            break;
                                        }
                                    }
                                    c.right += 1;
                                }
                                c.gap = this.COLUMNS - (c.left + c.right);
                                if (c.gap > 0) {
                                    let rawDivisionColumn = c.left + (c.gap / 2);
                                    if (rawDivisionColumn > Math.round(this.COLUMNS / 2)) {
                                        divisionColumn = Math.floor(rawDivisionColumn);
                                    }
                                    else {
                                        divisionColumn = Math.ceil(rawDivisionColumn);
                                    }
                                }
                                else {
                                    divisionColumn = -1;
                                }
                            }
                            if (divisionColumn !== -1) {
                                this.a.columnsToShift.fill(0);
                                let cellsToShift;
                                cellsToShift = 0;
                                for (let col = divisionColumn - 1; col >= 0; col -= 1) {
                                    if (emptyColumns[col]) {
                                        cellsToShift += 1;
                                    }
                                    else {
                                        this.a.columnsToShift[col] = cellsToShift;
                                    }
                                }
                                cellsToShift = 0;
                                for (let col = divisionColumn; col < this.COLUMNS; col += 1) {
                                    if (emptyColumns[col]) {
                                        cellsToShift -= 1;
                                    }
                                    else {
                                        this.a.columnsToShift[col] = cellsToShift;
                                    }
                                }
                                for (let col = 0; col < this.COLUMNS; col += 1) {
                                    this.a.moveToX[col] = 32 + (20 * (col + this.a.columnsToShift[col]));
                                }
                                startMoveColumns = true;
                            }
                            this.b.checkColumns = false;
                        }
                        if (startMoveColumns) {
                            s.tiles.forEach((tile) => {
                                if (tile.row !== -1)
                                    tile.b.moveColumn = true;
                            });
                        }
                        if (startLift) {
                            this.pregenerateCreationRow();
                            soundManager.produce("lift");
                            this.creationColumn = 0;
                            this.a.creationBlockY = 311;
                            this.b.lift = true;
                            s.tiles.forEach((tile) => {
                                if (tile.row === -1) {
                                    tile.row = tile.calculateRow(tile.y);
                                    tile.b.lift = true;
                                }
                            });
                        }
                        if (endLift) {
                            this.b.lift = false;
                            s.tiles.forEach((tile) => {
                                if (tile.b.lift) {
                                    tile.b.lift = false;
                                }
                            });
                        }
                        {
                            this.destroyTiles(clickedTile);
                            s.tiles.forEach((tile) => {
                                if (tile.row !== -1 && this.grid[tile.row][tile.column] === -1) {
                                    tile.delete = true;
                                }
                            });
                        }
                    }
                    if (g.state === "animationLevelComplete3") {
                        this.a.time -= m.delta;
                        if (this.a.time <= 0) {
                            if (this.level >= 20) {
                                m.messages.broadcast(Msg.GAME_OVER1);
                            }
                            else {
                                m.messages.broadcast(Msg.ANIM_START_DISPLAY_LEVEL);
                            }
                        }
                    }
                    break;
                case Msg.ANIM_START_DISPLAY_LEVEL:
                    m.messages.broadcast(Msg.GAME_CLEAR_GRID);
                    soundManager.produce("next_level");
                    g.state = "animationLevel";
                    this.level += 1;
                    this.createLevel(this.level);
                    break;
                case Msg.LEVEL_START1:
                    g.state = "game";
                    this.rowsLeft += 1;
                    this.spawnRowsOfBlocks(this.startRows);
                    this.pregenerateCreationRow();
                    break;
                case Msg.LEVEL_COMPLETE1:
                    let rowN = 0;
                    while (this.checkEmptyRow(rowN) && rowN < this.ROWS - 1) {
                        rowN++;
                    }
                    const bonus = (rowN !== this.ROWS - 1)
                        ? 50 * this.level * (rowN)
                        : 2000 * this.level;
                    this.score += bonus;
                    g.recordHolder.save(this.score, Math.min(this.level + 1, 20));
                    soundManager.produce("level_complete");
                    g.state = "animationLevelComplete1";
                    break;
                case Msg.LEVEL_COMPLETE2:
                    this.a.bonusPoints = 0;
                    this.a.row = 0;
                    this.a.time = 0;
                    if (this.checkEmptyRow(0)) {
                        g.state = "animationLevelComplete2";
                        m.messages.broadcast(Msg.ANIM_SPAWN_ROW_BLOCK);
                    }
                    else {
                        m.messages.broadcast(Msg.LEVEL_COMPLETE3);
                    }
                    break;
                case Msg.ANIM_SPAWN_ROW_BLOCK:
                    {
                        if (this.a.row !== this.ROWS - 2) {
                            this.a.bonusPoints = 50 * this.level * (this.a.row + 1);
                        }
                        else {
                            this.a.bonusPoints = 2000 * this.level;
                        }
                        if (this.checkEmptyRow(this.a.row + 1) && (this.a.row < this.ROWS - 2)) {
                            s.row_block_particles.push(new SRowBlockParticles(this.a.row, { stateLast: false, displayedString: "".concat("Бонус +", String(this.a.bonusPoints)) }));
                        }
                        else {
                            s.row_block_particles.push(new SRowBlockParticles(this.a.row, { stateLast: true, displayedString: "".concat("Бонус +", String(this.a.bonusPoints)) }));
                        }
                        this.a.row += 1;
                    }
                    break;
                case Msg.LEVEL_COMPLETE3:
                    this.visibleScore += this.a.bonusPoints;
                    g.state = "animationLevelComplete3";
                    this.a.time = 1.0;
                    break;
                case Msg.GAME_OVER1:
                    g.recordHolder.save(this.score, this.level);
                    soundManager.produce("game_over");
                    g.state = "animationGameOver";
                    m.messages.broadcast(Msg.HIDE_PAUSE_BUTTON);
                    break;
                case Msg.GAME_OVER2:
                    m.messages.broadcast(Msg.GAME_CLEAR_GRID);
                    m.messages.broadcast(Msg.HIDE_PAUSE_BUTTON);
                    break;
            }
        }
    }
    SGame.tileValues = {
        0: { tileType: "dummy" },
        1: { tileType: "block", color: 0 },
        2: { tileType: "block", color: 1 },
        3: { tileType: "block", color: 2 },
        4: { tileType: "block", color: 3 },
        5: { tileType: "bomb" },
        6: { tileType: "magicBall", color: 0 },
        7: { tileType: "magicBall", color: 1 },
        8: { tileType: "magicBall", color: 2 },
        9: { tileType: "magicBall", color: 3 }
    };
    SGame.BLOCKS = [1, 2, 3, 4];
    SGame.BOMB = 5;
    SGame.MAGIC_BALLS = [6, 7, 8, 9];
    class SPTiles extends Sprite {
        constructor(row, column, tileN) {
            super();
            this.realPositioning = true;
            this.gravity = 0;
            this.b = {
                lift: false,
                moveColumn: false,
                updateColumn: false
            };
            this.compPause = new CompPause(this);
            this.tileN = tileN;
            this.tile = SGame.tileValues[tileN];
            this.Collidable = new CompHitbox(this, {
                offsetX: 0,
                offsetY: 0,
                width: 20,
                height: 20
            });
            this.Clickable = new CompClickable(this, this.Collidable);
            this.Clickable.clickable = false;
            this.row = row;
            this.column = column;
            this.x = 32 + (20 * this.column);
            if (this.row !== -1) {
                this.y = 29 + (20 * this.row);
            }
            else {
                this.y = 311;
            }
            this.new = false;
        }
        tickFall() {
            let highestGroundY = 289;
            for (let sprite of s.tiles) {
                if (this.column === sprite.column && this.y < sprite.y) {
                    let groundY = sprite.y - sprite.Collidable.height;
                    if (groundY < highestGroundY)
                        highestGroundY = groundY;
                }
            }
            if (this.y === highestGroundY) {
                this.gravity = 0;
            }
            else {
                this.gravity -= 2.5 * m.delta * (m.delta * 100);
                if (this.gravity > 50 * m.delta * (m.delta * 100))
                    this.gravity = 50 * m.delta * (m.delta * 100);
                this.y -= this.gravity;
                if (this.y >= highestGroundY) {
                    this.y = highestGroundY;
                }
            }
        }
        calculateRow(y) {
            return Math.round((y - 29) / 20);
        }
        calculateColumn(x) {
            return Math.round((x - 32) / 20);
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.GAME_CLEAR_GRID:
                    this.delete = true;
                    break;
                case Msg.TICK_RESUMED:
                    this.animate();
                    break;
            }
        }
    }
    SPTiles.imageList = [
        subcanvasImages["red"],
        subcanvasImages["green"],
        subcanvasImages["blue"],
        subcanvasImages["yellow"],
        subcanvasImages["red_ball"],
        subcanvasImages["green_ball"],
        subcanvasImages["blue_ball"],
        subcanvasImages["yellow_ball"]
    ];
    SPTiles.bombFrames = [
        subcanvasImages["bomb-f1"],
        subcanvasImages["bomb-f2"]
    ];
    function spawnTile(row, column, tileN) {
        const tile = SGame.tileValues[tileN];
        if (tile.tileType === "block") {
            return new STilesBlock(row, column, tile.color);
        }
        else if (tile.tileType === "bomb") {
            return new STilesBomb(row, column);
        }
        else if (tile.tileType === "magicBall") {
            return new STilesMagicBall(row, column, tile.color);
        }
        else {
            return new STilesDummy(row, column);
        }
    }
    class STilesDummy extends SPTiles {
        constructor(row, column) {
            super(row, column, 0);
            this.setImage(subcanvasImages["blankTile"]);
        }
        animate() { }
    }
    class STilesBlock extends SPTiles {
        constructor(row, column, color) {
            super(row, column, SGame.BLOCKS[color]);
            this.setImage(SPTiles.imageList[color]);
        }
        animate() { }
    }
    class STilesBomb extends SPTiles {
        constructor(row, column) {
            super(row, column, SGame.BOMB);
            this.setImage(SPTiles.bombFrames[0]);
            this.setAbsoluteAnchorPoint(0, this.height - 20);
            this.Collidable.setHitbox({
                offsetX: 0,
                offsetY: this.height - 20,
                width: 20,
                height: 20
            });
            this.layer = 1;
        }
        animate() {
            const frameIndex = Math.floor((m.time / 0.1) % 2);
            this.image = SPTiles.bombFrames[frameIndex];
        }
    }
    class STilesMagicBall extends SPTiles {
        constructor(row, column, color) {
            super(row, column, SGame.MAGIC_BALLS[color]);
            this.spawnParticleInterval = 0;
            this.intervalLeft = this.spawnParticleInterval;
            this.setImage(SPTiles.imageList[color + 4]);
        }
        animate() {
            this.intervalLeft -= m.delta;
            if (this.intervalLeft <= 0) {
                this.spawnParticleInterval = randomNumber(0.1, 0.5, 0.1);
                this.intervalLeft += this.spawnParticleInterval;
                s.magic_ball_particles.push(new SMagicBallParticles(this));
            }
        }
    }
    class SBombExplosionParticles extends Sprite {
        constructor(row, column) {
            super(32 + (20 * column) + 10, 29 + (20 * row) + 10);
            this.layer = 1;
            this.animLifetime = 0.6;
            this.width = 130;
            this.height = this.width;
            this.halfWidth = this.width / 2;
            this.canvas1 = new Subcanvas(this.width, this.width, (ctx1) => {
                const radialGradient = ctx1.createRadialGradient(sf(this.halfWidth), sf(this.halfWidth), sf(this.halfWidth), sf(this.targetAnchorX), sf(this.targetAnchorY), sf(25));
                radialGradient.addColorStop(0, "#0080ff");
                radialGradient.addColorStop(0.3, "#80c0ff");
                radialGradient.addColorStop(1, "#ffffff");
                ctx1.fillStyle = radialGradient;
                ctx1.fillRect(0, 0, this.currentWidth, this.currentWidth);
            });
            this.canvas2 = new Subcanvas(this.width, this.width, (ctx2, x, y, r) => {
                const radialGradient = ctx2.createRadialGradient(sf(x), sf(y), sf(r), sf(x), sf(y), sf(Math.max(r - 5, 0)));
                radialGradient.addColorStop(0, "#ffffff00");
                radialGradient.addColorStop(1, "#ffffff");
                ctx2.fillStyle = radialGradient;
                ctx2.fillRect(0, 0, this.currentWidth, this.currentWidth);
            });
            this.canvas3 = new Subcanvas(this.width, this.width, (ctx3) => {
                ctx3.globalCompositeOperation = "source-over";
                ctx3.drawImage(this.canvas1.c, 0, 0);
                ctx3.globalCompositeOperation = "destination-in";
                ctx3.drawImage(this.canvas2.c, 0, 0);
            });
            this.compPause = new CompPause(this);
            this.setAnchorPoint(0.5, 0.5);
            const movedTo = moveBy(this.halfWidth, this.halfWidth, 25, randomNumber(-4, 3) * (Math.PI / 4));
            this.targetAnchorX = Math.round(movedTo.x);
            this.targetAnchorY = Math.round(movedTo.y);
            this.resizeCanvases();
            this.canvas1.refresh();
        }
        resizeCanvases() {
            this.currentWidth = sf(this.width);
            this.canvas1.resizeToFactor();
            this.canvas2.resizeToFactor();
            this.canvas3.resizeToFactor();
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK:
                    if (m.isResized) {
                        this.resizeCanvases();
                        this.canvas1.refresh();
                    }
                    break;
                case Msg.TICK_RESUMED:
                    this.animLifetime -= m.delta;
                    if (this.animLifetime > 0.3) {
                        const t = scaleClamp(this.animLifetime, 0.6, 0.3, 0, 1);
                        const Y = ease(t, "cubicOut");
                        this.canvas2.refresh(this.halfWidth, this.halfWidth, this.halfWidth * Y);
                    }
                    else if (this.animLifetime > 0) {
                        const t = scaleClamp(this.animLifetime, 0.3, 0, 1, 0);
                        const Y = ease(t, "cubicOut");
                        this.canvas2.refresh(between(this.targetAnchorX, this.halfWidth, Y), between(this.targetAnchorY, this.halfWidth, Y), this.halfWidth * Y);
                    }
                    else {
                        this.delete = true;
                    }
                    this.canvas3.refresh();
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.delete = true;
                    break;
            }
        }
        drawResult(ctx) {
            ctx.globalCompositeOperation = "lighter";
            this.canvas3.display(ctx);
        }
    }
    class SMagicBallParticles extends Sprite {
        constructor(master) {
            super(0, 0, images["magic_ball-particle"]);
            this.layer = 1;
            this.animDuration = 0.5;
            this.animLifetime = this.animDuration;
            this.Opacity = new CompOpacity();
            this.Scale = new CompScale();
            this.compPause = new CompPause(this);
            this.master = master;
            this.x = this.master.x + (this.master.width / 2) + randomNumber(-6, 6);
            this.y = this.master.y + (this.master.height / 2) + randomNumber(-6, 6);
            this.setAnchorPoint(0.5, 0.5);
            const scaleValue = randomNumber(0.3, 0.5, 0.1);
            this.Scale.x = scaleValue;
            this.Scale.y = scaleValue;
            this.Opacity.opacity = 0;
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK_RESUMED:
                    this.animLifetime -= m.delta;
                    if (this.animLifetime > this.animDuration * 0.75) {
                        this.Opacity.opacity = scaleClamp(this.animLifetime, this.animDuration, this.animDuration * 0.75, 0, 1);
                    }
                    else if (this.animLifetime > 0) {
                        this.Opacity.opacity = scaleClamp(this.animLifetime, this.animDuration * 0.75, 0, 1, 0);
                    }
                    else {
                        this.delete = true;
                    }
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.delete = true;
                    break;
            }
        }
        drawResult(ctx) {
            ctx.globalCompositeOperation = "lighter";
            this.drawSelf(ctx);
        }
    }
    class SFloodScreenEffectPersistent extends Sprite {
        constructor() {
            super();
            this.colorValue = SFloodScreenEffectPersistent.COLORS[0];
            this.layer = 1;
            this.DRAW_X = 32 - 1;
            this.DRAW_Y = 29 - 1;
            this.DRAW_W = 240 + 2;
            this.DRAW_H = 302 + 2;
            this.visible = false;
            this.animLifetime = 0;
            this.compPause = new CompPause(this);
            this.Opacity = new CompOpacity();
            this.Opacity.opacity = 0;
        }
        begin(color) {
            this.animLifetime = 0.75;
            this.visible = true;
            this.Opacity.opacity = 1;
            this.colorValue = SFloodScreenEffectPersistent.COLORS[color];
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK_RESUMED:
                    if (this.visible) {
                        this.animLifetime -= m.delta;
                        this.Opacity.opacity = scaleClamp(this.animLifetime, 0.75, 0, 1, 0);
                        if (this.animLifetime <= 0) {
                            this.visible = false;
                        }
                    }
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.animLifetime = 0;
                    this.visible = false;
                    break;
            }
        }
        drawResult(ctx) {
            ctx.scale(m.scaleFactor, m.scaleFactor);
            ctx.fillStyle = this.colorValue;
            ctx.fillRect(this.DRAW_X, this.DRAW_Y, this.DRAW_W, this.DRAW_H);
        }
    }
    SFloodScreenEffectPersistent.COLORS = [
        "#FF4848", "#43C919", "#2A70FF", "#FFE22C"
    ];
    class SRowBlockParticles extends Sprite {
        constructor(row, passParameters) {
            super(152, 39 + (20 * row), subcanvasImages["row_block-particle"]);
            this.layer = 1;
            this.Opacity = new CompOpacity();
            this.animDuration = 0.3;
            this.animLifetime = this.animDuration;
            this.compPause = new CompPause(this);
            this.setAnchorPoint(0.5, 0.5);
            this.Opacity.opacity = 0;
            this.passParameters = passParameters;
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK_RESUMED:
                    if (this.animLifetime > 0) {
                        this.animLifetime -= m.delta;
                        this.Opacity.opacity = scaleClamp(this.animLifetime, this.animDuration, 0, 0, 1);
                    }
                    else {
                        this.delete = true;
                        s.row_blocks.push(new SRowBlocks(this.y));
                        s.bonus_splash2.begin(this.y, this.passParameters.displayedString, this.passParameters.stateLast);
                        if (!this.passParameters.stateLast) {
                            m.messages.broadcast(Msg.ANIM_SPAWN_ROW_BLOCK);
                        }
                        else {
                            m.messages.broadcast(Msg.LEVEL_COMPLETE3);
                        }
                    }
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.delete = true;
                    break;
            }
        }
        drawResult(ctx) {
            ctx.drawImage(this.image.v, sf(-120 / 2), 0);
            ctx.drawImage(this.image.v, 0, 0);
            ctx.drawImage(this.image.v, sf(120 / 2), 0);
        }
    }
    class SRowBlocks extends Sprite {
        constructor(y) {
            super(152, y, subcanvasImages["row_block-1"]);
            this.realPositioning = true;
            this.layer = 1;
            this.imageL = subcanvasImages["row_block-1"];
            this.imageL2 = subcanvasImages["row_block-2"];
            this.imageL3 = subcanvasImages["row_block-3"];
            this.animDuration = 0.3;
            this.animLifetime = this.animDuration;
            this.obscureOpacity = 1;
            this.compPause = new CompPause(this);
            this.setAnchorPoint(0.5, 0.5);
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK_RESUMED:
                    if (this.animLifetime > 0) {
                        this.animLifetime -= m.delta;
                        this.obscureOpacity = scaleClamp(this.animLifetime, this.animDuration, 0, 1, 0);
                    }
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.delete = true;
                    break;
            }
        }
        drawResult(ctx) {
            ctx.drawImage(this.imageL3.v, 0, 0);
            ctx.globalAlpha = this.obscureOpacity;
            ctx.drawImage(this.imageL2.v, 0, 0);
            ctx.globalAlpha = 1;
            ctx.drawImage(this.imageL.v, 0, 0);
        }
    }
    class SBonusSplashPersistent extends Sprite {
        constructor() {
            super(0, 0);
            this.layer = 1;
            this.visible = false;
            this.displayedString = "";
            this.stateLast = false;
            this.compPause = new CompPause(this);
        }
        begin(y, displayedString, stateLast) {
            const base = Math.pow(2, 1 / 7);
            const pitch = 0.5 * 1.04 * Math.pow(base, s.game.a.row);
            soundManager.produce("row_block_appear", pitch);
            this.x = 266;
            this.y = y + 6;
            this.displayedString = String(displayedString);
            this.stateLast = stateLast;
            this.visible = true;
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK_RESUMED:
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.visible = false;
                    break;
            }
        }
        drawResult(ctx) {
            ctx.scale(sf(1), sf(1));
            ctx.font = '12pt "JetBrains Mono", monospace';
            ctx.textAlign = "right";
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#000000";
            ctx.fillText(this.displayedString, 1.5, 1.5);
            ctx.fillStyle = (this.stateLast) ? "#eaffb7" : "#808080";
            ctx.fillText(this.displayedString, 0, 0);
        }
    }
    class SOverflowWarningEffect extends Sprite {
        constructor() {
            super(31, 28, subcanvasImages["overflow_warning_effect"]);
            this.layer = 1;
            this.visible = false;
            this.Opacity = new CompOpacity();
            this.animLifetime = 0;
            this.compPause = new CompPause(this);
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK_RESUMED:
                    if (this.animLifetime > 0) {
                        this.animLifetime -= m.delta;
                        if (this.animLifetime > 0.75) {
                            this.Opacity.opacity = scaleClamp(this.animLifetime, 1, 0.75, 0, 1);
                        }
                        else if (this.animLifetime > 0.5) {
                            this.Opacity.opacity = scaleClamp(this.animLifetime, 0.75, 0.5, 1, 0);
                        }
                        else if (this.animLifetime > 0.25) {
                            this.Opacity.opacity = scaleClamp(this.animLifetime, 0.5, 0.25, 0, 1);
                        }
                        else if (this.animLifetime > 0) {
                            this.Opacity.opacity = scaleClamp(this.animLifetime, 0.25, 0, 1, 0);
                        }
                        else {
                            this.visible = false;
                        }
                    }
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.animLifetime = 0;
                    this.visible = false;
                    break;
            }
        }
        begin() {
            soundManager.produce("alert");
            this.animLifetime = 1;
            this.Opacity.opacity = 0;
            this.visible = true;
        }
    }
    class SFieldBackground extends Sprite {
        constructor() {
            super(0, 0, subcanvasImages["field_background"]);
            this.layer = 0;
        }
    }
    class CBottomRow extends Sprite {
        constructor() {
            super(0, 0);
            this.layer = 1;
            this.Collidable = new CompHitbox(this, {
                offsetX: 32,
                offsetY: 312,
                width: 240,
                height: 19
            });
            this.Clickable = new CompClickable(this, this.Collidable);
            this.Clickable.clickable = true;
        }
    }
    class SScoreSplashPersistent extends Sprite {
        constructor() {
            super();
            this.layer = 1;
            this.visible = false;
            this.lifetime = 0;
            this.Opacity = new CompOpacity();
            this.displayedString = "";
            this.stateBig = false;
            this.compPause = new CompPause(this);
        }
        begin(x, y, points) {
            this.visible = true;
            this.lifetime = 1;
            this.Opacity.opacity = 1;
            this.x = x - this.width / 2;
            this.y = y - this.height + 10;
            this.displayedString = `+${points}`;
            this.stateBig = (points >= 500);
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.TICK_RESUMED:
                    if (this.lifetime > 0) {
                        this.y -= 20 * m.delta;
                        this.lifetime -= m.delta;
                        if (this.lifetime <= 0.25)
                            this.Opacity.opacity = scaleClamp(this.lifetime, 0, 0.25, 0, 1);
                        if (this.lifetime <= 0)
                            this.visible = false;
                    }
                    break;
                case Msg.GAME_CLEAR_GRID:
                    this.lifetime = 0;
                    this.visible = false;
                    break;
            }
        }
        drawResult(ctx) {
            ctx.scale(sf(1), sf(1));
            ctx.translate(0, -6);
            if (this.stateBig)
                ctx.scale(1.75, 1.75);
            ctx.font = 'bold 16px "JetBrains Mono", monospace';
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.fillText(this.displayedString, 1.5, 1.5);
            ctx.fillStyle = "#ff8000";
            ctx.fillText(this.displayedString, 0, 0);
            ctx.resetTransform();
        }
    }
    class SCoverBackground extends Sprite {
        constructor() {
            super(0, 0, subcanvasImages["cover_background"]);
            this.layer = 1;
        }
    }
    class SPReporter extends Sprite {
        constructor(x, y, reporterImage, outputFunction) {
            super(x, y);
            this.layer = 1;
            this.visible = false;
            this.output = "";
            this.reporterImage = reporterImage;
            this.titleString = "Очки";
            this.outputFunction = outputFunction;
            this.canvasT1 = new Subcanvas(150, 25, (ctx1) => {
                ctx1.font = '16px "JetBrains Mono", monospace';
                ctx1.fillStyle = "#5f6995";
                ctx1.textAlign = "center";
                ctx1.fillText(this.titleString, this.canvasT1.width / 2, this.canvasT1.height - 5);
            }, { scaleSelf: true });
            this.canvasT2 = new Subcanvas(138, 28, (ctx2) => {
                ctx2.font = '22px "JetBrains Mono", monospace';
                ctx2.fillStyle = "#ffffff";
                ctx2.textAlign = "center";
                ctx2.fillText(this.output, this.canvasT2.width / 2, 22);
            }, { scaleSelf: true });
        }
        resizeCanvases() {
            this.canvasT1.resizeToFactor();
            this.canvasT2.resizeToFactor();
            this.canvasT1.refresh();
            this.canvasT2.refresh();
        }
        tickRefreshContent() {
            const currentOutput = this.outputFunction();
            if (m.isResized) {
                this.output = currentOutput;
                this.resizeCanvases();
            }
            else if (this.visible && currentOutput !== this.output) {
                this.output = currentOutput;
                this.canvasT2.refresh();
            }
        }
        messageStep(message) {
            switch (message) {
                case Msg.TICK:
                    this.tickRefreshContent();
                    break;
            }
        }
        drawResult(ctx) {
            const canvasOT1_offset = (142 - this.canvasT1.width) / 2;
            ctx.drawImage(this.reporterImage.v, 0, 0);
            ctx.translate(sfR(canvasOT1_offset), sfR(-this.canvasT1.height));
            ctx.drawImage(this.canvasT1.c, 0, 0);
            ctx.translate(sfR(-canvasOT1_offset), sfR(this.canvasT1.height));
            ctx.translate(sfR(2), sfR(2));
            ctx.drawImage(this.canvasT2.c, 0, 0);
        }
    }
    class SScoreReporter extends SPReporter {
        constructor() {
            super(0, 0, subcanvasImages["reporter1"], () => (String(s.game.visibleScore)));
        }
        switchToDrawScore() {
            this.goTo(307, 237);
            this.titleString = "Очки";
            this.canvasT1.refresh();
        }
        switchToDrawScoreEarned() {
            this.goTo(307, 163);
            this.titleString = "Набрано очков";
            this.canvasT1.refresh();
        }
    }
    class SLinesLeftReporter extends SPReporter {
        constructor() {
            super(307, 163, subcanvasImages["reporter1"], () => (String(s.game.rowsLeft)));
            this.titleString = "Осталось линий";
        }
    }
    class SHighScoreLabel extends Sprite {
        constructor() {
            super(307 + 4, 237 + 36 + 10);
            this.layer = 1;
            this.visible = false;
            this.isRecordBeaten = false;
            this.animLifetime = 0;
            this.canvasT1 = new Subcanvas(146, 16, (ctx1) => {
                ctx1.font = '12px "JetBrains Mono", monospace';
                ctx1.textAlign = "center";
                const renderText = (color, text) => {
                    ctx1.fillStyle = color;
                    ctx1.fillText(text, this.canvasT1.width / 2, this.canvasT1.height - 4);
                };
                if (!this.isRecordBeaten) {
                    renderText("#924206", `Рекорд: ${g.recordHolder.previousScore}`);
                }
                else {
                    renderText(getColorFromGradient(["#ffffff", "#106010"], scale(this.animLifetime, 1, 0, 0, 1)), `Новый рекорд!`);
                }
            }, { scaleSelf: true });
        }
        tryShow() {
            if (g.recordHolder.previousScore > 0) {
                this.visible = true;
                this.isRecordBeaten = false;
                this.animLifetime = 0;
                this.canvasT1.refresh();
            }
        }
        tickRefreshContent() {
            if (m.isResized) {
                this.resizeCanvases();
            }
            if (this.visible) {
                if (!this.isRecordBeaten && (s.game.score > g.recordHolder.previousScore)) {
                    this.isRecordBeaten = true;
                    this.animLifetime = 1;
                }
                if (this.animLifetime > 0) {
                    this.animLifetime -= m.delta;
                    this.canvasT1.refresh();
                }
            }
        }
        resizeCanvases() {
            this.canvasT1.resizeToFactor();
            this.canvasT1.refresh();
        }
        messageStep(message) {
            switch (message) {
                case Msg.TICK:
                    this.tickRefreshContent();
                    break;
            }
        }
        drawResult(ctx) {
            this.canvasT1.display(ctx);
        }
    }
    class SHighScoreReporter extends SPReporter {
        constructor() {
            super(307, 237, subcanvasImages["reporter2"], () => (String(g.recordHolder.previousScore)));
            this.canvasT1.width = 190;
            this.canvasT1.height = 40;
            this.switchToDrawHighScore();
        }
        tryShow() {
            if (g.recordHolder.highScore > 0) {
                this.visible = true;
            }
        }
        switchToDrawHighScore() {
            this.outputFunction = () => (String(g.recordHolder.highScore));
            this.canvasT1.draw = (ctx1) => {
                ctx1.font = '16px "JetBrains Mono", monospace';
                ctx1.fillStyle = "#5f6995";
                ctx1.textAlign = "center";
                ctx1.fillText("Рекорд", this.canvasT1.width / 2, this.canvasT1.height - 5 - 18);
                ctx1.fillText(`на ${g.recordHolder.recordDate}`, this.canvasT1.width / 2, this.canvasT1.height - 5);
            };
            this.canvasT1.refresh();
        }
        switchToDrawPreviousScore() {
            this.outputFunction = () => (String(g.recordHolder.previousScore));
            this.canvasT1.draw = (ctx1) => {
                ctx1.font = '16px "JetBrains Mono", monospace';
                ctx1.fillStyle = "#5f6995";
                ctx1.textAlign = "center";
                ctx1.fillText("Предыдущий рекорд", this.canvasT1.width / 2, this.canvasT1.height - 5);
            };
            this.canvasT1.refresh();
        }
    }
    class SWindowFrameBG extends Sprite {
        constructor() {
            super();
            this.layer = 1;
            this.image_frame = subcanvasImages["window-frame1"];
            this.visible = false;
        }
        drawResult(ctx) {
            ctx.drawImage(this.image_frame.v, 0, 0);
        }
    }
    class SWindowInstructions extends Sprite {
        constructor() {
            super(0, 0, subcanvasImages["window_instructions-text"]);
            this.layer = 1;
            this.visible = false;
        }
    }
    class SWindowGameOverLabel extends Sprite {
        constructor() {
            super(39, 140);
            this.layer = 1;
            this.visible = false;
            this.texts = [];
            this.canvasT1 = new Subcanvas(226, 40, (ctx1) => {
                ctx1.font = '16px "JetBrains Mono", monospace';
                ctx1.textAlign = "center";
                ctx1.fillStyle = "#eaffb7";
                if (this.texts.length === 2) {
                    ctx1.fillText(this.texts[0], this.canvasT1.width / 2, this.canvasT1.height - 5 - 18);
                    ctx1.fillText(this.texts[1], this.canvasT1.width / 2, this.canvasT1.height - 5);
                }
                else {
                    ctx1.fillText(this.texts[0], this.canvasT1.width / 2, this.canvasT1.height - 5 - 9);
                }
            }, { scaleSelf: true });
        }
        tryShow() {
            this.visible = true;
            const currentDate = new Date();
            this.texts = ((s.game.score > g.recordHolder.previousScore && g.recordHolder.previousScore > 0)
                ? ["Новый рекорд!"]
                : (currentDate.getDate() === 8 && currentDate.getMonth() === 3 - 1)
                    ? ["С 8 марта!"]
                    : ["Спасибо за то, что", "поиграли!"]);
            this.canvasT1.refresh();
        }
        tickRefreshContent() {
            if (m.isResized) {
                this.resizeCanvases();
            }
        }
        resizeCanvases() {
            this.canvasT1.resizeToFactor();
            this.canvasT1.refresh();
        }
        messageStep(message) {
            switch (message) {
                case Msg.TICK:
                    this.tickRefreshContent();
                    break;
            }
        }
        drawResult(ctx) {
            this.canvasT1.display(ctx);
        }
    }
    class SLevelSideBG extends Sprite {
        constructor() {
            super(289, 40, subcanvasImages["level_side_reporter_bg"]);
            this.layer = 1;
            this.visible = false;
        }
    }
    class SWindowPause extends Sprite {
        constructor() {
            super(100, 110, subcanvasImages["text_pause"]);
            this.layer = 1;
            this.visible = false;
        }
        messageStep(message) {
            switch (message) {
                case Msg.GAME_PAUSE:
                    this.visible = true;
                    break;
                case Msg.GAME_RESUME:
                    this.visible = false;
                    break;
            }
        }
    }
    class SButton extends Sprite {
        constructor(x, y, p) {
            super(x, y);
            this.layer = 1;
            this.pressing = false;
            this.disabled = false;
            this.visible = false;
            this.p = p;
            this.setImage(this.p.imageIdle);
        }
        handleClick(message) {
            switch (message) {
                case Msg.TICK:
                    if (this.visible) {
                        if (!this.disabled) {
                            if (this.pressing && m.mouseDown === 0) {
                                if (this.Collidable.collidePoint(m.mouseX, m.mouseY)) {
                                    this.p.action();
                                }
                                this.pressing = false;
                            }
                            if (m.clickedSprite === this) {
                                this.pressing = true;
                            }
                            this.image = (this.pressing) ? this.p.imagePressed : this.p.imageIdle;
                        }
                        else {
                            this.image = (this.p.imageDisabled) ? this.p.imageDisabled : this.p.imageIdle;
                        }
                    }
                    break;
                case this.p.msgShow:
                    this.visible = true;
                    break;
                case this.p.msgHide:
                    this.visible = false;
                    break;
            }
        }
        messageStep(message) {
            this.handleClick(message);
        }
    }
    class SButtonPlay extends SButton {
        constructor() {
            super(104, 202, {
                imageIdle: subcanvasImages["button_play"],
                imagePressed: subcanvasImages["button_play-p"],
                msgShow: Msg.SHOW_PLAY_BUTTON,
                msgHide: Msg.HIDE_PLAY_BUTTON,
                action: () => {
                    m.messages.broadcast(Msg.GAME_START);
                    m.messages.broadcast(Msg.HIDE_PLAY_BUTTON);
                }
            });
            this.Collidable = new CompHitbox(this);
            this.Clickable = new CompClickable(this, this.Collidable);
        }
    }
    class SButtonPause extends SButton {
        constructor() {
            super(438, 4, {
                imageIdle: subcanvasImages["button_pause"],
                imagePressed: subcanvasImages["button_pause-p"],
                msgShow: Msg.GAME_START,
                msgHide: Msg.HIDE_PAUSE_BUTTON,
                action: () => {
                    m.messages.broadcast((!g.pause) ? Msg.GAME_PAUSE : Msg.GAME_RESUME);
                }
            });
            this.Collidable = new CompHitbox(this);
            this.Clickable = new CompClickable(this, this.Collidable);
        }
    }
    class SButtonContinue extends SButton {
        constructor() {
            super(87, 185, {
                imageIdle: subcanvasImages["button_continue"],
                imagePressed: subcanvasImages["button_continue-p"],
                msgShow: Msg.GAME_PAUSE,
                msgHide: Msg.GAME_RESUME,
                action: () => {
                    m.messages.broadcast(Msg.GAME_RESUME);
                }
            });
            this.Collidable = new CompHitbox(this, {
                offsetX: 2,
                offsetY: 2,
                width: this.width - 6,
                height: this.height - 8
            });
            this.Clickable = new CompClickable(this, this.Collidable);
        }
    }
    class SButtonQuit extends SButton {
        constructor() {
            super(118, 215, {
                imageIdle: subcanvasImages["button_quit"],
                imagePressed: subcanvasImages["button_quit-p"],
                msgShow: Msg.GAME_PAUSE,
                msgHide: Msg.GAME_RESUME,
                action: () => {
                    s.game.visibleScore = s.game.score;
                    g.recordHolder.save(s.game.score, s.game.level);
                    m.messages.broadcast(Msg.GAME_RESUME);
                    m.messages.broadcast(Msg.GAME_OVER2);
                }
            });
            this.Collidable = new CompHitbox(this, {
                offsetX: 2,
                offsetY: 2,
                width: this.width - 6,
                height: this.height - 8
            });
            this.Clickable = new CompClickable(this, this.Collidable);
        }
    }
    class SButtonLeft extends SButton {
        constructor() {
            super(162, 198, {
                imageIdle: subcanvasImages["button_left"],
                imagePressed: subcanvasImages["button_left-p"],
                imageDisabled: subcanvasImages["button_left-disabled"],
                msgShow: Msg.SHOW_LEVEL_SELECTION,
                msgHide: Msg.HIDE_PLAY_BUTTON,
                action: () => {
                    s.main.changeLevel(-1);
                }
            });
            this.Collidable = new CompHitbox(this, {
                offsetX: 0,
                offsetY: 0,
                width: 15,
                height: 15
            });
            this.Clickable = new CompClickable(this, this.Collidable);
        }
        messageStep(message) {
            this.handleClick(message);
        }
    }
    class SButtonRight extends SButton {
        constructor() {
            super(210, 198, {
                imageIdle: subcanvasImages["button_right"],
                imagePressed: subcanvasImages["button_right-p"],
                imageDisabled: subcanvasImages["button_right-disabled"],
                msgShow: Msg.SHOW_LEVEL_SELECTION,
                msgHide: Msg.HIDE_PLAY_BUTTON,
                action: () => {
                    s.main.changeLevel(1);
                }
            });
            this.Collidable = new CompHitbox(this, {
                offsetX: 0,
                offsetY: 0,
                width: 15,
                height: 15
            });
            this.Clickable = new CompClickable(this, this.Collidable);
        }
        messageStep(message) {
            this.handleClick(message);
        }
    }
    class SLevelSelectionLabel extends Sprite {
        constructor() {
            super(80, 193);
            this.layer = 1;
            this.visible = false;
            this.cT1 = new Subcanvas(80, 24, (ctx1) => {
                ctx1.font = '16px "JetBrains Mono", monospace';
                ctx1.fillStyle = "#ffedb7";
                ctx1.textAlign = "left";
                ctx1.fillText("Уровень", 2, 18);
            }, { scaleSelf: true });
        }
        tickRefreshContent() {
            if (m.isResized) {
                this.cT1.resizeToFactor();
                if (this.visible) {
                    this.cT1.refresh();
                }
            }
        }
        messageStep(message) {
            switch (message) {
                case Msg.TICK:
                    this.tickRefreshContent();
                    break;
                case Msg.SHOW_LEVEL_SELECTION:
                    this.visible = true;
                    this.cT1.refresh();
                    break;
                case Msg.HIDE_PLAY_BUTTON:
                    this.visible = false;
                    break;
            }
        }
        drawResult(ctx) {
            this.cT1.display(ctx);
        }
    }
    class SLevelSelectionNumber extends Sprite {
        constructor() {
            super(178, 193);
            this.layer = 1;
            this.visible = false;
            this.cT1 = new Subcanvas(32, 24, (ctx1) => {
                ctx1.font = 'bold 16px "JetBrains Mono", monospace';
                ctx1.fillStyle = "#ffffff";
                ctx1.textAlign = "center";
                ctx1.fillText(String(s.main.selectedLevel), this.cT1.width / 2, 18);
            }, { scaleSelf: true });
        }
        tickRefreshContent() {
            if (m.isResized) {
                this.cT1.resizeToFactor();
                if (this.visible) {
                    this.cT1.refresh();
                }
            }
        }
        messageStep(message) {
            switch (message) {
                case Msg.TICK:
                    this.tickRefreshContent();
                    break;
                case Msg.SHOW_LEVEL_SELECTION:
                    this.visible = true;
                    break;
                case Msg.HIDE_PLAY_BUTTON:
                    this.visible = false;
                    break;
            }
        }
        update() {
            this.cT1.refresh();
        }
        drawResult(ctx) {
            this.cT1.display(ctx);
        }
    }
    class SPAnimatedCanvasText1 extends Sprite {
        constructor(x, y, width, textLines = 2, fontHeight = 32, offsetY = 2) {
            super(x, y);
            this.layer = 1;
            this.p1 = [];
            this.p2 = 0;
            this.p = {
                fillStyle: "",
                strokeStyle: "",
                noShadow: false
            };
            this.animDuration = 0;
            this.animLifetime = 0;
            this.canvasO2_refresh = false;
            this.fontHeight = fontHeight;
            this.offsetY = offsetY;
            this.width = width;
            this.height = Math.round((fontHeight * textLines * 1.1) + 20);
            this.currentWidth = this.width;
            this.currentHeight = this.height;
            this.canvas1 = new Subcanvas(this.width, this.height, (ctx1, action = (text, ctx) => {
                this.renderBaseWithShadow(ctx, text, "#00000080");
            }) => {
                ctx1.fillStyle = this.p.fillStyle;
                ctx1.strokeStyle = this.p.strokeStyle;
                ctx1.lineWidth = 6;
                ctx1.lineCap = "round";
                ctx1.lineJoin = "round";
                ctx1.font = `bold ${this.fontHeight}px "JetBrains Mono", monospace`;
                ctx1.textAlign = "center";
                ctx1.textBaseline = "middle";
                this.renderMultiLineText(ctx1, this.p1, action);
            }, { scaleSelf: true });
            this.canvas2 = new Subcanvas(this.width, this.height, (ctx2, openingFactor = 0, gradientHeight = 10) => {
                let coverageHeight = (this.height / 2) + gradientHeight;
                let closingValue = clamp(coverageHeight - (coverageHeight * openingFactor), 0, coverageHeight);
                ctx2.fillStyle = ctxLinearGradient(ctx2, 0, closingValue - gradientHeight, 0, closingValue, [{ color: "#000000", stop: 0 }, { color: "#00000000", stop: 1 }]);
                ctx2.fillRect(0, 0, this.width, this.height);
                ctx2.fillStyle = ctxLinearGradient(ctx2, 0, this.height - closingValue + gradientHeight, 0, this.height - closingValue, [{ color: "#000000", stop: 0 }, { color: "#00000000", stop: 1 }]);
                ctx2.fillRect(0, 0, this.width, this.height);
            }, { scaleSelf: true });
            this.canvas3 = new Subcanvas(this.width, this.height, (ctx3) => {
                ctx3.globalCompositeOperation = "source-over";
                ctx3.drawImage(this.canvas1.c, 0, 0);
                ctx3.globalCompositeOperation = "destination-out";
                ctx3.drawImage(this.canvas2.c, 0, 0);
            });
            this.visible = false;
        }
        renderBaseWithShadow(ctx1, text, shadowColor) {
            if (!this.p.noShadow) {
                ctx1.shadowBlur = sf(6);
                ctx1.shadowOffsetX = sf(5);
                ctx1.shadowOffsetY = sf(5 + this.height);
                ctx1.shadowColor = shadowColor;
                ctx1.strokeText(text, 0, 0 - this.height);
                ctx1.fillText(text, 0, 0 - this.height);
            }
            ctx1.shadowColor = "#00000000";
            ctx1.strokeText(text, 0, 0);
            ctx1.fillText(text, 0, 0);
        }
        renderMultiLineText(ctx1, texts, action = (text, ctx) => {
            this.renderBaseWithShadow(ctx, text, "#00000080");
        }) {
            let lineSpacing = this.fontHeight * 1.1;
            let x = this.width / 2;
            let y = (this.height - lineSpacing * (texts.length - 1)) / 2 + this.offsetY;
            for (let text of texts) {
                ctx1.translate(Math.round(x), Math.round(y));
                action(text, ctx1);
                ctx1.translate(-Math.round(x), -Math.round(y));
                y += lineSpacing;
            }
        }
        drawResult(ctx) {
            this.canvas3.display(ctx);
        }
        beginAnimation(p1, animDuration, p) {
            this.visible = true;
            this.p1 = p1;
            this.p2 = 0;
            this.p.fillStyle = (p && p.fillStyle) ? p.fillStyle : "#eaffb7";
            this.p.strokeStyle = (p && p.strokeStyle) ? p.strokeStyle : "#5f6995";
            this.p.noShadow = (p && p.noShadow) ? p.noShadow : false;
            this.animDuration = animDuration;
            this.animLifetime = this.animDuration;
            this.canvas1.refresh();
            this.canvas2.refresh(this.p2);
            this.canvas3.refresh();
        }
        handleResize() {
            if (m.isResized) {
                this.resizeCanvases();
                if (this.animLifetime > 0 || this.visible) {
                    this.canvas1.refresh();
                    this.canvasO2_refresh = true;
                }
            }
        }
        resizeCanvases() {
            this.currentWidth = sf(this.width);
            this.currentHeight = sf(this.height);
            this.canvas1.resizeToFactor();
            this.canvas2.resizeToFactor();
            this.canvas3.resizeToFactor();
        }
    }
    class SLevelDisplayer extends SPAnimatedCanvasText1 {
        constructor() {
            super(32, 135, 240, 2);
            this.layer = 1;
            this.animUpdate1 = false;
            this.compPause = new CompPause(this);
        }
        refreshComplexCanvas() {
            if (this.animLifetime > this.animDuration - 0.4) {
                this.animUpdate1 = true;
                this.p2 = scaleClamp(this.animLifetime, this.animDuration, this.animDuration - 0.4, 0, 1);
                this.canvasO2_refresh = true;
            }
            else if (this.animUpdate1 && this.animLifetime > 0.4) {
                this.animUpdate1 = false;
                this.p2 = 1;
                this.canvasO2_refresh = true;
            }
            else if (this.animLifetime > 0) {
                this.p2 = scaleClamp(this.animLifetime, 0.4, 0, 1, 0);
                this.canvasO2_refresh = true;
            }
            if (this.canvasO2_refresh) {
                this.canvas2.refresh(this.p2);
                this.canvas3.refresh();
            }
            this.canvasO2_refresh = false;
        }
        messageStep(message) {
            this.compPause.hideOnPause(message);
            switch (message) {
                case Msg.ANIM_START_DISPLAY_LEVEL:
                    this.goTo(32, 135);
                    this.beginAnimation(["".concat("УРОВЕНЬ ", String(s.game.level))], 2.4);
                    break;
                case Msg.LEVEL_COMPLETE1:
                    this.beginAnimation(["УРОВЕНЬ", "ЗАВЕРШЁН"], 1.4);
                    break;
                case Msg.GAME_OVER1:
                    this.beginAnimation(["ИГРА", "ОКОНЧЕНА"], 2.4, { fillStyle: "#ffedb7" });
                    break;
                case Msg.GAME_OVER2:
                    this.goTo(32, 32);
                    this.beginAnimation(["ИГРА", "ОКОНЧЕНА"], 0, { fillStyle: "#ffedb7", strokeStyle: "#575963", noShadow: true });
                    break;
                case Msg.TICK:
                    this.handleResize();
                    break;
                case Msg.TICK_RESUMED:
                    if (this.animLifetime > 0 || this.animDuration <= 0) {
                        if (this.animLifetime > -1) {
                            this.animLifetime -= m.delta;
                        }
                        if (this.animLifetime > 0 || this.animDuration <= 0) {
                            this.refreshComplexCanvas();
                        }
                        else {
                            this.visible = false;
                            if (g.state === "animationLevel") {
                                m.messages.broadcast(Msg.LEVEL_START1);
                                m.messages.broadcast(Msg.ANIM_START_DISPLAY_LEVEL_SIDE);
                            }
                            if (g.state === "animationLevelComplete1") {
                                m.messages.broadcast(Msg.LEVEL_COMPLETE2);
                            }
                            if (g.state === "animationGameOver") {
                                m.messages.broadcast(Msg.GAME_OVER2);
                            }
                        }
                    }
                    break;
            }
        }
    }
    class SLevelSideReporter extends SPAnimatedCanvasText1 {
        constructor() {
            super(278, 45, 202, 2);
            this.layer = 1;
        }
        messageStep(message) {
            switch (message) {
                case Msg.ANIM_START_DISPLAY_LEVEL:
                    this.visible = false;
                    break;
                case Msg.SHOW_PLAY_BUTTON:
                    this.visible = false;
                    break;
                case Msg.ANIM_START_DISPLAY_LEVEL_SIDE:
                    this.beginAnimation(["УРОВЕНЬ", String(s.game.level)], 0.4);
                    break;
                case Msg.TICK:
                    this.handleResize();
                    if (this.animLifetime > 0) {
                        this.animLifetime -= m.delta;
                        if (this.animLifetime > 0) {
                            this.p2 = scale(this.animLifetime, 0.4, 0, 0, 1);
                            this.canvasO2_refresh = true;
                        }
                        else {
                            this.p2 = 1;
                            this.canvasO2_refresh = true;
                        }
                    }
                    if (this.canvasO2_refresh) {
                        this.canvas2.refresh(this.p2);
                        this.canvas3.refresh();
                    }
                    this.canvasO2_refresh = false;
                    break;
            }
        }
    }
    class SDebug extends Sprite {
        constructor() {
            super(...arguments);
            this.visible = false;
            this.layer = 1;
        }
        draw(ctx) {
            ctx.scale(sf(1), sf(1));
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff80";
            let x = 0;
            let y = 0;
            for (let row = 0; row < s.game.ROWS - 1; row += 1) {
                for (let col = 0; col < s.game.COLUMNS; col += 1) {
                    x = 32 + (20 * col);
                    y = 31 + (20 * row);
                    ctx.fillText(String(s.game.grid[row][col]), x + 10, y + 10);
                }
            }
        }
    }
    const dp = window.devicePixelRatio;
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const els = {
        divProgressBar: document.getElementById("divProgressBar"),
        divGame: document.getElementById("divGame"),
        divCanvasPositioning: document.getElementById("divCanvasPositioning"),
        divCanvas: document.getElementById("divCanvas"),
        divCanvasElements: document.getElementById("divCanvasElements"),
        divDialog1: document.getElementById("divDialog1"),
        bFullscreen: document.getElementById("bFullscreen"),
        bFullscreenImgSwitch: document.querySelectorAll(".bFullscreenImgSwitch")
    };
    class CanvasSize {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.scaledWidth = width;
            this.scaledHeight = height;
        }
    }
    const canvasSize = new CanvasSize(480, 360);
    els.divCanvasElements.style.width = `${canvasSize.width}px`;
    els.divCanvasElements.style.height = `${canvasSize.height}px`;
    const divCanvasPos = { x: 0, y: 0 };
    Service.cacheMasks();
    class SpriteStorage {
        constructor() {
            this.main = new Main();
            this.game = new SGame();
            this.field_background = new SFieldBackground();
            this.tiles = [];
            this.magic_ball_particles = [];
            this.bomb_explosion_particles = [];
            this.row_blocks = [];
            this.row_block_particles = [];
            this.score_splash = new SScoreSplashPersistent();
            this.bonus_splash2 = new SBonusSplashPersistent();
            this.flood_screen_effect = new SFloodScreenEffectPersistent();
            this.overflow_warning_effect = new SOverflowWarningEffect();
            this.c_bottom_row = new CBottomRow();
            this.cover_background = new SCoverBackground();
            this.level_side_bg = new SLevelSideBG();
            this.level_side_reporter = new SLevelSideReporter();
            this.lines_left_reporter = new SLinesLeftReporter();
            this.score_reporter = new SScoreReporter();
            this.high_score_reporter = new SHighScoreReporter();
            this.high_score_label = new SHighScoreLabel();
            this.window_frame_bg = new SWindowFrameBG();
            this.window_instructions = new SWindowInstructions();
            this.window_game_over_label = new SWindowGameOverLabel();
            this.text_pause = new SWindowPause();
            this.button_play = new SButtonPlay();
            this.button_pause = new SButtonPause();
            this.button_continue = new SButtonContinue();
            this.button_quit = new SButtonQuit();
            this.level_selection_label = new SLevelSelectionLabel();
            this.level_selection_number = new SLevelSelectionNumber();
            this.button_left = new SButtonLeft();
            this.button_right = new SButtonRight();
            this.level_displayer = new SLevelDisplayer();
            this.debug = new SDebug();
            this.sprites = [];
            this.maxLayers = 1;
        }
        start() {
            this.sprites = [
                this.main, this.game,
                this.field_background,
                this.tiles, this.row_blocks,
                this.c_bottom_row,
                this.row_block_particles, this.magic_ball_particles, this.bomb_explosion_particles,
                this.flood_screen_effect, this.overflow_warning_effect,
                this.cover_background, this.level_side_bg, this.level_side_reporter, this.score_reporter, this.high_score_label, this.lines_left_reporter, this.high_score_reporter,
                this.window_frame_bg, this.window_instructions, this.window_game_over_label,
                this.button_play, this.level_selection_label, this.level_selection_number, this.button_left, this.button_right,
                this.text_pause, this.button_continue, this.button_quit,
                this.button_pause,
                this.level_displayer, this.score_splash, this.bonus_splash2,
                this.debug
            ];
        }
        getClickedSprite() {
            for (let i = this.sprites.length - 1; i >= 0; i -= 1) {
                let obj = this.sprites[i];
                if (Array.isArray(obj)) {
                    for (let ii = obj.length - 1; ii >= 0; ii -= 1) {
                        let obj2 = obj[ii];
                        if (obj2.Clickable && obj2.Clickable.checkClick()) {
                            return obj2;
                        }
                    }
                }
                else {
                    if (obj.Clickable && obj.Clickable.checkClick()) {
                        return obj;
                    }
                }
            }
            return null;
        }
        messageStepSprites() {
            while (m.messages.isNotEmpty()) {
                let message = m.messages.obtain();
                for (let obj of this.sprites) {
                    if (Array.isArray(obj)) {
                        for (let obj2 of obj) {
                            if (!obj2.new && !obj2.delete && !(obj2.master && obj2.master.delete)) {
                                obj2.messageStep(message);
                            }
                        }
                    }
                    else {
                        if (!obj.new && !obj.delete && !(obj.master && obj.master.delete)) {
                            obj.messageStep(message);
                        }
                    }
                }
            }
        }
        handleDeleteSprites() {
            for (let group of this.sprites) {
                if (Array.isArray(group)) {
                    for (let i = group.length - 1; i >= 0; i -= 1) {
                        let sprite = group[i];
                        if (sprite.delete
                            || (sprite.master && sprite.master.delete)) {
                            group.splice(i, 1);
                        }
                    }
                }
            }
        }
        takeNewFromSprites() {
            for (let obj of this.sprites) {
                if (Array.isArray(obj)) {
                    for (let sprite of obj) {
                        if (sprite.new) {
                            sprite.new = false;
                        }
                    }
                }
                else {
                    if (obj.new) {
                        obj.new = false;
                    }
                }
            }
        }
        drawSprites(ctx) {
            for (let layer = 0; layer <= this.maxLayers; layer++) {
                for (let obj of this.sprites) {
                    if (Array.isArray(obj)) {
                        for (let sprite of obj) {
                            if (sprite.visible && layer === sprite.layer) {
                                ctx.save();
                                sprite.draw(ctx);
                                ctx.restore();
                                ctx.resetTransform();
                            }
                        }
                    }
                    else {
                        if (obj.visible && layer === obj.layer) {
                            ctx.save();
                            obj.draw(ctx);
                            ctx.restore();
                            ctx.resetTransform();
                        }
                    }
                }
            }
        }
    }
    const s = new SpriteStorage();
    s.start();
    s.takeNewFromSprites();
    if (m.isTouchDevice) {
        els.divCanvas.addEventListener("touchstart", function (event) {
            m.mouseDown = 1;
            Service.findTouchPosition(event);
        });
        els.divCanvas.addEventListener("touchmove", function (event) {
            Service.findTouchPosition(event);
        }, { passive: false });
        els.divCanvas.addEventListener("touchend", function () {
            m.mouseDown = 0;
        });
    }
    else {
        els.divCanvas.addEventListener("mouseout", function () {
            m.mouseDown = 0;
        });
        els.divCanvas.addEventListener("mousemove", function (event) {
            m.mouseX = Math.round((event.clientX - divCanvasPos.x) / m.scaleFactor * dp);
            m.mouseY = Math.round((event.clientY - divCanvasPos.y) / m.scaleFactor * dp);
        });
        els.divCanvas.addEventListener("mousedown", function () {
            m.mouseDown = 1;
        });
        els.divCanvas.addEventListener("mouseup", function () {
            m.mouseDown = 0;
        });
    }
    {
        const inputs = document.querySelectorAll("#divCanvasElements input, #divCanvasElements textarea");
        for (let input of inputs) {
            input.addEventListener("change", function (event) {
                event.target.blur();
            });
            input.addEventListener("blur", function (event) {
                m.isFocused = false;
                els.divCanvasPositioning.classList.remove("js-input-scrollable");
            });
            input.addEventListener("focus", function (event) {
                m.isFocused = true;
            });
        }
    }
    els.divCanvas.addEventListener("contextmenu", function (event) {
        const target = event.target;
        if (target && (target.id === "canvas" || target.id === "divCanvasElements" || target.classList.contains("transparent"))) {
            event.preventDefault();
        }
    });
    window.addEventListener("resize", function () {
        if (!m.isFocused) {
            Service.resizeDivCanvas();
        }
        else {
            if (window.innerHeight * dp < canvasSize.scaledHeight) {
                els.divCanvasPositioning.classList.add("js-input-scrollable");
            }
            else {
                els.divCanvasPositioning.classList.remove("js-input-scrollable");
            }
        }
    });
    let waitingForFullscreen = false;
    let isFullscreen = false;
    const isFullscreenSupported = ((document.fullscreenEnabled) ? (document.fullscreenEnabled) : false);
    if (isFullscreenSupported) {
        els.bFullscreen.addEventListener("click", function (event) {
            if (waitingForFullscreen) {
                Service.hideDialog1();
                Service.updateBFullscreenImg();
            }
            else {
                if (!isFullscreen) {
                    if (!m.isFocused) {
                        if (!m.isMobile || window.matchMedia("(orientation: landscape)").matches) {
                            document.documentElement.requestFullscreen();
                        }
                        else {
                            Service.showDialog1();
                            Service.updateBFullscreenImg();
                        }
                    }
                }
                else {
                    document.exitFullscreen();
                }
            }
        });
        window.matchMedia("(orientation: landscape)").addEventListener("change", function (event) {
            if (waitingForFullscreen && event.matches) {
                document.documentElement.requestFullscreen();
                Service.hideDialog1();
            }
        });
        document.addEventListener("fullscreenchange", function (event) {
            isFullscreen = Boolean(document.fullscreenElement);
            Service.updateBFullscreenImg();
        });
    }
    else {
        els.bFullscreen.classList.add("hide2");
    }
    hideEl(els.divProgressBar);
    showEl(els.divGame);
    Service.resizeDivCanvas();
    m.messages.broadcast(Msg.START);
    let lastFrameMs = 0;
    function tick(currentMs) {
        m.time = currentMs / 1000;
        m.delta = (currentMs - lastFrameMs) / 1000;
        if (m.delta > 0.5) {
            m.delta = 0;
        }
        lastFrameMs = currentMs;
        {
            if (!m.isFocused)
                m.clickedSprite = s.getClickedSprite();
            m.messages.broadcast(Msg.TICK);
            s.messageStepSprites();
            s.takeNewFromSprites();
            s.handleDeleteSprites();
            ctx.clearRect(0, 0, canvasSize.scaledWidth, canvasSize.scaledHeight);
            s.drawSprites(ctx);
            m.isResized = false;
            if (m.mouseDown === 1) {
                m.mouseDown = 2;
            }
        }
        window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
}
start();
