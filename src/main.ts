import "./style.css";

//const's-----------------------------------
const APP_NAME : string = "Draw Thing Please!";
const CANVAS_WIDTH : number = 256;
const CANVAS_HEIGHT : number = 256;
const MAGIC_NUMBER : number = -1;
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
clear_button.innerHTML = "reset";
command_button_div.append(clear_button);
const ctx = canvas.getContext("2d");
//END HTML-------------------------------------------

//Set up drawing---------------------------------
type Drawable_Command = {
    display : (ctx : CanvasRenderingContext2D) => void;
    drag : (x:number, y:number) => void;
};
class Marker_Line_Action implements Drawable_Command {
    points :[number, number][]= [];
    empty = true;
    constructor(x : number, y:number) {
        this.points.push([x, y]);
    }
    drag(x:number, y:number): void {
        this.points.push([x, y]);
        this.empty = false;
    }
    display(ctx:CanvasRenderingContext2D):void {
        for (let stroke_index : number = 1; stroke_index < this.points.length; stroke_index++) {
            ctx.beginPath();//begin path
            ctx.moveTo(this.points[stroke_index-1][0], this.points[stroke_index-1][1]); //start point
            ctx.lineTo(this.points[stroke_index][0], this.points[stroke_index][1]);//line to for each move
            ctx.stroke(); //stroke, draws the current path
        }
    }
}

let draw_buffer : Drawable_Command[] = [];
let draw_buffer_size : number = MAGIC_NUMBER;
let undo_buffer : Drawable_Command[] = [];
let undo_buffer_size : number = 0;

const cursor = { active: false, x: 0, y: 0 };

function render_canvas(ctx : CanvasRenderingContext2D, buffer : any[]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let path_index = 0; path_index < buffer.length; path_index++) {
        draw_buffer[path_index].display(ctx);
    }
}
function clear_canvas(ctx : CanvasRenderingContext2D) {
    draw_buffer = [];
    draw_buffer_size = MAGIC_NUMBER;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function undo() {
    if (draw_buffer_size > MAGIC_NUMBER) {
        undo_buffer.push(draw_buffer.pop());
        draw_buffer_size--;
        undo_buffer_size++;
    }
    render_canvas(ctx, draw_buffer);
}
function redo() {
    if (undo_buffer_size > 0) {
        draw_buffer.push(undo_buffer.pop());
        draw_buffer_size++;
        undo_buffer_size--;
    }
    render_canvas(ctx, draw_buffer);
}
canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    undo_buffer_size = 0; //reset undo buffer
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    draw_buffer_size++;
    draw_buffer[draw_buffer_size] = new Marker_Line_Action(cursor.x, cursor.y);
});
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        draw_buffer[draw_buffer_size].drag(cursor.x, cursor.y);
        canvas.dispatchEvent(drawing_changed);
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
});
page.addEventListener("mouseup", () => {
    cursor.active = false; //I could do mouseout, but I don't like fully cutting it off.
});
canvas.addEventListener("drawing-changed", () => {
    render_canvas(ctx, draw_buffer);
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


