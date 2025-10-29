import { useRef, useState, useEffect } from "react";
import "../../styles/Canvas.css";

export default function CanvasDrawing({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#1da1f2");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("brush");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width = 600;
    canvas.height = 400;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    onSave(dataURL);
  };

  const colors = [
    "#1da1f2",
    "#e74c3c",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#000000",
    "#ffffff",
    "#34495e",
  ];

  return (
    <div className="canvas-drawing-container">
      <div className="canvas-header">
        <h3>🎨 Draw Something!</h3>
        <button className="canvas-close-btn" onClick={onCancel}>
          ✕
        </button>
      </div>
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <div className="canvas-tools">
        <div className="tool-section">
          <label className="tool-label">Tool:</label>
          <div className="tool-buttons">
            <button
              className={`tool-btn ${tool === "brush" ? "active" : ""}`}
              onClick={() => setTool("brush")}
              title="Brush"
            >
              Brush
            </button>
            <button
              className={`tool-btn ${tool === "eraser" ? "active" : ""}`}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              Eraser
            </button>
          </div>
        </div>
        {tool === "brush" && (
          <div className="tool-section">
            <label className="tool-label">Color:</label>
            <div className="color-palette">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`color-btn ${color === c ? "active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}
        <div className="tool-section">
          <label className="tool-label">
            Size: <strong>{brushSize}px</strong>
          </label>
          <input
            type="range"
            className="size-slider"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
          />
        </div>
        <div className="tool-section">
          <div className="action-buttons">
            <button className="clear-btn" onClick={clearCanvas}>
              Clear
            </button>
            <button className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              ✓ Save Drawing
            </button>
          </div>
        </div>
      </div>
      <div className="canvas-tips">
        <p>
          💡 <strong>Tips:</strong> Use your mouse to draw. Choose colors and
          brush sizes to create your artwork!
        </p>
      </div>
    </div>
  );
}
