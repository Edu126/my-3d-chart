/**
 * The NNChart function creates a 3D visualization of nodes and edges, with the option to enable hand
 * gesture controls for camera movement.
 * @returns The component `NNChart` is being returned, which renders a 3D graph using Three.js library
 * and allows the user to interact with it using hand gestures detected by the HandposeController. It
 * also includes buttons to enable/disable hand gestures and invert the rotation direction.
 */
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import HandposeController from "./HandposeController";

const NNChart = ({ nodes, edges, labelScale }) => {
  const mountRef = useRef(null);
  const [handposeEnabled, setHandposeEnabled] = useState(false);
  const [inverseRotation, setInverseRotation] = useState(false); // Valiudar el uso de la variable de reversion, no se esta usando.
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);

  const showMessage = (message) => {
    const overlayCanvas = document.getElementById("overlay");
    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(
      message,
      overlayCanvas.width / 2 - ctx.measureText(message).width / 2,
      overlayCanvas.height / 2
    );
  };

  const startCalibration = () => {
    setCalibrating(true);
    setCalibrationStep(0);
  };

  useEffect(() => {
    let camera, scene, renderer, controls;

    let targetCameraRotation = null;
    let targetCameraZoom = null;

    // Variables para almacenar las posiciones iniciales
    let initialHandPosition = null;
    let initialZoomValue = null;

    const processHandpose = (predictions) => {
      if (predictions.length > 0) {
        const prediction = predictions[0];

        if (calibrating) {
          // eslint-disable-next-line default-case
          switch (calibrationStep) {
            case 0:
              showMessage("Coloque su mano en el centro de la cámara.");
              break;
            // ...
          }

          // adjust the camera position to the hand position
          const isHandClosed = prediction.annotations.thumb.every(
            (point, index) => {
              return (
                point[0] < prediction.annotations.indexFinger[index][0] &&
                point[1] > prediction.annotations.indexFinger[index][1]
              );
            }
          );

          if (isHandClosed) {
            initialHandPosition = prediction.annotations.indexFinger[3];
            initialZoomValue = camera.position.z;
            setCalibrating(false);
          }
        } else {
          const currentPosition = prediction.annotations.indexFinger[3];
          const x = currentPosition[0] - initialHandPosition[0];
          const y = currentPosition[1] - initialHandPosition[1];

          targetCameraRotation = Math.atan2(y, x) * (inverseRotation ? -1 : 1);

          // Calcular el zoom basado en la distancia entre cada punto de la mano y el borde del ángulo de visión de la cámara
          const distanceToEdge = Math.sqrt(
            Math.pow(window.innerWidth / 2 - currentPosition[0], 2) +
              Math.pow(window.innerHeight / 2 - currentPosition[1], 2)
          );
          const maxDistance = Math.sqrt(
            Math.pow(window.innerWidth / 2, 2) +
              Math.pow(window.innerHeight / 2, 2)
          );
          const zoomFactor = distanceToEdge / maxDistance;

          targetCameraZoom = THREE.MathUtils.mapLinear(
            zoomFactor,
            0,
            1,
            controls.minDistance,
            controls.maxDistance
          );
        }
      } else {
        // Si no se detectan predicciones, reinicia las posiciones iniciales
        initialHandPosition = null;
        initialZoomValue = null;
        setCalibrating(true);
      }
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * 0.5, window.innerHeight * 0.4); // 80% of the screen y 100% de ancho
    };

    const init = () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        1000
      );
      camera.position.set(0, 0, 50);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(1, 1, 1);
      scene.add(light);

      // Agrega un objeto para asignar colores a las relaciones
      const relationColors = {
        Noun: 0x1a75ff,
        Organization: 0xff3333,
        Acronym: 0x33ff33,
        Event: 0xffff33,
        Industry: 0xff8000,
        Profession: 0x8000ff,
        Year: 0x00b3b3,
      };

      const sphereGeometry = new THREE.SphereGeometry(0.75, 32, 32);
      // const material = new THREE.MeshStandardMaterial({
      //   color: 0x0077be,
      //   roughness: 0.5,
      //   metalness: 0.5,
      // });
      const nodeObjects = {};

      nodes.forEach((node) => {
        // Crea un material específico para cada nodo basado en su relación
        const nodeMaterial = new THREE.MeshStandardMaterial({
          color: relationColors[node.relation],
          roughness: 0.5,
          metalness: 0.5,
        });

        const nodeMesh = new THREE.Mesh(sphereGeometry, nodeMaterial);
        nodeMesh.position.set(...node.position);
        scene.add(nodeMesh);
        nodeObjects[node.id] = nodeMesh;

        const labelCanvas = document.createElement("canvas");
        const labelContext = labelCanvas.getContext("2d");
        const fontSize = 16;
        labelContext.font = `${fontSize}px Arial`;
        const labelWidth = labelContext.measureText(node.label).width;
        const labelHeight = fontSize;
        labelCanvas.width = labelWidth;
        labelCanvas.height = labelHeight;
        labelContext.font = `${fontSize}px Arial`;
        labelContext.fillStyle = "#ffffff";
        labelContext.fillText(node.label, 0, fontSize - 4);

        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        labelTexture.needsUpdate = true;
        const spriteMaterial = new THREE.SpriteMaterial({
          map: labelTexture,
          depthTest: false,
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(
          (labelWidth / 8) * labelScale,
          (labelHeight / 8) * labelScale,
          1
        );

        sprite.position.set(...node.position);
        scene.add(sprite);
      });

      edges.forEach((edge) => {
        const sourceNode = nodeObjects[edge.source];
        const targetNode = nodeObjects[edge.target];
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
          sourceNode.position,
          targetNode.position,
        ]);
        // Add color to edge lines
        const edgeLine = new THREE.Line(
          edgeGeometry,
          new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        scene.add(edgeLine);
      });

      renderer = new THREE.WebGLRenderer({ antialias: false });
      renderer.setSize(window.innerWidth * 0.5, window.innerHeight * 0.7);
      mountRef.current.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 10;
      controls.maxDistance = 200;
      controls.maxPolarAngle = Math.PI / 2;

      window.addEventListener("resize", onWindowResize);

      const animate = () => {
        requestAnimationFrame(animate);

        // Suavizar la rotación de la cámara hacia el ángulo objetivo
        if (targetCameraRotation !== null) {
          const currentCameraRotation = Math.atan2(
            camera.position.y,
            camera.position.x
          );
          const newCameraRotation = THREE.MathUtils.lerp(
            currentCameraRotation,
            targetCameraRotation,
            0.1
          );
          const radius = camera.position.length();
          camera.position.x = radius * Math.cos(newCameraRotation);
          camera.position.y = radius * Math.sin(newCameraRotation);
        }

        // Suavizar el zoom de la cámara hacia el valor objetivo
        if (targetCameraZoom !== null) {
          camera.position.z = THREE.MathUtils.lerp(
            camera.position.z,
            targetCameraZoom,
            0.2
          );
        }

        camera.lookAt(scene.position);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    };

    init();
    // Inicializa el controlador de Handpose
    const handposeController = new HandposeController(processHandpose);
    handposeController.init();

    // Función de limpieza
    return () => {
      // Elimina el listener de eventos
      window.removeEventListener("resize", onWindowResize);

      // Limpia el contenedor del gráfico
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [nodes, edges, labelScale]);

  // Insertar proces guiado de calibracion
  return (
    <div>
      <div ref={mountRef} />
      <canvas
        id="overlay"
        style={{ position: "absolute", top: 0, left: 0 }}
        width={window.innerWidth * 0.5}
        height={window.innerHeight * 0.7}
      />
      <button
        style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}
        onClick={() => {
          setHandposeEnabled(!handposeEnabled);
          if (!handposeEnabled) {
            startCalibration();
          }
        }}
      >
        {handposeEnabled ? "Desactivar gestos" : "Activar gestos"}
      </button>
      <button
        style={{ position: "absolute", top: 10, left: 110, zIndex: 2 }}
        onClick={() => setInverseRotation(!inverseRotation)}
      >
        {inverseRotation ? "Rotación normal" : "Rotación inversa"}
      </button>
    </div>
  );
};

export default NNChart;
