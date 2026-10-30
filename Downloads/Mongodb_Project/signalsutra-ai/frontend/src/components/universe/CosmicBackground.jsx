import { useEffect, useRef } from 'react'

export default function CosmicBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Generate celestial stars & dust
    const STAR_COUNT = 140
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.15 + 0.03,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      color: Math.random() > 0.7 ? '#54E7FF' : Math.random() > 0.5 ? '#A78BFA' : '#FFFFFF',
    }))

    let animId
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw starry nodes
      for (const star of stars) {
        star.y -= star.speed
        if (star.y < 0) {
          star.y = height
          star.x = Math.random() * width
        }

        star.alpha += Math.sin(Date.now() * star.pulseSpeed) * 0.015
        const boundedAlpha = Math.max(0.1, Math.min(0.9, star.alpha))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = star.color
        ctx.globalAlpha = boundedAlpha
        ctx.shadowBlur = star.size > 1.2 ? 6 : 0
        ctx.shadowColor = star.color
        ctx.fill()
      }

      ctx.globalAlpha = 1.0
      ctx.shadowBlur = 0
      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <>
      <div className="cosmic-nebula-layer" />
      <canvas ref={canvasRef} className="stardust-field" />
    </>
  )
}
