import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";

export default class HandposeController {
  constructor(onPredictions) {
    this.onPredictions = onPredictions;
  }

  async init() {
    this.handposeModel = await handpose.load();
    const video = document.createElement("video");
    video.width = 640;
    video.height = 420;
    video.autoplay = true;
    video.playsInline = true;

    const canvas = document.createElement("canvas");
    canvas.width = video.width;
    canvas.height = video.height;

    // Agrega el video y el canvas al DOM
    const container = document.createElement("div");
    container.classList.add("container");
    container.style.position = "fixed";
    container.style.top = "10px";
    container.style.right = "10px";
    container.style.zIndex = "1000";
    canvas.style.position = "absolute";
    container.appendChild(video);
    container.appendChild(canvas);
    document.body.appendChild(container);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: video.width, height: video.height },
    });
    video.srcObject = stream;

    const detectGestures = async () => {
      const predictions = await this.handposeModel.estimateHands(video);

      // Dibuja las predicciones en el canvas
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      predictions.forEach((prediction) => {
        prediction.landmarks.forEach((landmark) => {
          ctx.fillRect(landmark[0], landmark[1], 5, 5);
        });
      });

      // Añade la siguiente línea para establecer la opacidad del canvas
      canvas.style.opacity = "0.7";
      this.onPredictions(predictions);
      requestAnimationFrame(detectGestures);
    };

    video.addEventListener("play", () => {
      if (this.handposeModel) {
        detectGestures();
      }
    });
  }
}
