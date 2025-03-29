// frontend/component/canvaspage.tsx
import React, { useState, useEffect, useRef } from "react";
import initDraw from "../draw/draw";
import {
  Pencil,
  RectangleHorizontal,
  Circle,
  Diamond,
  ArrowRight,
  Eraser,
  Type,
  MousePointer,
  Minus,
  Hand,
} from "lucide-react";

export default function Drawing({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingInstanceRef = useRef<any>(null);
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  const tools = [
    { type: "pan", label: "Pan", icon: <Hand /> }, // Added pan tool
    { type: "pencil", label: "Pencil", icon: <Pencil /> },
    { type: "rect", label: "Rectangle", icon: <RectangleHorizontal /> },
    { type: "circle", label: "Circle", icon: <Circle /> },
    { type: "diamond", label: "Diamond", icon: <Diamond /> },
    { type: "arrow", label: "Arrow", icon: <ArrowRight /> },
    { type: "line", label: "Line", icon: <Minus /> },
    { type: "text", label: "Text", icon: <Type /> },
    { type: "eraser", label: "Eraser", icon: <Eraser /> },
    { type: "select", label: "Select", icon: <MousePointer /> },
  ];

  // Enhanced resize handler with device pixel ratio
  useEffect(() => {
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      setDimensions({
        width: window.innerWidth * dpr,
        height: window.innerHeight * dpr,
      });
      
      if (canvasRef.current) {
        canvasRef.current.style.width = `${window.innerWidth}px`;
        canvasRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize drawing with proper cleanup
  useEffect(() => {
    if (canvasRef.current && dimensions.width > 0 && dimensions.height > 0) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      
      // Set actual canvas dimensions
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Initialize drawing library
      drawingInstanceRef.current = initDraw(canvas, roomId);
    }

    return () => {
      // Cleanup logic if needed
    };
  }, [roomId, dimensions]);

  const handleToolSelect = (toolType: string) => {
    setSelectedTool(toolType);
    if (drawingInstanceRef.current?.selectTool) {
      drawingInstanceRef.current.selectTool(toolType);
    }
  };

  if (!dimensions.width || !dimensions.height) return null;

  return (
    <div className="drawing-container" style={{ position: "relative" }}>
      {/* Toolbar with pan button */}
      <div
        className="drawing-toolbar"
        style={{
          display: "flex",
          gap: "12px",
          padding: "16px",
          background: "#333",
          borderRadius: "12px",
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => handleToolSelect(tool.type)}
            style={{
              padding: "16px",
              border: "none",
              borderRadius: "8px",
              background: selectedTool === tool.type ? "#8b64f5" : "#444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              width: "54px",
              height: "54px",
              transition: "all 0.2s ease",
            }}
            title={tool.label}
          >
            {React.cloneElement(tool.icon, {
              size: 28,
              strokeWidth: 1.5,
              color: "white",
            })}
          </button>
        ))}
      </div>

      <canvas
  ref={canvasRef}
  width={dimensions.width}
  height={dimensions.height}
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    touchAction: "none",
    userSelect: "none",
    cursor: "auto"
  }}
/>
    </div>
  );
}