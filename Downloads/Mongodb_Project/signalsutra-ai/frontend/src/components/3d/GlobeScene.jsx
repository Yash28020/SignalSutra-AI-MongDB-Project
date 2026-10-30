import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { celestialAudio } from '../universe/CelestialAudio'

// Convert [lon, lat] coordinates to 3D sphere surface vector
function latLonToVector3(lat, lon, radius = 2.4) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

function IncidentGlobeMarker({ incident, onSelect }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const coords = incident.region?.center?.coordinates || [77.1025, 28.7041]
  const lon = coords[0]
  const lat = coords[1]
  const pos = latLonToVector3(lat, lon, 2.45)

  const isCritical = incident.severity === 'critical'
  const color = isCritical ? '#FF647C' : incident.severity === 'high' ? '#FB923C' : '#4FFFC0'

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2.0
    }
  })

  return (
    <group position={pos}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          celestialAudio.playNodeBeep(incident.severity)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onSelect && onSelect(incident)
        }}
        scale={hovered ? [1.6, 1.6, 1.6] : [1, 1, 1]}
      >
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2.5 : 1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Surface Beacon Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.14, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function EarthGlobe({ incidents = [], onSelectIncident }) {
  const globeRef = useRef()

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08
    }
  })

  return (
    <group ref={globeRef}>
      {/* Planetary Base Sphere */}
      <mesh>
        <sphereGeometry args={[2.4, 48, 48]} />
        <meshStandardMaterial
          color="#0C1328"
          emissive="#070B19"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Lat/Lon Holographic Wireframe Grid */}
      <mesh scale={[1.002, 1.002, 1.002]}>
        <sphereGeometry args={[2.4, 24, 24]} />
        <meshBasicMaterial
          color="#54E7FF"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Atmospheric Haze Layer */}
      <mesh scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial
          color="#54E7FF"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Incident Coordinate Beacons */}
      {incidents.slice(0, 30).map((inc) => (
        <IncidentGlobeMarker
          key={inc.id || inc._id}
          incident={inc}
          onSelect={onSelectIncident}
        />
      ))}
    </group>
  )
}

export default function GlobeScene({ incidents = [], onSelectIncident }) {
  return (
    <div className="canvas-3d-wrapper">
      <Canvas camera={{ position: [0, 2, 6.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[6, 8, 5]} intensity={1.5} color="#FFFFFF" />
        <pointLight position={[-6, -4, -4]} intensity={0.8} color="#54E7FF" />

        <Stars radius={60} depth={40} count={2000} factor={3} saturation={0.5} fade />

        <EarthGlobe incidents={incidents} onSelectIncident={onSelectIncident} />

        <OrbitControls
          enablePan={false}
          maxDistance={12}
          minDistance={4.5}
          autoRotate={false}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
