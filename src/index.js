import "./style.css";
import { createWorker } from 'tesseract.js';
import QRCode from 'qrcode';

const allowBtn = document.querySelector("#allowBtn");
const cameraDiv = document.querySelector("#camera");
const video = document.querySelector("#cameraVideo");
const captureBtn = document.querySelector("#captureBtn");
const photoCanvas = document.querySelector("#photoCanvas");
const photo = document.querySelector("#photo");
const text = document.querySelector("#ocr-text");

const width = 320; // We will scale the photo width to this
let height = 0; // This will be computed based on the input stream

let streaming = false;


(()=> {
  const vh = window.innerHeight;
  const header = document.getElementById('mainHeader');
  const headerHeight = header ? header.offsetHeight : 0;

  document.body.style.height = vh + "px";
  document.querySelector("main").style.height = (vh - headerHeight) + 'px';
})()


allowBtn.addEventListener("click",()=>{
  let stream = null;
  navigator.mediaDevices
    .getUserMedia({ video: {height:200, facingMode: "environment"}, audio: false })
    .then((stream) => {
      cameraDiv.classList.toggle("hidden");
      allowBtn.classList.toggle("hidden");
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      console.error(`An error occurred: ${err}`);
    });
});


video.addEventListener("canplay", (ev) => {
  if (!streaming) {
    height = video.videoHeight / (video.videoWidth / width);

    video.setAttribute("width", width);
    video.setAttribute("height", height);
    photoCanvas.setAttribute("width", width);
    photoCanvas.setAttribute("height", height);
    streaming = true;
  }
});


captureBtn.addEventListener("click", (ev) => {
  takePicture();
  ev.preventDefault();
});


function clearPhoto() {
  const context = photoCanvas.getContext("2d");
  context.fillStyle = "#aaaaaa";
  context.fillRect(0, 0, photoCanvas.width, photoCanvas.height);

  const data = photoCanvas.toDataURL("image/png");
  photo.setAttribute("src", data);
}
clearPhoto();


function takePicture() {
  const context = photoCanvas.getContext("2d");
  if (width && height) {
    photoCanvas.width = width;
    photoCanvas.height = height;

    context.drawImage(video, 0, 0, width, height);
    preprocess(photoCanvas);

    const data = photoCanvas.toDataURL("image/png");
    photo.setAttribute("src", data);

    cameraDiv.classList.toggle("hidden");
    allowBtn.classList.toggle("hidden");
    displayQr();
  } else {
    clearPhoto();
  }
}


// Tesseract and qr creation
async function displayQr() {
  const worker = await createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789'
  });
  //add image to recognize
  const ret = await worker.recognize(photo);
  const canvas = document.querySelector("#qrCanvas");
  text.textContent = ret.data.text;
  QRCode.toCanvas(canvas,ret.data.text,{
    width:250,
  },(error)=>{
    if (error) 
      console.error(error);
  })
  canvas.classList.add("active");
  await worker.terminate();
}


function threshold(ctx, canvas, level = 150) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] < level ? 0 : 255;
    data[i] = data[i+1] = data[i+2] = v;
  }

  ctx.putImageData(imgData, 0, 0);
}


function toGrayscale(ctx, canvas) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    data[i] = data[i+1] = data[i+2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);
}


function increaseContrast(ctx, canvas, factor = 1.4) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const midpoint = 128;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = data[i + c];
      v = midpoint + (v - midpoint) * factor;
      data[i + c] = Math.max(0, Math.min(255, v));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}


function preprocess(canvas) {
  const ctx = canvas.getContext("2d");

  // 1. grayscale
  toGrayscale(ctx, canvas);

  // 2. increase contrast
  increaseContrast(ctx, canvas, 1.5);

  // 3. threshold (optional but often helps)
  threshold(ctx, canvas, 140);

  return canvas;
}








