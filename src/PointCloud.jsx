import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  TrackballControls,
} from "@react-three/drei";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";
import * as THREE from "three";
import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

const PointCloud = forwardRef(function PointCloud(
  { url, selectionBox, controls },
  ref
) {
  const pointsRef = useRef();
  const points = useLoader(PCDLoader, url);
  const { camera, size } = useThree();
  const geometry = points.geometry;
  geometry.center();

  const [colors] = useState(
    new Float32Array(geometry.getAttribute("position").count * 3)
  );

  const initialState = useRef({
    cameraPosition: null,
    pointRotation: null,
    pointPosition: null,
  });

  useEffect(() => {
    pointsRef.current.updateMatrixWorld(true);
  }, [selectionBox]);

  useEffect(() => {
    geometry.computeBoundingSphere();
    const zoomFactor = 0.8; // 越小越近
    const { radius } = geometry.boundingSphere;
    camera.position.set(0, 0, radius * zoomFactor);
    camera.near = radius / 100;
    camera.far = radius * 100;
    camera.updateProjectionMatrix();

    colors.fill(1.0);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    initialState.current = {
      cameraPosition: camera.position.clone(),
      /* pointRotation: points.rotation.clone(),
      pointPosition: points.position.clone(), */
      pointRotation: new THREE.Euler(0, 0, 0), // ✅ 初始化旋转
      pointPosition: new THREE.Vector3(0, 0, 0),
      controlTarget: controls?.target?.clone() || new THREE.Vector3(0, 0, 0),
    };
  }, []);

  const getSelectedIndices = (box) => {
    if (!box) return [];
    const { start, end } = box;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const positions = geometry.getAttribute("position");
    const indices = [];

    for (let i = 0; i < positions.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(positions, i);
      v.applyMatrix4(pointsRef.current.matrixWorld);
      v.project(camera);
      const screenX = (v.x * 0.5 + 0.5) * size.width;
      const screenY = (-v.y * 0.5 + 0.5) * size.height;
      const inBox =
        screenX >= minX &&
        screenX <= maxX &&
        screenY >= minY &&
        screenY <= maxY;
      if (inBox) indices.push(i);
    }
    return indices;
  };

  // 框选高亮
  useEffect(() => {
    if (!selectionBox) return;
    const positions = geometry.getAttribute("position");
    const colorArray = geometry.getAttribute("color").array;
    const selected = new Set(getSelectedIndices());
    const highlightColor = new THREE.Color("#2ecc71");
    const normalColor = new THREE.Color(0xffffff);

    for (let i = 0; i < positions.count; i++) {
      const color = selected.has(i) ? highlightColor : normalColor;
      colorArray[i * 3 + 0] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }
    geometry.attributes.color.needsUpdate = true;
  }, [selectionBox]);

  // 暴露删除函数给外层 App
  useImperativeHandle(ref, () => ({
    /*deletePointsInside() {
      const selected = new Set(getSelectedIndices());
      filterPoints((_, i) => !selected.has(i));
    },
    deletePointsOutside() {
      const selected = new Set(getSelectedIndices());
      filterPoints((_, i) => selected.has(i));
    }, */

    deletePointsInside(boxes = []) {
      const selected = new Set();
      boxes.forEach((box) => {
        getSelectedIndices(box).forEach((i) => selected.add(i));
      });
      filterPoints((_, i) => !selected.has(i));
    },
    deletePointsOutside(boxes = []) {
      const selected = new Set();
      boxes.forEach((box) => {
        getSelectedIndices(box).forEach((i) => selected.add(i));
      });
      filterPoints((_, i) => selected.has(i));
    },

    resetView() {
      const init = initialState.current;
      if (!init) return;

      // 恢复相机
      camera.position.copy(init.cameraPosition);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      // 恢复点云
      //points.rotation.copy(init.pointRotation);
      pointsRef.current.rotation.copy(init.pointRotation); // ✅ 使用 pointsRef
      points.position.copy(init.pointPosition);

      // ✅ 恢复控制器 target
      // ✅ 恢复控制器 target
      if (controls?.current) {
        controls.current.target.copy(init.controlTarget);
        controls.current.update();
      }
    },
    async exportPCD() {
      const filename = "pointcloud.pcd"; // 默认文件名
      const positions = geometry.getAttribute("position").array;
      const colors = geometry.getAttribute("color").array;
      const count = geometry.getAttribute("position").count;

      // 构造 PCD header
      let header = `
# .PCD v0.7 - Point Cloud Data file format
VERSION 0.7
FIELDS x y z rgb
SIZE 4 4 4 4
TYPE F F F F
COUNT 1 1 1 1
WIDTH ${count}
HEIGHT 1
VIEWPOINT 0 0 0 1 0 0 0
POINTS ${count}
DATA ascii
`.trim();

      // 构造每一行的点数据
      let body = "";
      for (let i = 0; i < count; i++) {
        const x = positions[i * 3 + 0];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        const r = Math.round(colors[i * 3 + 0] * 255);
        const g = Math.round(colors[i * 3 + 1] * 255);
        const b = Math.round(colors[i * 3 + 2] * 255);

        // PCD rgb 通常是一个 float 表示的 packed 值，但我们可以用整数简化
        const rgbInt = (r << 16) | (g << 8) | b;
        body += `\n${x} ${y} ${z} ${rgbInt}`;
      }

      const content = header + body;

      const blob = new Blob([header + body], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "modified.pcd";
      a.click();

      URL.revokeObjectURL(url);
    },

    rotateCloud: (axis, angle) => {
      if (pointsRef.current) {
        pointsRef.current.rotation[axis] += angle; // ✅ 旋转
      }
    },
  }));

  // 实际删除点的函数
  const filterPoints = (predicate) => {
    const oldPos = geometry.getAttribute("position").array;
    const oldColor = geometry.getAttribute("color").array;
    const oldCount = geometry.getAttribute("position").count;

    const newPositions = [];
    const newColors = [];

    for (let i = 0; i < oldCount; i++) {
      const x = oldPos[i * 3 + 0];
      const y = oldPos[i * 3 + 1];
      const z = oldPos[i * 3 + 2];
      if (predicate([x, y, z], i)) {
        newPositions.push(x, y, z);
        newColors.push(
          oldColor[i * 3 + 0],
          oldColor[i * 3 + 1],
          oldColor[i * 3 + 2]
        );
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(newPositions, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(newColors, 3)
    );
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  };

  const material = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    sizeAttenuation: true,
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
});

export default PointCloud;
