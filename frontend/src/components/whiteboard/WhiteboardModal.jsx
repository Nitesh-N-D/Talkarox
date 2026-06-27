import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eraser, Pencil, Trash2, Download, X } from 'lucide-react';
import Button from '../common/Button';

const COLORS = ['#1F2937', '#2563EB', '#10B981', '#F59E0B', '#EF4444'];

export default function WhiteboardModal({ onClose, onSave }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [tool, setTool] = useState('pencil'); // pencil | eraser
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const startDraw = (e) => {
    isDrawing.current = true;
    lastPoint.current = getPoint(e);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const point = getPoint(e);
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
  };

  const stopDraw = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave?.(dataUrl);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-card shadow-lifted w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-display font-bold text-ink text-sm">Quick whiteboard</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-paper-flat overflow-x-auto">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pencil'); }}
              className="w-7 h-7 rounded-full border-2 flex-shrink-0"
              style={{ backgroundColor: c, borderColor: color === c && tool === 'pencil' ? '#1F2937' : 'transparent' }}
              aria-label={`Color ${c}`}
            />
          ))}
          <div className="w-px h-6 bg-gray-300 flex-shrink-0" />
          <button onClick={() => setTool('pencil')} className={`p-1.5 rounded-card flex-shrink-0 ${tool === 'pencil' ? 'bg-brand-100 text-brand-700' : 'text-ink-faint'}`}>
            <Pencil size={16} />
          </button>
          <button onClick={() => setTool('eraser')} className={`p-1.5 rounded-card flex-shrink-0 ${tool === 'eraser' ? 'bg-brand-100 text-brand-700' : 'text-ink-faint'}`}>
            <Eraser size={16} />
          </button>
          <button onClick={clearCanvas} className="p-1.5 rounded-card text-ink-faint hover:text-danger flex-shrink-0 ml-auto">
            <Trash2 size={16} />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="w-full touch-none cursor-crosshair"
          style={{ aspectRatio: '640/400' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} icon={Download}>Add to chat</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
