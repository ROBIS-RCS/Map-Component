import { useState, useRef, useEffect } from "react";
import { FaSearchPlus, FaSearchMinus, FaArrowsAlt } from "react-icons/fa";

const MapCanvas = () => {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [mapImage, setMapImage] = useState(null);
  const [lines, setLines] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);

  useEffect(() => {
    if (mapImage) {
      drawMap();
    }
  }, [mapImage, lines, points, zoomLevel, panOffset]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(
      mapImage,
      panOffset.x,
      panOffset.y,
      canvas.width * zoomLevel,
      canvas.height * zoomLevel
    );
    drawPoints(ctx);
    drawLines(ctx);
  };

  const drawPoints = (ctx) => {
    if (!panMode) {
      ctx.fillStyle = "red";
      points.forEach((point) => {
        const roundedX = (point.x * zoomLevel + panOffset.x).toFixed(1);
        const roundedY = (point.y * zoomLevel + panOffset.y).toFixed(1);
        ctx.beginPath();
        ctx.arc(roundedX, roundedY, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
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

  const calculateDistance = (point1, point2) => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;
      image.onload = () => {
        setMapImage(image);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleClick = (event) => {
    if (!mapImage) return;

    if (panMode) {
      // Toggle pan mode off
      setPanMode(false);
      return;
    }
    //Check if pan mode is not active before adding new points
    if (!panMode) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - panOffset.x) / zoomLevel;
      const y = (event.clientY - rect.top - panOffset.y) / zoomLevel;

      const newPoint = { x, y };
      setPoints([...points, newPoint]);

      if (points.length >= 1) {
        let closestDistance = Infinity;
        let closestPoint = null;
        points.forEach((point) => {
          const distance = calculateDistance(point, newPoint);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = point;
          }
        });

        if (closestPoint !== null) {
          const start = closestPoint;
          const end = newPoint;
          setLines([...lines, [start, end]]);
        }
      }
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (event.clientY - rect.top - panOffset.y) / zoomLevel;

    const newPoint = { x, y };
    setPoints([...points, newPoint]);

    // Connect to the closest point
    if (points.length >= 1) {
      let closestDistance = Infinity;
      let closestPoint = null;
      points.forEach((point) => {
        const distance = calculateDistance(point, newPoint);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = point;
        }
      });

      if (closestPoint !== null) {
        const start = closestPoint;
        const end = newPoint;
        setLines([...lines, [start, end]]);
      }
    }
  };

  const handleDeletePoint = (index) => {
    const deletedPoint = points[index];
    const updatedPoints = points.filter((_, i) => i !== index);
    setPoints(updatedPoints);

    // Remove lines connected to the deleted point
    const updatedLines = lines.filter(([start, end]) => {
      return !(start === deletedPoint || end === deletedPoint);
    });
    setLines(updatedLines);
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(3, zoomLevel + 0.2)); // Limit max zoom level to 3
  };

  const handleZoomOut = () => {
    // Calculate the maximum allowed zoom out level based on canvas dimensions and original image size
    const canvas = canvasRef.current;
    const maxZoomOutLevelX = canvas.width / mapImage.width;
    const maxZoomOutLevelY = canvas.height / mapImage.height;
    const maxZoomOutLevel = Math.min(maxZoomOutLevelX, maxZoomOutLevelY);

    // Decrease the zoom level step-wise until it fits the canvas dimensions
    const newZoomLevel = Math.max(maxZoomOutLevel, zoomLevel - 0.2); // Decrease zoom level by 0.2 step-wise
    setZoomLevel(newZoomLevel);
  };

  const handlePan = () => {
    setPanMode(!panMode);
  };

  const handleCanvasMouseMove = (event) => {
    if (event.buttons === 1) {
      // Check if mouse is clicked (button === 1)
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.movementX / zoomLevel; // Calculate movementX relative to zoom level
      const y = event.movementY / zoomLevel; // Calculate movementY relative to zoom level
      setPanOffset((prevOffset) => ({
        x: prevOffset.x + x,
        y: prevOffset.y + y,
      }));
    }
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
        style={{ border: "1px solid black" }}
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
