import * as THREE from "three";

// Convert video pixel → screen coords
export const projectPoint = (
  x,
  y,
  videoWidth,
  videoHeight,
  canvasWidth,
  canvasHeight,
  camera,
) => {
  // normalize [0..1]
  const u =
    x / videoWidth + 0.25 > 0
      ? x / videoWidth + 0.25 - 1
      : x / videoWidth + 0.25;
  const v = y / videoHeight;

  // spherical coords
  const lon = (u - 0.5) * 2 * Math.PI;
  const lat = (0.5 - v) * Math.PI;

  // 3D point on inside of sphere
  const radius = 15;
  const pos = new THREE.Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );

  // project into camera space
  pos.project(camera);

  const inView =
    pos.x >= -1 &&
    pos.x <= 1 &&
    pos.y >= -1 &&
    pos.y <= 1 &&
    pos.z >= -1 &&
    pos.z <= 1; // z in clip space

  return {
    x: (pos.x * 0.5 + 0.5) * canvasWidth,
    y: (-pos.y * 0.5 + 0.5) * canvasHeight,
    inView,
  };
};

export const drawBoundingBox = (ctx, label, p1, p2, p3, p4, color) => {
  // draw polygon box
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.stroke();

  // draw text
  ctx.fillStyle = color;
  ctx.font = "12px Arial";
  ctx.fillText(`${label}`, p1.x, p1.y - 5);
};

export const drawBoundingBoxes = (
  boundingBoxes,
  videoWidth,
  videoHeight,
  canvasWidth,
  canvasHeight,
  camera,
  ctx,
) => {
  for (const item of boundingBoxes) {
    let label = item.category_name + " " + item.confidence;
    const color = "rgb(255, 255, 255)";
    const [x1, y1, x2, y2] = item.bbox;

    // videoWidth = 5376, videoHeight = 2688
    // project all four corners
    const p1 = projectPoint(
      x1,
      y1,
      videoWidth,
      videoHeight,
      canvasWidth,
      canvasHeight,
      camera,
    );
    const p2 = projectPoint(
      x2,
      y1,
      videoWidth,
      videoHeight,
      canvasWidth,
      canvasHeight,
      camera,
    );
    const p3 = projectPoint(
      x2,
      y2,
      videoWidth,
      videoHeight,
      canvasWidth,
      canvasHeight,
      camera,
    );
    const p4 = projectPoint(
      x1,
      y2,
      videoWidth,
      videoHeight,
      canvasWidth,
      canvasHeight,
      camera,
    );

    if (p1.inView || p2.inView || p3.inView || p4.inView) {
      drawBoundingBox(ctx, label, p1, p2, p3, p4, color);
    }
  }
};

export const currentFrameAnnotationNo = (currentTime) => {
  return Math.floor(currentTime) ?? 1;
};
