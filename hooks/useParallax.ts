'use client'
import { useEffect, useRef } from 'react'

export function useParallax() {
  const heroRef = useRef<HTMLDivElement>(null)
  const neb1Ref = useRef<HTMLDivElement>(null)
  const neb2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const handle = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      if (heroRef.current) heroRef.current.style.transform = `translate(${x * -1}px, ${y * -1}px)`
      if (neb1Ref.current) neb1Ref.current.style.transform = `translate(${x * 2}px, ${y * 2}px)`
      if (neb2Ref.current) neb2Ref.current.style.transform = `translate(${x * -3}px, ${y * -3}px)`
    }
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  return { heroRef, neb1Ref, neb2Ref }
}