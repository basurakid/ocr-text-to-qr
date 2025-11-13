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

allowBtn.addEventListener("click",()=>{
  let stream = null;
  navigator.mediaDevices
    .getUserMedia({ video: {facingMode: "environment"}, audio: false })
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
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
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

  const data = canvas.toDataURL("image/png");
  photo.setAttribute("src", data);
}
clearPhoto();

function takePicture() {
  const context = photoCanvas.getContext("2d");
  if (width && height) {
    photoCanvas.width = width;
    photoCanvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const data = photoCanvas.toDataURL("image/png");
    photo.setAttribute("src", data);
    cameraDiv.classList.toggle("hidden");
    allowBtn.classList.toggle("hidden");
  } else {
    clearPhoto();
  }
}

// Tesseract and qr creation
async function displayQr() {
  const worker = await createWorker('eng');
  //add image to recognize
  const ret = await worker.recognize();
  const canvas = document.querySelector("#qrCanvas");
  text.textContent = ret.data.text;
  QRCode.toCanvas(canvas,ret.data.text,{
    width:500,
  },(error)=>{
    if (error) 
      console.error(error);
  })
  canvas.classList.add("active");
  await worker.terminate();
};







