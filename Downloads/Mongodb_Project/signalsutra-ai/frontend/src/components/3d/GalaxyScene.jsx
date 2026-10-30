import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Float } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { celestialAudio } from '../universe/CelestialAudio'

const SIGNAL_COLOR_MAP = {
  rainfall: '#54E7FF',
  flood: '#4FFFC0',
  river_level: '#38BDF8',
  earthquake: '#FF647C',
  fire: '#F97316',
  road_block: '#FFD580',
  power_outage: '#FBBF24',
  landslide: '#E879F9',
  citizen: '#A78BFA',
  other: '#94A3B8',
}

function SignalStarNode({ signal, position, isSelected, onSelect }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const color = SIGNAL_COLOR_MAP[signal.signalType] || '#54E7FF'
  const isCritical = signal.severity === 'critical'
  const size = isCritical ? 0.35 : signal.severity === 'high' ? 0.28 : 0.22

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (hovered ? 2.0 : 0.4)
      meshRef.current.rotation.z += delta * 0.2
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          celestialAudio.playNodeBeep(signal.severity)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(signal)
        }}
        scale={isSelected ? [1.8, 1.8, 1.8] : hovered ? [1.4, 1.4, 1.4] : [1, 1, 1]}
      >
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 2.5 : hovered ? 1.8 : 0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Pulsing Aura */}
      {(hovered || isSelected || isCritical) && (
        <mesh scale={[1.8, 1.8, 1.8]}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.4 : 0.2}
            wireframe
          />
        </mesh>
      )}
    </group>
  )
}

function ConstellationLines({ nodes }) {
  const lineRef = useRef()

  const points = []
  // Form celestial edges between adjacent nodes
  for (let i = 0; i < Math.min(nodes.length - 1, 35); i += 2) {
    if (nodes[i] && nodes[i + 1]) {
      points.push(new THREE.Vector3(...nodes[i].pos))
      points.push(new THREE.Vector3(...nodes[i + 1].pos))
    }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#54E7FF" transparent opacity={0.15} />
    </lineSegments>
  )
}

export default function GalaxyScene({ signals = [], selectedSignal, onSelectSignal }) {
  // Map signals to 3D positions using deterministic spiral galaxy layout
  const mappedNodes = signals.slice(0, 80).map((s, idx) => {
    const angle = idx * 0.38
    const distance = 2.0 + Math.sqrt(idx) * 0.95
    const height = Math.sin(idx * 0.7) * 1.8
    const x = Math.cos(angle) * distance
    const z = Math.sin(angle) * distance
    return {
      signal: s,
      pos: [x, height, z],
    }
  })

  return (
    <div className="canvas-3d-wrapper">
      <Canvas camera={{ position: [0, 8, 14], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} intensity={2.0} color="#54E7FF" distance={25} />
        <directionalLight position={[8, 12, 6]} intensity={1.0} color="#FFFFFF" />

        <Stars radius={80} depth={50} count={3500} factor={4} saturation={0.5} fade speed={0.8} />

        {/* Central Galactic Core */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#241641" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[1.5, 3.2, 48]} />
          <meshBasicMaterial color="#54E7FF" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>

        {/* Constellation Network */}
        <ConstellationLines nodes={mappedNodes} />

        {/* Signal Stars */}
        {mappedNodes.map((n) => (
          <SignalStarNode
            key={n.signal.id || n.signal._id}
            signal={n.signal}
            position={n.pos}
            isSelected={selectedSignal?.id === n.signal.id}
            onSelect={onSelectSignal}
          />
        ))}

        <OrbitControls
          enablePan={false}
          maxDistance={22}
          minDistance={4}
          autoRotate
          autoRotateSpeed={0.2}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
