import { useEffect, useMemo, useRef, useState } from "react";
import { OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Group } from "three";

type RankingPodiumCanvasProps = {
  direction: "left" | "right";
};

type Vector3Tuple = [number, number, number];

type PodiumRank3DProps = {
  boxArgs: Vector3Tuple;
  boxPosition: Vector3Tuple;
  delay: number;
  isActive: boolean;
  label: string;
  labelColor: string;
  labelPosition: Vector3Tuple;
  labelSize: [number, number];
  materialColor: string;
  metalness: number;
  radius: number;
  roughness: number;
};

const DEFAULT_CANVAS_WIDTH = 360;
const MAX_CAMERA_ZOOM = 72;
const MIN_CAMERA_ZOOM = 50;
const PODIUM_WORLD_WIDTH = 5.4;

function getResponsiveCameraZoom(width: number) {
  const responsiveZoom = width / PODIUM_WORLD_WIDTH;

  return Math.min(Math.max(responsiveZoom, MIN_CAMERA_ZOOM), MAX_CAMERA_ZOOM);
}

export function RankingPodiumCanvas({ direction }: RankingPodiumCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_WIDTH);
  const cameraZoom = getResponsiveCameraZoom(canvasWidth);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return undefined;
    }

    const updateCanvasWidth = () => {
      setCanvasWidth(node.clientWidth || DEFAULT_CANVAS_WIDTH);
    };

    updateCanvasWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateCanvasWidth);

      return () => {
        window.removeEventListener("resize", updateCanvasWidth);
      };
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setCanvasWidth(entry?.contentRect.width || node.clientWidth || DEFAULT_CANVAS_WIDTH);
    });

    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return undefined;
    }

    const activate = () => {
      setHasEntered(true);
    };
    const fallbackTimer = window.setTimeout(activate, 900);

    const rect = node.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

    if (visibleHeight > rect.height * 0.18) {
      activate();
      window.clearTimeout(fallbackTimer);

      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          activate();
          window.clearTimeout(fallbackTimer);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.16 },
    );

    observer.observe(node);

    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="customer-ranking__canvas"
      data-entered={hasEntered ? "true" : undefined}
      ref={containerRef}
    >
      <PodiumScene
        cameraZoom={cameraZoom}
        direction={direction}
        isActive={hasEntered}
        rotationY={direction === "left" ? 0.32 : -0.32}
      />
    </div>
  );
}

function PodiumRank3D({
  boxArgs,
  boxPosition,
  delay,
  isActive,
  label,
  labelColor,
  labelPosition,
  labelSize,
  materialColor,
  metalness,
  radius,
  roughness,
}: PodiumRank3DProps) {
  const rankRef = useRef<Group>(null);
  const startedAtRef = useRef<number | null>(null);
  const geometry = useMemo(
    () => new RoundedBoxGeometry(boxArgs[0], boxArgs[1], boxArgs[2], 5, radius),
    [boxArgs, radius],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    startedAtRef.current = null;

    if (!isActive && rankRef.current) {
      rankRef.current.position.y = -2.35;
    }
  }, [isActive]);

  useFrame(({ clock }) => {
    if (!rankRef.current) {
      return;
    }

    if (!isActive) {
      rankRef.current.position.y = -2.35;
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startedAtRef.current - delay;
    const progress = Math.min(Math.max(elapsed / 0.72, 0), 1);
    const eased = 1 - (1 - progress) ** 3;
    const settle = Math.sin(progress * Math.PI) * 0.08;

    rankRef.current.position.y = -2.35 + eased * 2.35 + settle;
  });

  return (
    <group ref={rankRef}>
      <mesh position={boxPosition}>
        <primitive attach="geometry" object={geometry} />
        <meshStandardMaterial color={materialColor} metalness={metalness} roughness={roughness} />
      </mesh>
      <PodiumNumber3D color={labelColor} label={label} position={labelPosition} size={labelSize} />
    </group>
  );
}

function PodiumNumber3D({
  color,
  label,
  position,
  size,
}: {
  color: string;
  label: string;
  position: Vector3Tuple;
  size: [number, number];
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const size = 256;
    const center = size / 2;
    const context = canvas.getContext("2d");

    canvas.width = size;
    canvas.height = size;

    if (!context) {
      return null;
    }

    context.clearRect(0, 0, size, size);
    context.font = "900 174px Outfit, Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "rgba(255, 255, 255, 0.2)";
    context.fillText(label, center - 3, center - 4);
    context.shadowColor = "rgba(15, 23, 42, 0.18)";
    context.shadowBlur = 7;
    context.shadowOffsetY = 3;
    context.fillStyle = color;
    context.fillText(label, center, center + 1);

    const labelTexture = new CanvasTexture(canvas);
    labelTexture.colorSpace = SRGBColorSpace;
    labelTexture.magFilter = LinearFilter;
    labelTexture.minFilter = LinearFilter;
    labelTexture.needsUpdate = true;

    return labelTexture;
  }, [color, label]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!texture) {
    return null;
  }

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        depthWrite={false}
        map={texture}
        polygonOffset
        polygonOffsetFactor={-2}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

function PodiumBlocks3D({ isActive, rotationY }: { isActive: boolean; rotationY: number }) {
  return (
    <group position={[0, -0.12, 0]} rotation={[0.18, rotationY, 0]}>
      <PodiumRank3D
        boxArgs={[1.85, 4.1, 1.24]}
        boxPosition={[0, -1.59, 0]}
        delay={0}
        isActive={isActive}
        label="1"
        labelColor="rgba(138, 90, 10, 0.74)"
        labelPosition={[0, -0.48, 0.64]}
        labelSize={[0.72, 0.72]}
        materialColor="#f3bd12"
        metalness={0.58}
        radius={0.025}
        roughness={0.28}
      />

      <PodiumRank3D
        boxArgs={[1.55, 3.35, 1.18]}
        boxPosition={[-1.88, -1.75, 0]}
        delay={0.18}
        isActive={isActive}
        label="2"
        labelColor="rgba(71, 85, 105, 0.72)"
        labelPosition={[-1.88, -0.78, 0.61]}
        labelSize={[0.58, 0.58]}
        materialColor="#d9e2f3"
        metalness={0.62}
        radius={0.022}
        roughness={0.3}
      />

      <PodiumRank3D
        boxArgs={[1.55, 3.1, 1.18]}
        boxPosition={[1.88, -1.83, 0]}
        delay={0.36}
        isActive={isActive}
        label="3"
        labelColor="rgba(113, 63, 18, 0.72)"
        labelPosition={[1.88, -0.9, 0.61]}
        labelSize={[0.58, 0.58]}
        materialColor="#d97832"
        metalness={0.54}
        radius={0.022}
        roughness={0.32}
      />
    </group>
  );
}

function PodiumScene({
  cameraZoom,
  direction,
  isActive,
  rotationY,
}: {
  cameraZoom: number;
  direction: "left" | "right";
  isActive: boolean;
  rotationY: number;
}) {
  const lightSide = direction === "left" ? 1 : -1;
  const fillSide = lightSide * -1;

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      style={{ height: "100%", width: "100%" }}
    >
      <OrthographicCamera makeDefault position={[0, -0.2, 5.4]} zoom={cameraZoom} />
      <ambientLight intensity={2.35} />
      <directionalLight color="#ffffff" intensity={4.2} position={[lightSide * 2.7, 4.6, 3.8]} />
      <directionalLight color="#dbeafe" intensity={1.55} position={[fillSide * 3, 1.45, 2.6]} />
      <pointLight color="#fff6d7" intensity={1.4} position={[lightSide * 3.1, 1.6, 2.8]} />
      <pointLight color="#ffffff" intensity={0.85} position={[0, -2.2, 2.2]} />
      <PodiumBlocks3D isActive={isActive} rotationY={rotationY} />
    </Canvas>
  );
}
