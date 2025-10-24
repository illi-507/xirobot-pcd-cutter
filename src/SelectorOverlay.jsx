/*import { useState } from "react";

function SelectorOverlay({ setSelectionBox, mode }) {
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  const onMouseDown = (e) => {
    if (mode !== "select") return;
    e.stopPropagation();
    setDragging(true);
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => {
    if (dragging && start && end) {
      setSelectionBox({ start, end });
    }
    setDragging(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: mode === "select" ? "auto" : "none",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {dragging && start && end && (
        <div
          style={{
            position: "absolute",
            left: Math.min(start.x, end.x),
            top: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            border: "1px solid #00ff00",
            background: "rgba(0,255,0,0.1)",
          }}
        />
      )}
    </div>
  );
}

export default SelectorOverlay;*/

import { useState } from "react";

function SelectorOverlay({ setSelectionBoxes, selectionBoxes, mode }) {
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  const onMouseDown = (e) => {
    if (mode !== "select") return;
    e.stopPropagation();
    setDragging(true);
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => {
    if (dragging && start && end) {
      setSelectionBoxes((prev) => [
        ...prev,
        { start, end, id: crypto.randomUUID() }, // ✅ 保存多个框
      ]);
    }
    setDragging(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: mode === "select" ? "auto" : "none",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* ✅ 实时框 */}
      {dragging && start && end && (
        <div
          style={{
            position: "absolute",
            left: Math.min(start.x, end.x),
            top: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            border: "1px solid #00ff00",
            background: "rgba(0,255,0,0.1)",
          }}
        />
      )}

      {/* ✅ 已完成的框 */}
      {selectionBoxes.map((box) => (
        <div
          key={box.id}
          style={{
            position: "absolute",
            left: Math.min(box.start.x, box.end.x),
            top: Math.min(box.start.y, box.end.y),
            width: Math.abs(box.end.x - box.start.x),
            height: Math.abs(box.end.y - box.start.y),
            border: "1px solid #00ff00",
            background: "rgba(0,255,0,0.1)",
          }}
        />
      ))}
    </div>
  );
}

export default SelectorOverlay;
