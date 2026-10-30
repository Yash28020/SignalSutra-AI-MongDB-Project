import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text } from '@react-three/drei'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { celestialAudio } from '../universe/CelestialAudio'

// The 6 Worlds configuration for the 3D Portals
const PORTAL_CONFIG = [
  {
    id: 'nexus',
    name: 'THE NEXUS',
    subtitle: 'Command Center',
    path: '/',
    color: '#54E7FF',
    geometryType: 'torus',
    angle: 0,
  },
  {
    id: 'galaxy',
    name: 'SIGNAL GALAXY',
    subtitle: 'Observation Cosmos',
    path: '/signals',
    color: '#A78BFA',
    geometryType: 'icosahedron',
    angle: (Math.PI / 3) * 1,
  },
  {
    id: 'earth',
    name: 'EARTH OBSERVATORY',
    subtitle: 'Geospatial Planet',
    path: '/map',
    color: '#4FFFC0',
    geometryType: 'sphere',
    angle: (Math.PI / 3) * 2,
  },
  {
    id: 'chamber',
    name: 'INTELLIGENCE CHAMBER',
    subtitle: 'Evidence Graph',
    path: '/intelligence',
    color: '#818CF8',
    geometryType: 'octahedron',
    angle: (Math.PI / 3) * 3,
  },
  {
    id: 'forge',
    name: 'RESPONSE FORGE',
    subtitle: 'Operations & Planner',
    path: '/actions',
    color: '#FF647C',
    geometryType: 'dodecahedron',
    angle: (Math.PI / 3) * 4,
  },
  {
    id: 'vault',
    name: 'MEMORY VAULT',
    subtitle: 'Archive & Replay',
    path: '/memory',
    color: '#FFD580',
    geometryType: 'cylinder',
    angle: (Math.PI / 3) * 5,
  },
]

function CentralPlanet() {
  const planetRef = useRef()
  const ringRef = useRef()

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.12
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.05
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Central Luminous Core */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshStandardMaterial
          color="#0C1328"
          emissive="#1E1B4B"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Atmospheric Hologram Grid */}
      <mesh scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial
          color="#54E7FF"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Orbital Celestial Rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.6, 0.2, 0]}>
        <ringGeometry args={[3.2, 4.6, 64]} />
        <meshStandardMaterial
          color="#A78BFA"
          emissive="#54E7FF"
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  )
}

function DimensionalPortal({ config, onSelect }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const radius = 5.6
  const x = Math.cos(config.angle) * radius
  const z = Math.sin(config.angle) * radius
  const y = Math.sin(config.angle * 2) * 0.6

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (hovered ? 1.5 : 0.6)
      meshRef.current.rotation.x += delta * 0.3
    }
  })

  const renderGeometry = () => {
    switch (config.geometryType) {
      case 'torus':
        return <torusGeometry args={[0.55, 0.18, 16, 32]} />
      case 'icosahedron':
        return <icosahedronGeometry args={[0.65, 0]} />
      case 'sphere':
        return <sphereGeometry args={[0.6, 24, 24]} />
      case 'octahedron':
        return <octahedronGeometry args={[0.65, 0]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[0.6, 0]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.45, 0.45, 0.8, 16]} />
      default:
        return <octahedronGeometry args={[0.6, 0]} />
    }
  }

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <group position={[x, y, z]}>
        {/* Floating Gateway Mesh */}
        <mesh
          ref={meshRef}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            celestialAudio.playNodeBeep('moderate')
          }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(config)
          }}
          scale={hovered ? [1.35, 1.35, 1.35] : [1, 1, 1]}
          style={{ cursor: 'pointer' }}
        >
          {renderGeometry()}
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={hovered ? 1.8 : 0.7}
            roughness={0.2}
            metalness={0.9}
            wireframe={!hovered && config.geometryType === 'sphere'}
          />
        </mesh>

        {/* Halo Glow Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={hovered ? 0.6 : 0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 3D World Label */}
        <Text
          position={[0, -1.0, 0]}
          fontSize={0.26}
          color={hovered ? '#FFFFFF' : config.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#070B19"
        >
          {config.name}
        </Text>
      </group>
    </Float>
  )
}

export default function NexusScene({ onSelectWorld }) {
  const navigate = useNavigate()

  const handlePortalSelect = (portal) => {
    celestialAudio.playPortalChime(1.2)
    if (onSelectWorld) {
      onSelectWorld(portal)
    } else {
      navigate(portal.path)
    }
  }

  return (
    <div className="canvas-3d-wrapper">
      <Canvas
        camera={{ position: [0, 5, 11], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} intensity={2.5} color="#54E7FF" distance={20} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} color="#FFFFFF" />
        <directionalLight position={[-10, -5, -5]} intensity={0.8} color="#A78BFA" />

        {/* Deep Field Stars */}
        <Stars radius={60} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />

        {/* Central Intelligence Planet */}
        <CentralPlanet />

        {/* Six Dimensional Portals */}
        {PORTAL_CONFIG.map((p) => (
          <DimensionalPortal key={p.id} config={p} onSelect={handlePortalSelect} />
        ))}

        <OrbitControls
          enablePan={false}
          maxDistance={18}
          minDistance={6}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 4}
          autoRotate
          autoRotateSpeed={0.3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}
