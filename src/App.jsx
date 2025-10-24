import { Canvas } from "@react-three/fiber";
import { TrackballControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import SelectorOverlay from "./SelectorOverlay";
import PointCloud from "./PointCloud";
import "./App.css";

export default function App() {
  const [selectionBox, setSelectionBox] = useState(null);
  const [selectionBoxes, setSelectionBoxes] = useState([]);
  const [mode, setMode] = useState("orbit");
  const [pcdFile, setPcdFile] = useState(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const controlsRef = useRef();
  const pointCloudRef = useRef();
  const [open, setOpen] = useState(false);

  // ✅ 键盘快捷键：包括 W / S / A / D / M / R
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const rotateSpeed = 0.05; // 控制旋转速度

      switch (key) {
        case "m":
          setMode((prev) => (prev === "orbit" ? "select" : "orbit"));
          break;
        case "r":
          pointCloudRef.current?.resetView();
          break;
        case "w":
          pointCloudRef.current?.rotateCloud("x", -rotateSpeed);
          break;
        case "s":
          pointCloudRef.current?.rotateCloud("x", rotateSpeed);
          break;
        case "a":
          pointCloudRef.current?.rotateCloud("y", -rotateSpeed);
          break;
        case "d":
          pointCloudRef.current?.rotateCloud("y", rotateSpeed);
          break;
        case "q":
          pointCloudRef.current?.rotateCloud("z", rotateSpeed);
          break;
        case "e":
          pointCloudRef.current?.rotateCloud("z", -rotateSpeed);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  // 处理文件上传 + 显示loading动画
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setShowSpinner(true); // 显示loading
    setTimeout(() => {
      setPcdFile(url);
      setShowSpinner(false); // 1秒后隐藏
    }, 1000);
  };

  const btnStyle = (color) => ({
    background: color,
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    color: "white",
    cursor: "pointer",
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === "escape") setSelectionBoxes([]); // ✅ 清空所有框
      if (e.key === "r" && e.ctrlKey) {
        // Ctrl+R 也可以刷新
        e.preventDefault(); // 阻止默认刷新（可选）
        window.location.reload();
      }
      // 其它快捷键逻辑保持不变
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 0] }} style={{ background: "#111" }}>
        <ambientLight intensity={2} />
        {/*<Environment
          files="/hdr/christmas_photo_studio_03_4k.hdr"
          background={true} // true 表示用环境贴图作为背景，false 不改变背景颜色
        /> */}
        {pcdFile && (
          <PointCloud
            ref={pointCloudRef}
            url={pcdFile}
            selectionBox={selectionBox}
            controls={controlsRef}
          />
        )}
        <TrackballControls
          ref={controlsRef}
          enabled={mode === "orbit"}
          rotateSpeed={5.0}
          zoomSpeed={1.2}
          panSpeed={0.8}
          dynamicDampingFactor={0.15}
        />
      </Canvas>

      <SelectorOverlay
        mode={mode}
        setSelectionBoxes={setSelectionBoxes} // ✅ 改名字
        selectionBoxes={selectionBoxes}
        setSelectionBox={setSelectionBox}
      />

      {/* 模式显示 */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.4)",
          padding: "6px 12px",
          borderRadius: 8,
          fontFamily: "monospace",
          color: "#2ed573",
        }}
      >
        Mode: {mode.toUpperCase()} (Press 'M' to toggle)
      </div>

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <input
          type="file"
          accept=".pcd"
          onChange={handleFileUpload}
          style={{
            background: "#222",
            color: "white",
            border: "1px solid #555",
            borderRadius: 6,
            padding: "6px 6px 6px 6px",
            cursor: "pointer",
            width: "200px",
          }}
        />
        <div className="instruction-bar ">
          <div>操作说明</div>
          <div
            className="collapse-icon"
            onClick={() => setOpen((prev) => !prev)}
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <div className="left-rectangle"></div>
          </div>
        </div>

        <div className={`expand-panel ${open ? "open" : ""}`}>
          <div>(先点击选择文件来导入PDC点云文件)</div>
          <div>
            1. 点击 <span className="keys">M</span> 键切换模式,
            <span className="keys">Orbit</span>模式可以用鼠标或者键盘旋转点云,
            <span className="keys">Select</span>模式用来选框
          </div>
          <div>
            2. 点击 <span className="keys">W/S/A/D/Q/E</span> 控制点云旋转
          </div>
          <div>
            3. <span className="keys">鼠标滚轮</span> 来放大缩小点云
          </div>
          <div>
            4. 点击 <span className="keys">R</span> 重置视角
          </div>
          <div>
            5. 点击<span className="keys">ESC</span> 清除选框
          </div>
          <div>
            6. <span className="keys">Select</span>
            模式下可删除选中或非选中区域点
          </div>
          <div>
            7. <span className="keys">Select</span>
            模式下可以导出修改后的PDC文件
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      {mode === "select" && pcdFile && !showSpinner && (
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 10,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            onClick={() => {
              pointCloudRef.current?.deletePointsInside(selectionBoxes);
              setSelectionBoxes([]);
            }}
            style={btnStyle("#2ecc71")}
          >
            删除选中区域的点
          </button>
          <button
            onClick={() => {
              pointCloudRef.current?.deletePointsOutside(selectionBoxes);
              setSelectionBoxes([]);
            }}
            style={btnStyle("#e74c3c")}
          >
            删除选中区域外的点
          </button>
          <button
            onClick={() => pointCloudRef.current?.exportPCD()}
            style={btnStyle("#3498db")}
          >
            导出修改后的 PCD
          </button>
        </div>
      )}

      {/* ✅ 简单的 1 秒加载动画 */}
      {showSpinner && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "white",
            fontFamily: "monospace",
          }}
        >
          <div className="spinner" />
          <div style={{ marginTop: 10, fontSize: "20px" }}>
            Loading point cloud...
          </div>

          <style>{`
            .spinner {
              border: 4px solid rgba(255, 255, 255, 0.2);
              border-top: 4px solid white;
              border-radius: 50%;
              width: 60px;
              height: 60px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
