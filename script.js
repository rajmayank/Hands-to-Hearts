document.addEventListener("DOMContentLoaded", function () {
  const video = document.getElementById("webcam");
  const canvas = document.getElementById("output");
  const ctx = canvas.getContext("2d");
  const loader = document.getElementById("loader");

  let hearts = [];
  let camera;

  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        startHandDetection();
      };
    } catch (err) {
      console.error("Error accessing the webcam:", err);
      hideLoader();
    }
  }

  function startHandDetection() {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
      },
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onResults);

    camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 1280,
      height: 720,
    });
    camera.start().then(() => {
      hideLoader();
    });
  }

  function hideLoader() {
    loader.style.display = "none";
  }

  function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const wrist = landmarks[0];
        const color = index === 0 ? "red" : "blue"; // Different color for each hand
        createHeartBurst(
          wrist.x * canvas.width,
          wrist.y * canvas.height,
          color
        );
      });
    }
    drawHearts();
  }

  const lastBurstTimes = {};
  const burstInterval = 100; // 500ms (0.5 seconds) between bursts

  function createHeartBurst(x, y, color) {
    const currentTime = Date.now();
    if (
      !lastBurstTimes[color] ||
      currentTime - lastBurstTimes[color] >= burstInterval
    ) {
      lastBurstTimes[color] = currentTime;
      for (let i = 0; i < 3; i++) {
        // 3 hearts per burst
        hearts.push({
          x: x,
          y: y,
          size: Math.random() * 60 + 40, // Slightly larger hearts
          speedX: Math.random() * 8 - 4, // Increased horizontal spread
          speedY: -Math.random() * 5 - 2, // Increased vertical spread
          opacity: 1,
          color: color,
        });
      }
    }
  }

  function drawHearts() {
    hearts = hearts.filter((heart) => heart.opacity > 0);
    hearts.forEach((heart) => {
      ctx.save();
      ctx.translate(heart.x, heart.y);
      ctx.scale(heart.size / 30, heart.size / 30);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-5, -5, -10, 0, 0, 10);
      ctx.bezierCurveTo(10, 0, 5, -5, 0, 0);
      ctx.fillStyle = `${heart.color.replace(")", `, ${heart.opacity})`)}`;
      ctx.fill();
      ctx.restore();

      heart.x += heart.speedX;
      heart.y += heart.speedY;
      heart.opacity -= 0.02;
    });
  }

  startWebcam();
});
