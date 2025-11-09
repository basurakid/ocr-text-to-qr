import "./style.css";
import { createWorker } from 'tesseract.js';

const cameraBtn = document.querySelector(".cameraBtn")

async function getMedia(constraints) {
  let stream = null;
try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    /* use the stream */
  } catch (err) {
    /* handle the error */
  }
}

(async () => {

  const worker = await createWorker('eng');
  const ret = await worker.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png');
  console.log(ret.data.text);
  await worker.terminate();
})();



