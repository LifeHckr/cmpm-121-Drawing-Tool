import "./style.css";

//const's-----------------------------------
const APP_NAME : string = "Draw Thing Please!";
const CANVAS_WIDTH : number = 256
const CANVAS_HEIGHT : number = 256
//-------end const's
//HTML SETUP------------------------------------
const app: HTMLDivElement  = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
const title :HTMLHeadingElement =  document.createElement("h1");
title.innerHTML = APP_NAME;
app.append(title);
const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
app.append(canvas);
const button_div : HTMLDivElement = document.createElement("div");
app.append(button_div)
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
button_div.append(clearButton);
const ctx = canvas.getContext("2d");
//END HTML-------------------------------------------
const cursor = { active: false, x: 0, y: 0 };
canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
});
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        ctx.beginPath();
        ctx.moveTo(cursor.x, cursor.y);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
});
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
});
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});