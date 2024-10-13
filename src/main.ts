import "./style.css";

//const's-----------------------------------
const APP_NAME : string = "Draw Thing Please!";
const CANVAS_WIDTH : number = 256;
const CANVAS_HEIGHT : number = 256;
const THIN_THICKNESS = 1;
const THICK_THICKNESS = 5;
const MAGIC_NUMBER : number = -1;
const drawing_changed : Event = new CustomEvent("drawing-changed");
//-------end const's---------------------------------
//HTML SETUP------------------------------------
const page: HTMLDivElement  = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
make_html_element("h1", page, APP_NAME)
const canvas : HTMLCanvasElement = make_html_element("canvas", page);
const ctx : CanvasRenderingContext2D = canvas.getContext("2d");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const button_div : HTMLDivElement = make_html_element("div", page);
    const action_div : HTMLDivElement = make_html_element("div", button_div);
        const marker_button : HTMLButtonElement = make_html_element("button", action_div, "Marker");
    const action_detail_div : HTMLDivElement = make_html_element("div", action_div);
        const marker_detail_div : HTMLDivElement = make_html_element("div", action_detail_div);
            const marker_thick_button : HTMLButtonElement = make_html_element("button", marker_detail_div, "Thick");
            const marker_thin_button : HTMLButtonElement = make_html_element("button", marker_detail_div, "Thin");
    const command_button_div : HTMLDivElement = make_html_element("div", button_div);
        const undo_button: HTMLButtonElement = make_html_element("button", command_button_div, "Undo");
        const redo_button: HTMLButtonElement = make_html_element("button", command_button_div, "Redo");
        const clear_button: HTMLButtonElement = make_html_element("button", command_button_div, "Reset");
//Initial state------
marker_button.classList.add("selected");
marker_thin_button.classList.add("selected");
//-------------

//END HTML-------------------------------------------

//Set up drawing---------------------------------
type Drawable_Command = {
    display : (ctx : CanvasRenderingContext2D) => void;
    drag : (x:number, y:number) => void;
};
class Marker_Line_Action implements Drawable_Command {
    points :[number, number][]= [];
    thickness: number;
    empty = true;
    constructor(x : number, y:number, thickness:number = THIN_THICKNESS) {
        this.points.push([x, y]);
        this.thickness = thickness;
    }
    drag(x:number, y:number): void {
        this.points.push([x, y]);
        this.empty = false;
    }
    display(ctx:CanvasRenderingContext2D):void {
        ctx.lineWidth = this.thickness;
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

let cur_thickness : number = 1;

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
function make_html_element(type : string, parent : Element, name : string = ""):any  {
    let element = document.createElement(type);
    parent.appendChild(element);
    element.innerHTML = name;
    return element;
}

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    undo_buffer_size = 0; //reset undo buffer
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    draw_buffer_size++;
    draw_buffer[draw_buffer_size] = new Marker_Line_Action(cursor.x, cursor.y, cur_thickness);
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
marker_thin_button.addEventListener("click", () => {
    marker_thin_button.parentElement.querySelector(".selected").classList.remove("selected");
    marker_thin_button.classList.add("selected");
    cur_thickness = THIN_THICKNESS;
});
marker_thick_button.addEventListener("click", () => {
    marker_thick_button.parentElement.querySelector(".selected").classList.remove("selected");
    marker_thick_button.classList.add("selected");
    cur_thickness = THICK_THICKNESS;
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


