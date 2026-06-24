import { useMemo, useRef } from "react";
import { Environment, Float, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import type { Group } from "three";

function createCoinTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(184, 142, 28, 256, 256, 260);
  gradient.addColorStop(0, "#fff4b8");
  gradient.addColorStop(0.42, "#f8c85a");
  gradient.addColorStop(1, "#b97716");

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(256, 256, 236, 0, Math.PI * 2);
  context.fill();

  context.lineWidth = 18;
  context.strokeStyle = "rgba(255, 255, 255, 0.42)";
  context.beginPath();
  context.arc(256, 256, 196, 0, Math.PI * 2);
  context.stroke();

  context.lineWidth = 8;
  context.strokeStyle = "rgba(120, 68, 12, 0.24)";
  context.beginPath();
  context.arc(256, 256, 224, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#fff7d6";
  context.font = "700 112px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("DMC", 256, 238);

  context.fillStyle = "rgba(87, 46, 8, 0.72)";
  context.font = "700 34px Inter, system-ui, sans-serif";
  context.fillText("daema", 256, 328);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

function CoinToken3D() {
  const groupRef = useRef<Group | null>(null);
  const faceTexture = useMemo(() => createCoinTexture(), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.72) * 0.22;
    groupRef.current.rotation.x = -0.18 + Math.sin(clock.elapsedTime * 0.54) * 0.035;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.95) * 0.06;
  });

  return (
    <Float floatIntensity={0.32} rotationIntensity={0.16} speed={1.25}>
      <group ref={groupRef} rotation={[0.06, -0.18, -0.08]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.24, 1.24, 0.2, 96]} />
          <meshStandardMaterial color="#d18a1f" metalness={0.62} roughness={0.26} />
        </mesh>

        <mesh position={[0, 0, 0.105]}>
          <circleGeometry args={[1.18, 96]} />
          <meshStandardMaterial
            color="#f8c85a"
            map={faceTexture}
            metalness={0.34}
            roughness={0.24}
          />
        </mesh>

        <mesh position={[0, 0, -0.105]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[1.18, 96]} />
          <meshStandardMaterial
            color="#e7a82f"
            map={faceTexture}
            metalness={0.42}
            roughness={0.28}
          />
        </mesh>

        <mesh position={[0, 0, 0.126]}>
          <torusGeometry args={[1.21, 0.055, 18, 112]} />
          <meshStandardMaterial color="#ffd76a" metalness={0.72} roughness={0.2} />
        </mesh>

        <mesh position={[0, 0, -0.126]}>
          <torusGeometry args={[1.21, 0.055, 18, 112]} />
          <meshStandardMaterial color="#b66c12" metalness={0.58} roughness={0.28} />
        </mesh>
      </group>
    </Float>
  );
}

export function LoginCoinScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      shadows={false}
      style={{ background: "transparent" }}
    >
      <OrthographicCamera makeDefault position={[0, 0, 6]} zoom={96} />
      <ambientLight intensity={1.5} />
      <directionalLight intensity={2.3} position={[3, 4, 5]} />
      <directionalLight color="#fff3bf" intensity={1} position={[-4, 2, 2]} />
      <CoinToken3D />
      <Environment preset="city" />
    </Canvas>
  );
}
