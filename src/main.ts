import "./style.css";

const APP_NAME : string = "Draw Thing Please!";
const app: HTMLDivElement  = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
const title :HTMLHeadingElement =  document.createElement("h1");
title.innerHTML = APP_NAME;
app.append(title);
const CANVAS_WIDTH : number = 256
const CANVAS_HEIGHT : number = 256
const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
app.append(canvas);
const ctx = canvas.getContext("2d");
