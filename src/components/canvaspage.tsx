import React, { useState, useEffect, useRef, useCallback } from "react";
import initDraw from "../../draw/draw";
import axios from "axios"
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
  Sparkles,
  X
} from "lucide-react";

// Define types for drawing instance methods
interface DrawingInstance {
  selectTool: (tool: string) => void;
  setStrokeColor: (color: string) => void;
  setBgColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  deleteSelected: () => void;
  clearAll: () => void;
}

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

export default function Drawing({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingInstanceRef = useRef<DrawingInstance | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [strokeColor, setStrokeColor] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dictOfVars, setDictOfVars] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GeneratedResult>();
  const [latexExpression, setLatexExpression] = useState<Array<{id: string, content: string}>>([]); 
  const [showChat, setShowChat] = useState(false);
  const latexContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse toolbar on very small screens
      setToolbarCollapsed(window.innerWidth < 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // MathJax initialization
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      //@ts-ignore
        window.MathJax.Hub.Config({
            tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            showMathMenu: false,
            messageStyle: "none"
        });
    };

    return () => {
        if (document.head.contains(script)) {
            document.head.removeChild(script);
        }
    };
  }, []);

  // Process LaTeX whenever it changes
  useEffect(() => {
    //@ts-ignore
    if (latexExpression.length > 0 && window.MathJax) {
        // Give a small delay to ensure DOM is updated
        setTimeout(() => {
          //@ts-ignore
            window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, latexContainerRef.current]);
        }, 100);
    }
  }, [latexExpression]);

  // Scroll to bottom when new chat messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [latexExpression]);

  // Process result when it changes
  useEffect(() => {
    if (result) {
        renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result]);
  
  // Enhanced resize handler
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

  // Initialize drawing instance
  useEffect(() => {
    if (canvasRef.current && dimensions.width > 0 && dimensions.height > 0) {
      const canvas = canvasRef.current;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Initialize drawing library with type assertion
      drawingInstanceRef.current = initDraw(canvas, roomId) as unknown as DrawingInstance;
    }
  }, [roomId, dimensions]);

  const renderLatexToCanvas = (expression: string, answer: string) => {
    const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
    const newLatex = {
      id: `latex-${Date.now()}`, 
      content: latex
    };
    setLatexExpression(prev => [...prev, newLatex]);
  };

  const removeLatexExpression = (id: string) => {
    setLatexExpression(prev => prev.filter(item => item.id !== id));
  };

  const runRoute = async () => {
    setIsLoading(true);
    const canvas = canvasRef.current;

    try {
      if (canvas) {
        try {
          const response = await axios({
            method: 'post',
            url: 'https://slate-ai-backend-l0eb.onrender.com/calculate',
            data: {
              image: canvas.toDataURL('image/png'),
              dict_of_vars: dictOfVars
            }
          });

          const resp = response.data;
          console.log('Response', resp);
          
          if (resp.data && Array.isArray(resp.data)) {
            // Handle variable assignments
            resp.data.forEach((data: Response) => {
              if (data.assign === true) {
                setDictOfVars(prevDict => ({
                  ...prevDict,
                  [data.expr]: data.result
                }));
              }
            });
            
            // Process each response item
            resp.data.forEach((data: Response, index: number) => {
              setTimeout(() => {
                setResult({
                  expression: data.expr,
                  answer: data.result
                });
              }, 500 * (index + 1)); // Stagger responses
            });
          }
        } catch (error) {
          console.error('Error running calculation:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Style toolbar handlers
  const handleDeleteSelected = useCallback(() => {
    drawingInstanceRef.current?.deleteSelected?.();
  }, []);

  const handleClearAll = useCallback(() => {
    drawingInstanceRef.current?.clearAll?.();
    // Also clear LaTeX expressions when clearing all
    setLatexExpression([]);
  }, []);

  const handleStrokeColorChange = useCallback((color: string) => {
    setStrokeColor(color);
    drawingInstanceRef.current?.setStrokeColor?.(color);
  }, []);

  const handleBgColorChange = useCallback((color: string) => {
    setBgColor(color);
    drawingInstanceRef.current?.setBgColor?.(color);
  }, []);

  const handleStrokeWidthChange = useCallback((width: number) => {
    setStrokeWidth(width);
    drawingInstanceRef.current?.setStrokeWidth?.(width);
  }, []);

  const handleToolSelect = useCallback((toolType: string) => {
    setSelectedTool(toolType);
    drawingInstanceRef.current?.selectTool?.(toolType);
  }, []);

  const toggleToolbar = () => {
    setToolbarCollapsed(!toolbarCollapsed);
  };

  if (!dimensions.width || !dimensions.height) return null;

  return (
    <div className="relative">
      {/* Run Button - Fixed Position at Bottom Right */}
      <button
        onClick={runRoute}
        disabled={isLoading}
        className={`fixed z-50 px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 font-semibold rounded-xl shadow-2xl transition-all flex items-center gap-2 sm:gap-3
          ${isLoading 
            ? 'bg-purple-700/90 cursor-not-allowed ring-4 ring-purple-400/30' 
            : 'bg-purple-600 hover:bg-purple-700 cursor-pointer transform hover:scale-105 hover:shadow-xl'}
          ${isLoading && 'animate-pulse'}
          ${isMobile ? 'bottom-4 left-4 text-sm' : 'bottom-8 right-8 text-base'}
        `}
        style={{
          backdropFilter: 'blur(4px)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {isLoading ? (
          <>
            <svg 
              className={`animate-spin ${isMobile ? 'h-5 w-5' : 'h-7 w-7'} text-white`}
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-white/90">{isMobile ? 'Processing' : 'Processing...'}</span>
          </>
        ) : (
          <>
            <Sparkles className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-white transform transition-all hover:scale-110 hover:rotate-12`} />
            <span className="text-white font-bold tracking-wide">
              {isMobile ? 'Magic' : 'Magic Button'}
            </span>
          </>
        )}
      </button>
      
      {/* Main Tools Toolbar - With Toggle for Mobile */}
      <div className={`fixed z-10 transition-all duration-300 shadow-md
        ${isMobile 
          ? toolbarCollapsed 
            ? 'top-6 right-6' 
            : 'top-6 left-1/2 -translate-x-1/2' 
          : 'top-6 left-1/2 -translate-x-1/2'}`}
      >
        {isMobile && toolbarCollapsed ? (
          <button 
            onClick={toggleToolbar}
            className="bg-purple-600 p-3 rounded-full shadow-lg"
          >
            <Pencil size={24} color="white" />
          </button>
        ) : (
          <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-neutral-800 rounded-xl relative">
            {isMobile && (
              <button 
                onClick={toggleToolbar}
                className="absolute -top-3 -right-3 bg-purple-600 p-1.5 rounded-full shadow-md"
              >
                <X size={16} color="white" />
              </button>
            )}
            
            <div className={`flex flex-wrap gap-2 justify-center ${isMobile ? 'max-w-[300px]' : ''}`}>
              {tools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => handleToolSelect(tool.type)}
                  className={`
                    ${isMobile ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-14 sm:h-14'} 
                    flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                    ${selectedTool === tool.type 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-neutral-700 hover:bg-neutral-600'}
                  `}
                  title={tool.label}
                >
                  {React.cloneElement(tool.icon, {
                    size: isMobile ? 20 : 24,
                    strokeWidth: 1.5,
                    color: "white",
                  })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Style Toolbar - Responsive Positioning */}
      <div className={`fixed z-40 bg-neutral-900 rounded-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 shadow-lg transition-all duration-300
        ${isMobile 
          ? 'w-44 sm:w-48 top-auto bottom-4 right-4' 
          : 'w-48 sm:w-52 top-5 right-5'}`}
      >
        {/* Stroke Color Section */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h3 className="text-white text-sm sm:text-base font-medium mb-1 sm:mb-2">Stroke</h3>
          <div className="flex gap-2 flex-wrap">
            {strokeColors.map((color) => (
              <div
                key={color}
                onClick={() => handleStrokeColorChange(color)}
                className={`
                  ${isMobile ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'}
                  rounded-lg cursor-pointer transition-all duration-200
                  ${strokeColor === color 
                    ? 'border-2 border-blue-500 ring-2 ring-blue-500/30' 
                    : 'border-2 border-transparent'}
                `}
                style={{ 
                  backgroundColor: color === 'transparent' ? '#ffffff' : color,
                  position: 'relative' 
                }}
              >
                {color === "transparent" && <TransparentPattern />}
              </div>
            ))}
          </div>
        </div>

        {/* Background Color Section */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h3 className="text-white text-sm sm:text-base font-medium mb-1 sm:mb-2">Background</h3>
          <div className="flex gap-2 flex-wrap">
            {bgColors.map((color) => (
              <div
                key={color}
                onClick={() => handleBgColorChange(color)}
                className={`
                  ${isMobile ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'}
                  rounded-lg cursor-pointer transition-all duration-200
                  ${bgColor === color 
                    ? 'border-2 border-blue-500 ring-2 ring-blue-500/30' 
                    : 'border-2 border-transparent'}
                `}
                style={{ 
                  backgroundColor: color === 'transparent' ? '#ffffff' : color,
                  position: 'relative' 
                }}
              >
                {color === "transparent" && <TransparentPattern />}
              </div>
            ))}
          </div>
        </div>

        {/* Stroke Width Section */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h3 className="text-white text-sm sm:text-base font-medium mb-1 sm:mb-2">Stroke Width</h3>
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
              className="flex-grow h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full appearance-none"
            />
            <span className="min-w-[24px] sm:min-w-[30px] text-center bg-neutral-800 text-white text-xs sm:text-sm py-1 px-1.5 sm:px-2 rounded-md">
              {strokeWidth}
            </span>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h3 className="text-white text-sm sm:text-base font-medium mb-1 sm:mb-2">Actions</h3>
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleDeleteSelected} 
              className="bg-purple-600 text-white text-sm py-2 sm:py-2.5 rounded-md hover:bg-purple-700 transition-colors"
            >
              Delete Selected
            </button>
            <button 
              onClick={handleClearAll} 
              className="bg-purple-600 text-white text-sm py-2 sm:py-2.5 rounded-md hover:bg-purple-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="fixed top-0 left-0 touch-none select-none cursor-auto"
      />
      
      {/* Chat UI for LaTeX Display - Responsive Sizing */}
      <div 
        className={`fixed z-50 transition-all duration-300 ease-in-out ${showChat ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          width: isMobile ? 'calc(100vw - 20px)' : '400px',
          maxWidth: 'calc(100vw - 20px)',
          height: isMobile ? 'calc(100vh - 180px)' : '600px',
          maxHeight: 'calc(100vh - 120px)',
          left: isMobile ? '10px' : '20px',
          bottom: isMobile ? '70px' : '80px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Chat Header */}
        <div className="bg-purple-600 border-b text-white p-2 sm:p-4 flex justify-between items-center">
          <div className="font-bold text-sm sm:text-base">Salte AI</div>
          <button 
            onClick={() => setShowChat(false)} 
            className="text-white hover:bg-red-600 rounded-full p-1 transition-colors"
          >
            <X size={isMobile ? 16 : 20} />
          </button>
        </div>
        
        {/* Chat Messages Area */}
        <div 
          ref={latexContainerRef}
          className="flex-grow bg-neutral-900 p-2 sm:p-4 overflow-y-auto"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px sm:gap-16px'
          }}
        >
          {latexExpression.length === 0 ? (
            <div className="text-center text-gray-400 my-auto text-xs sm:text-sm">
              Draw an equation and click the Run button to see results here
            </div>
          ) : (
            <>
              {latexExpression.map((item) => (
                <div key={item.id} className="flex flex-col max-w-full">
                  {/* User "message" */}
                  <div className="self-start bg-gray-100 rounded-lg p-2 sm:p-3 mb-2 max-w-3/4">
                    <div className="text-gray-600 text-xs sm:text-sm">Equation processed</div>
                  </div>
                  
                  {/* AI response with LaTeX */}
                  <div className="self-end bg-white rounded-xl p-3 sm:p-4 text-black relative max-w-[90%] group transition-all duration-200 ease-in-out border border-white/5">
                    {/* Delete button positioned in top-right corner */}
                    <button
                      onClick={() => removeLatexExpression(item.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-600 rounded-full shadow-md transition-colors duration-150 ease-out z-10"
                      aria-label="Delete"
                      style={{
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)'
                      }}
                    >
                      <X size={12} className="stroke-[2.5] hover:scale-105 transition-transform" />
                    </button>
                    
                    <div className="relative z-10">
                      {/* Improved scrolling container with proper max height and overflow handling */}
                      <div
                        className="latex-content font-serif text-xs sm:text-sm tracking-tight leading-tight break-words max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                    
                    {/* Bottom alignment spacer */}
                    <div className="h-2 sm:h-3" />
                    
                    {/* Visual enhancements */}
                    <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-20 rounded-xl pointer-events-none" />
                  </div>       
                </div>
              ))}
              <div ref={chatEndRef} />
            </>
          )}
        </div>
        
        {/* Footer - Just for UI completeness */}
        <div className="bg-purple-600 border-t border-gray-200 p-2 sm:p-3 text-center text-xs text-gray-500">
          Powered by Slate AI
        </div>
      </div>
      
      {/* Chat toggle button if chat is hidden - Responsive positioning */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className={`fixed z-50 ${isMobile ? 'w-12 h-12 top-4 left-4' : 'w-14 h-14 top-5 left-5'} bg-purple-700 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Add CSS for better styling and animations */}
      <style jsx global>{`
        /* Enhanced MathJax styling */
        .MathJax_Display {
          margin: 0 !important;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .latex-content {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Responsive styling */
        @media (max-width: 768px) {
          .MathJax {
            font-size: 90% !important;
          }
        }
        
        @media (max-width: 480px) {
          .MathJax {
            font-size: 80% !important;
          }
        }
        
        /* Improved input styling for touch devices */
        @media (max-width: 768px) {
          input[type=range] {
            height: 24px;
            -webkit-appearance: none;
            margin: 10px 0;
            background: transparent;
          }
          input[type=range]::-webkit-slider-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #4f46e5;
            -webkit-appearance: none;
            margin-top: -6px;
          }
          input[type=range]::-webkit-slider-runnable-track {
            height: 4px;
            border-radius: 2px;
          }
          input[type=range]:focus {
            outline: none;
          }
        }
        
        /* Safe area insets for notched phones */
        @supports (padding: max(0px)) {
          .chat-container {
            padding-bottom: max(10px, env(safe-area-inset-bottom));
            padding-left: max(10px, env(safe-area-inset-left));
          }
        }
      `}</style>
    </div>
  );
}

// Helper components
const TransparentPattern = () => (
  <svg className="absolute top-0 left-0 w-full h-full">
    <pattern id="crosshatch" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M0,0 L8,8" stroke="#999" strokeWidth="1" />
      <path d="M8,0 L0,8" stroke="#999" strokeWidth="1" />
    </pattern>
    <rect width="100%" height="100%" fill="url(#crosshatch)" />
  </svg>
);

const tools = [
  { type: "pan", label: "Pan", icon: <Hand /> },
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

const strokeColors = ["#e0e0e0", "#ff8080", "#4caf50", "#4d88ff", "#b36b00", "#ff7f7f"];
const bgColors = ["transparent", "#ffb3b3", "#b3ffb3", "#b3d9ff", "#ffe6b3", "#e6b3ff", "#b3fff0"];