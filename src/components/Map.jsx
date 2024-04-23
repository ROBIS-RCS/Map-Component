import { useState, useRef, useEffect } from "react";
import { FaSearchPlus, FaSearchMinus, FaArrowsAlt } from "react-icons/fa";

const MapCanvas = () => {
  const canvasRef = useRef(null);
  const [mapImage, setMapImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (mapImage) drawMap();
  }, [mapImage, lines, points, zoomLevel, panOffset]);

  const drawMap = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(
      mapImage,
      panOffset.x,
      panOffset.y,
      ctx.canvas.width * zoomLevel,
      ctx.canvas.height * zoomLevel
    );
    drawShapes(ctx, points, "red");
    drawShapes(ctx, lines, "blue", 3);
  };

  const drawShapes = (ctx, shapes, color, lineWidth = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    shapes.forEach(([start, end]) => {
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

  const handleClick = (event) => {
    if (!mapImage) return;
    if (panMode) {
      setPanMode(false);
      return;
    }
    const { clientX, clientY } = event;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - canvasRect.left - panOffset.x) / zoomLevel;
    const y = (clientY - canvasRect.top - panOffset.y) / zoomLevel;
    const newPoint = { x, y };
    setPoints([...points, newPoint]);
    if (points.length >= 1) {
      let closestDistance = Infinity;
      let closestPoint = null;
      points.forEach((point) => {
        const distance = Math.sqrt(
          (point.x - newPoint.x) ** 2 + (point.y - newPoint.y) ** 2
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = point;
        }
      });
      if (closestPoint) setLines([...lines, [closestPoint, newPoint]]);
    }
  };

  const handleDeletePoint = (index) => {
    const updatedPoints = points.filter((_, i) => i !== index);
    setPoints(updatedPoints);
    const updatedLines = lines.filter(
      ([start, end]) => start !== points[index] && end !== points[index]
    );
    setLines(updatedLines);
  };

  const handleZoom = (delta) =>
    setZoomLevel((prevZoom) => Math.min(3, Math.max(0.2, prevZoom + delta)));

  const handlePanStart = (event) => {
    if (panMode) {
      setIsPanning(true);
      setPanStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handlePanEnd = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if(panMode){
      setIsPanning(false)
    }
  };

  const handlePanMove = (event) => {
    if (isPanning) {
      const { movementX, movementY } = event;
      setPanOffset((prevOffset) => ({
        x: prevOffset.x + movementX / zoomLevel,
        y: prevOffset.y + movementY / zoomLevel,
      }));
      setPanStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;
      image.onload = () => setMapImage(image);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ position: "relative" }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleClick}
        onMouseDown={handlePanStart}
        onMouseUp={handlePanEnd}
        onMouseMove={handlePanMove}
        style={{
          border: "1px solid black",
          cursor: panMode ? (isPanning ? "grabbing" : "grab") : "default", // Change cursor based on pan mode and panning state
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          zIndex: 999,
        }}
      >
        <button onClick={() => handleZoom(0.2)}>
          <FaSearchPlus />
        </button>
        <button onClick={() => handleZoom(-0.2)}>
          <FaSearchMinus />
        </button>
        <button onClick={() => setPanMode(!panMode)}>
          <FaArrowsAlt />
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
