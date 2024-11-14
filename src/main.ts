import "./style.css";

//const's-----------------------------------This
const APP_NAME : string = "Draw Thing Please!";
const CANVAS_WIDTH : number = 256;
const CANVAS_HEIGHT : number = 256;
const EXPORT_HEIGHT : number = 1024;
const EXPORT_WIDTH : number = 1024;
const EMPTY_BUFFER_SIZE : number = -1;
const drawing_changed : Event = new CustomEvent("drawing-changed");
const cursor_change : Event = new CustomEvent("cursor-change");
enum DRAW_MODES {
    MARKER,
    STICKER
}
const stickers: Sticker_Config[] = [
    {name: "😎"},
    {name: "🫥"},
    {name: "👽"}
];
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
        const sticker_button : HTMLButtonElement = make_html_element("button", action_div, "Sticker");
    const action_detail_div : HTMLDivElement = make_html_element("div", action_div);
        const marker_detail_div : HTMLDivElement = make_html_element("div", action_detail_div);
            const color_picker : HTMLInputElement = make_html_element("input", marker_detail_div);
            color_picker.type = "color";
            const size_picker : HTMLInputElement = make_html_element("input", marker_detail_div);
            size_picker.type = "range";
            size_picker.max = "100";
            size_picker.min = "1";
            size_picker.step = "1";
            size_picker.value = "1";
            const size_label : HTMLInputElement = make_html_element("input", marker_detail_div);
            size_label.type = "number";
            size_label.value = size_picker.value;
        const sticker_detail_div : HTMLDivElement = make_html_element("div", action_detail_div);
            draw_sticker_buttons(stickers);
            const add_sticker_button : HTMLButtonElement = make_html_element("button", sticker_detail_div, "Add Sticker...");
    const command_button_div : HTMLDivElement = make_html_element("div", button_div);
        const undo_button: HTMLButtonElement = make_html_element("button", command_button_div, "Undo");
        const redo_button: HTMLButtonElement = make_html_element("button", command_button_div, "Redo");
        const clear_button: HTMLButtonElement = make_html_element("button", command_button_div, "Reset");
        const export_button: HTMLButtonElement = make_html_element("button", command_button_div, "Export");
//Initial state------
marker_button.classList.add("selected");
sticker_detail_div.hidden = true;
//-------------
//END HTML-------------------------------------------

//Set up drawing---------------------------------
type Sticker_Config = {name : string};
type Drawable_Command = {
    display : (ctx : CanvasRenderingContext2D) => void;
    drag : (x:number, y:number) => void;
};
type Cursor = {
    x: number;
    y: number;
    active:boolean;
};
class Preview_Drawable implements Drawable_Command {
    pos : [number, number];
    constructor(x : number, y : number) {
        this.pos = [x, y];
    }
    drag (x:number, y:number) {
        this.pos = [x, y];
    }
    display(ctx : CanvasRenderingContext2D) : void {
        switch (cur_mode) {
            case (DRAW_MODES.MARKER):
                ctx.lineWidth = 1; //lineTo thickness changes lineWidth, but arc doesn't. Fixes a slight artifacting.
                ctx.beginPath();
                ctx.strokeStyle = cur_color;
                ctx.fillStyle = cur_color;
                ctx.arc(this.pos[0], this.pos[1], cur_thickness * .5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;
            case (DRAW_MODES.STICKER):
                ctx.fillText(cur_sticker_text, this.pos[0] - ctx.measureText(cur_sticker_text).width/2, this.pos[1]+parseInt(ctx.font)/2);
                break;
        }
    }
}
class Marker_Line_Action implements Drawable_Command {
    points :[number, number][]= [];
    thickness: number;
    color : string;
    empty:boolean = true;
    constructor(x : number, y:number, thickness:number, color : string) {
        this.points.push([x, y]);
        this.thickness = thickness;
        this.color = color;
    }
    drag(x:number, y:number): void {
        this.points.push([x, y]);
        this.empty = false;
    }
    display(ctx:CanvasRenderingContext2D):void {
        console.log(ctx.fillStyle);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        if (this.empty) {
             ctx.lineWidth = 1; //lineTo thickness changes lineWidth, but arc doesn't. Fixes a slight artifacting.
             ctx.beginPath();
             ctx.arc(this.points[0][0], this.points[0][1], this.thickness * .5, 0, 2 * Math.PI);
             ctx.fill();
             ctx.stroke();
        }
        ctx.lineWidth = this.thickness;
        for (let stroke_index : number = 1; stroke_index < this.points.length; stroke_index++) {
            ctx.beginPath();
            ctx.moveTo(this.points[stroke_index-1][0], this.points[stroke_index-1][1]);
            ctx.lineTo(this.points[stroke_index][0], this.points[stroke_index][1]);
            ctx.stroke();//In case anyone cares, yes I know the lines are slightly more jagged, I know how to fix it, but I've kept it like this for consistency, and artistic vision.
        }
    }
}
class Sticker_Action implements Drawable_Command {
    pos : [number, number]; //center ~ x:length/2 y:fontSize/2
    text : string;
    rotation : number = 0;
    constructor(x : number, y : number, text : string) {
        this.pos = [x, y];
        this.text  = text;
    }
    drag (x:number, y:number): void {
        const pos_dif_as_vector : [number, number] = [x - this.pos[0], y - this.pos[1]];
        const angle = Math.atan2(pos_dif_as_vector[1], pos_dif_as_vector[0]);
        this.rotation = (angle);
    }
    display(ctx:CanvasRenderingContext2D):void {
        ctx.translate(this.pos[0], this.pos[1])
        ctx.rotate(this.rotation);
        ctx.fillText(this.text, ctx.measureText(this.text).width/-2, parseInt(ctx.font)/2);
        ctx.rotate(-this.rotation);
        ctx.translate(-this.pos[0], -this.pos[1])
    }
}

let draw_buffer : Drawable_Command[] = [];
let draw_buffer_size : number = EMPTY_BUFFER_SIZE;
let undo_buffer : Drawable_Command[] = [];
let undo_buffer_size : number = 0;

let cur_mode : DRAW_MODES = DRAW_MODES.MARKER;
let cur_thickness : number = 1;
let cur_color : string = color_picker.value;
let cur_sticker_text : string|null = null;

const cursor : Cursor = { active: false, x: 0, y: 0 };
let cursor_preview : Preview_Drawable|null = null;

//Function definitions---------------------------
//Renders all the current drawing commands in buffer to ctx
function render_canvas(ctx : CanvasRenderingContext2D, buffer : any[]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let path_index = 0; path_index < buffer.length; path_index++) {
        draw_buffer[path_index].display(ctx);
    }
    if (cursor_preview !== null) {
        cursor_preview.display(ctx);
    }
}
//Clears ctx and resets buffers
function clear_canvas(ctx : CanvasRenderingContext2D) {
    draw_buffer = [];
    draw_buffer_size = EMPTY_BUFFER_SIZE;
    undo_buffer_size = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
//Undoes the last action by popping it from current stack onto undo buffer.
function undo():void {
    if (draw_buffer_size > EMPTY_BUFFER_SIZE) {
        undo_buffer.push(draw_buffer.pop());
        draw_buffer_size--;
        undo_buffer_size++;
    }
    render_canvas(ctx, draw_buffer);
}
//Redoes last undone action by popping from undo stack. Cannot redo if a new action has been done.
function redo():void {
    if (undo_buffer_size > 0) {
        draw_buffer.push(undo_buffer.pop());
        draw_buffer_size++;
        undo_buffer_size--;
    }
    render_canvas(ctx, draw_buffer);
}
//Draws to a new canvas, which gets saved as png
function export_canvas(draw_buffer : Drawable_Command[]):void {
    const result_canvas : HTMLCanvasElement = document.createElement("canvas");
    result_canvas.width = EXPORT_WIDTH;
    result_canvas.height = EXPORT_HEIGHT;
    const result_ctx:CanvasRenderingContext2D = result_canvas.getContext("2d");
    const prompt_res:string = prompt("Transparent background?: (y/n)","n");
    if (prompt_res === "n") {
        result_ctx.fillStyle = "white";
        result_ctx.fillRect(0, 0, result_canvas.width, result_canvas.height);
        result_ctx.fill();
        result_ctx.fillStyle = "black";
    }
    result_ctx.scale(EXPORT_WIDTH/CANVAS_WIDTH, EXPORT_HEIGHT/CANVAS_HEIGHT);
    for (let path_index = 0; path_index < draw_buffer.length; path_index++) {
        draw_buffer[path_index].display(result_ctx);
    }
    const anchor:HTMLAnchorElement = document.createElement("a");
    anchor.href = result_canvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();

}
//Makes a html element of type, appends it to parent, and optionally sets innerHtml to name
function make_html_element(type : string, parent : Element, name : string = ""):any  {
    let element : HTMLElement = document.createElement(type);
    parent.appendChild(element);
    element.innerHTML = name;
    return element;
}
//Makes a button from custom sticker button
function make_sticker_button(parent : Element, name : string = "") : HTMLButtonElement {
    let button : HTMLButtonElement = make_html_element("button", parent, name);
    button.title = "Click and drag mouse to rotate sticker"; // Tooltip message
    button.addEventListener("click", () => {
        cur_sticker_text = name;
        if (button.parentElement.querySelector(".selected") !== null) {
            button.parentElement.querySelector(".selected").classList.remove("selected")
        }
        button.classList.add("selected");
        canvas.dispatchEvent(cursor_change);
    });
    return button;
}
//Draws the initial set of sticker buttons defined in buttons
function draw_sticker_buttons(button_list : Sticker_Config[]) {
    for (let i = 0; i < button_list.length; i++) {
        make_sticker_button(sticker_detail_div, button_list[i].name);
    }
}
//End-----------------------------------------------------

canvas.addEventListener("mouseout", () => {
    cursor_preview = null;
    canvas.dispatchEvent(cursor_change);
});
canvas.addEventListener("mouseenter", (e) => {
    cursor_preview = new Preview_Drawable(e.offsetX, e.offsetY);
    canvas.dispatchEvent(cursor_change);
});
canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor_preview = null;
    undo_buffer_size = 0; //reset undo buffer
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    draw_buffer_size++;
    switch (cur_mode){
        case DRAW_MODES.MARKER:
            draw_buffer[draw_buffer_size] = new Marker_Line_Action(cursor.x, cursor.y, cur_thickness, cur_color);
            break;
        case DRAW_MODES.STICKER:
            draw_buffer[draw_buffer_size] = new Sticker_Action(cursor.x, cursor.y, cur_sticker_text);
            break;
    }
});
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        draw_buffer[draw_buffer_size].drag(cursor.x, cursor.y);
        canvas.dispatchEvent(drawing_changed);
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        cursor_preview = null;
    } else {
        cursor_preview = new Preview_Drawable(e.offsetX, e.offsetY);
        canvas.dispatchEvent(cursor_change);
    }
});
page.addEventListener("mouseup", () => {
    cursor.active = false;
    canvas.dispatchEvent(drawing_changed);
});
canvas.addEventListener("drawing-changed", () => {
    render_canvas(ctx, draw_buffer);
});
canvas.addEventListener("cursor-change",  () => {
   render_canvas(ctx, draw_buffer);
});

marker_button.addEventListener("click", () => {
    marker_button.parentElement.querySelector(".selected").classList.remove("selected");
    marker_button.classList.add("selected");
    canvas.dispatchEvent(cursor_change);
    cur_mode = DRAW_MODES.MARKER;
    sticker_detail_div.hidden = true;
    marker_detail_div.hidden = false;
});
sticker_button.addEventListener("click", () => {
    sticker_button.parentElement.querySelector(".selected").classList.remove("selected");
    sticker_button.classList.add("selected");
    canvas.dispatchEvent(cursor_change);
    cur_mode = DRAW_MODES.STICKER;
    marker_detail_div.hidden = true;
    sticker_detail_div.hidden = false;
    let first_button : HTMLButtonElement = sticker_detail_div.firstChild as HTMLButtonElement;
    first_button.click();
});
add_sticker_button.addEventListener("click", () => {
    const text:string = prompt("Custom sticker text:","🧽");
    if (text !== null) {
        stickers.push({name: text});
        const new_button : HTMLButtonElement = make_sticker_button(sticker_detail_div, text);
        sticker_detail_div.removeChild(new_button);//-_-
        add_sticker_button.insertAdjacentElement('beforebegin', new_button);
        new_button.click();
    }

})
undo_button.addEventListener("click", () => {undo()});
redo_button.addEventListener("click", () => {redo()});
clear_button.addEventListener("click", () => {clear_canvas(ctx)});
export_button.addEventListener(("click"), () => {export_canvas(draw_buffer)});
color_picker.addEventListener("input", () => {
    cur_color = color_picker.value;
    canvas.dispatchEvent(cursor_change);
});
size_picker.addEventListener("input", () => {
    cur_thickness = parseInt(size_picker.value);
    size_label.value = size_picker.value;
    canvas.dispatchEvent(cursor_change);
})
size_label.addEventListener("input", () => {
    cur_thickness = parseInt(size_label.value);
    size_picker.value = size_label.value;
    canvas.dispatchEvent(cursor_change);
})