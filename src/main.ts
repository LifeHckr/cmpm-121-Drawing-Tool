import "./style.css";

//const's-----------------------------------
const APP_NAME : string = "Draw Thing Please!";
const CANVAS_WIDTH : number = 256;
const CANVAS_HEIGHT : number = 256;
const drawing_changed : Event = new CustomEvent("drawing-changed");
//-------end const's---------------------------------
//HTML SETUP------------------------------------
const page: HTMLDivElement  = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
const title :HTMLHeadingElement =  document.createElement("h1");
title.innerHTML = APP_NAME;
page.append(title);
const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
page.append(canvas);
const button_div : HTMLDivElement = document.createElement("div");
page.append(button_div);
const command_button_div : HTMLDivElement = document.createElement("div");
button_div.append(command_button_div);
const undo_button = document.createElement("button");
undo_button.innerHTML = "undo";
command_button_div.append(undo_button);
const redo_button = document.createElement("button");
redo_button.innerHTML = "redo";
command_button_div.append(redo_button);
const clear_button = document.createElement("button");
clear_button.innerHTML = "clear";
command_button_div.append(clear_button);
const ctx = canvas.getContext("2d");
//END HTML-------------------------------------------

//Set up drawing---------------------------------
type stroke = [start_x:number, start_y:number, end_x:number, end_y:number];
type path = stroke[];

let draw_buffer : path[] = [];
let draw_buffer_size : number = 0;
let undo_buffer : path[] = [];
let undo_buffer_size : number = 0;

const cursor = { active: false, x: 0, y: 0 };

function draw_all_to_canvas(ctx : CanvasRenderingContext2D, buffer : path[]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let path_index = 0; path_index < buffer.length; path_index++) {
        if (!buffer[path_index]) {
            continue;
        }
        for (let stroke_index : number = 0; stroke_index < buffer[path_index].length; stroke_index++) {
            ctx.beginPath();//begin path
            ctx.moveTo(buffer[path_index][stroke_index][0], buffer[path_index][stroke_index][1]); //start point
            ctx.lineTo(buffer[path_index][stroke_index][2], buffer[path_index][stroke_index][3]);//line to for each move
            ctx.stroke(); //stroke, draws the current path
        }
    }
}
function clear_canvas(ctx : CanvasRenderingContext2D) {
    draw_buffer = [];
    draw_buffer_size = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function undo() {
    if (draw_buffer_size > 0) {
        undo_buffer.push(draw_buffer.pop());
        draw_buffer_size--;
        undo_buffer_size++;
    }
    draw_all_to_canvas(ctx, draw_buffer);
}
function redo() {
    if (undo_buffer_size > 0) {
        draw_buffer.push(undo_buffer.pop());
        draw_buffer_size++;
        undo_buffer_size--;
    }
    draw_all_to_canvas(ctx, draw_buffer);
}
canvas.addEventListener("mousedown", (e) => {
    if (cursor.active) { //temporary fix for issues arising when the cursor leaves the canvas
        draw_buffer_size++;
        undo_buffer_size = 0; //reset undo buffer if an action has been taken, cant undo the draw then redo
    }
    cursor.active = true;
    draw_buffer[draw_buffer_size] = [];
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
});
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        let cur_stroke : stroke = [cursor.x, cursor.y, e.offsetX, e.offsetY];
        draw_buffer[draw_buffer_size].push(cur_stroke);
        canvas.dispatchEvent(drawing_changed);
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
});
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    draw_buffer_size++;
    undo_buffer_size = 0;
});
canvas.addEventListener("drawing-changed", () => {
    draw_all_to_canvas(ctx, draw_buffer);
});
undo_button.addEventListener("click", () => {
    undo();
});
redo_button.addEventListener("click", () => {
    redo();
});
clear_button.addEventListener("click", () => {
    clear_canvas(ctx);
    undo_buffer_size = 0;
});


