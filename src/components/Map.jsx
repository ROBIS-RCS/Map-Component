import React, { useState, useRef, useEffect } from "react";
import {
  FaSearchPlus,
  FaSearchMinus,
  FaArrowsAlt,
  FaSyncAlt,
} from "react-icons/fa";

const MapCanvas = () => {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [mapImage, setMapImage] = useState(null);
  const [lines, setLines] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);

  useEffect(() => {
    if (mapImage) drawMap();
  }, [mapImage, lines, points, zoomLevel, panOffset]);

  const drawMap = () => {
    const { width, height } = canvasRef.current;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    if (mapImage) {
      ctx.drawImage(mapImage, 0, 0, width, height);
    }
    ctx.drawImage(
      mapImage,
      panOffset.x,
      panOffset.y,
      width * zoomLevel,
      height * zoomLevel
    );
    drawPoints(ctx);
    drawLines(ctx);
  };

  const drawPoints = (ctx) => {
    if (!panMode) {
      ctx.fillStyle = "red";
      points.forEach(({ x, y }) =>
        ctx.arc(
          (x * zoomLevel + panOffset.x).toFixed(1),
          (y * zoomLevel + panOffset.y).toFixed(1),
          5,
          0,
          2 * Math.PI
        )
      );
      ctx.fill();
    }
  };

  const drawLines = (ctx) => {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    lines.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(
        (start.x * zoomLevel + panOffset.x).toFixed(1),
        (start.y * zoomLevel + panOffset.y).toFixed(1)
      );
      ctx.lineTo(
        (end.x * zoomLevel + panOffset.x).toFixed(1),
        (end.y * zoomLevel + panOffset.y).toFixed(1)
      );
      ctx.stroke();
    });
  };

  const calculateDistance = (point1, point2) =>
    Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);

  const handleFileChange = ({ target }) => {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = ({ target: { result } }) => {
      const image = new Image();
      image.src = result;
      image.onload = () => setMapImage(image);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = (event) => {
    if (!mapImage) return;
    if (panMode) return setPanMode(false);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (event.clientY - rect.top - panOffset.y) / zoomLevel;
    const newPoint = { x, y };

    setPoints([...points, newPoint]);
    if (points.length < 1) return;
    let closestDistance = Infinity;
    let closestPoint = null;

    points.forEach((point) => {
      const distance = calculateDistance(point, newPoint);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint !== null) setLines([...lines, [closestPoint, newPoint]]);
  };

  const handleDeletePoint = (index) => {
    const deletedPoint = points[index];
    const updatedPoints = points.filter((_, i) => i !== index);
    setPoints(updatedPoints);
    const updatedLines = lines.filter(
      ([start, end]) => !(start === deletedPoint || end === deletedPoint)
    );
    setLines(updatedLines);
  };

  const handleZoomIn = () => setZoomLevel(Math.min(3, zoomLevel + 0.2));

  const handleZoomOut = () => {
    if (!mapImage) return; // Ensure map image is loaded
    const canvas = canvasRef.current;
    const maxZoomOutLevelX = canvas.width / mapImage.width;
    const maxZoomOutLevelY = canvas.height / mapImage.height;
    const maxZoomOutLevel = Math.min(maxZoomOutLevelX, maxZoomOutLevelY);
    setZoomLevel(Math.max(maxZoomOutLevel, zoomLevel - 0.2)); // Decrease zoom level by 0.2 step-wise
  };

  const handlePan = () => setPanMode(!panMode);

  const handleCanvasMouseMove = (event) => {
    if (event.buttons !== 1) return;
    const canvas = canvasRef.current;
    const { movementX, movementY } = event;
    setPanOffset((prevOffset) => ({
      x: prevOffset.x + movementX / zoomLevel,
      y: prevOffset.y + movementY / zoomLevel,
    }));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div style={{ position: "relative" }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleClick}
        onMouseMove={handleCanvasMouseMove}
        style={{ border: "1px solid black", borderColor: "red" }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          zIndex: 999,
        }}
      >
        <button onClick={handleZoomIn}>
          <FaSearchPlus />
        </button>
        <button onClick={handleZoomOut}>
          <FaSearchMinus />
        </button>
        <button onClick={handlePan}>
          <FaArrowsAlt />
        </button>
        <button onClick={handleResetZoom}>
          <FaSyncAlt />
        </button>
      </div>
      <div>
        <h2>Selected Points</h2>
        <ul>
          {!panMode &&
            points.map((point, index) => (
              <li key={index}>
                X: {point.x.toFixed(1)}, Y: {point.y.toFixed(1)}
                <button onClick={() => handleDeletePoint(index)}>Delete</button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default MapCanvas;
