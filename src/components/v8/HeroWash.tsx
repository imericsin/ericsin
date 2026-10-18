import { useEffect, useRef } from 'react'

// Watercolor reveal behind the v8 home hero. The pointer paints soft blobs
// into a low-res 2D "wetness" mask; a WebGL pass turns that mask into a
// ragged, textured watercolor edge (noise-thresholded, with pigment pooling
// at the boundary and paper grain) and uses it to reveal the background
// painting. Strokes are laid down as many faint, closely spaced stamps so
// they read as one continuous wet stroke. Each stamp soaks in, then spreads
// outward while thinning — the trail blooms and settles rather than popping
// in and fading — and is gone LIFETIME seconds after it was painted. The
// loop stops once the last stamp expires.
//
// The headline is black DOM text beneath this canvas. Its glyphs are also
// rasterized into a text mask (uText) so the shader can paint them pure
// white wherever the wash is revealed; outside the wash the canvas is
// transparent and the black text shows through.
//
// Skipped entirely under prefers-reduced-motion or without WebGL — the hero
// is simply the plain white version then.

const SRC = '/v8/hero-wash.jpg'

const MASK_SCALE = 0.25        // mask canvas resolution vs. CSS pixels
const BRUSH = 240              // base brush radius, CSS px
const SPACING = 0.07           // distance between stamps along a stroke, × BRUSH
const STRENGTH = 0.13          // per-stamp opacity (stamps overlap heavily)
const LIFETIME = 3.25          // seconds from painting a stamp until it's fully gone
const SOAK = 0.15              // seconds for a stamp to soak in to full strength
const FOLLOW = 0.035           // brush lag behind the cursor (time constant, seconds)
const DWELL = 0.06             // while moving, also lay a stamp at least this often (s)
const INTRO_DELAY = 900        // ms; wait for the headline's blur-in before the load-in sweep
const ACTIVE = 0.6             // ...for this long after the last pointer move (s)
const FADE_CURVE = 2.75        // higher = holds longer, then fades out faster at the end
const SPREAD = 1.15            // stamp size (× radius) at the end of its life: >1 blooms outward, <1 dries inward

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMask;
uniform sampler2D uImage;
uniform sampler2D uText;   // headline glyph coverage, same space as the canvas
uniform vec2 uRes;        // canvas size, device px
uniform vec4 uCover;      // image uv = uv * uCover.xy + uCover.zw (object-fit: cover)
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 px = uv * uRes / min(uRes.x, uRes.y);   // aspect-correct noise space

  float m = texture2D(uMask, vec2(uv.x, 1.0 - uv.y)).a;

  // Two scales of noise push the threshold around: a slow, drifting
  // large-scale wobble (the bleed) and fine fiber detail (the paper).
  float bleed = fbm(px * 3.2 + vec2(uTime * 0.03, -uTime * 0.02));
  float fiber = fbm(px * 28.0);
  // Fiber noise is kept small here: on thin strokes the threshold lands on
  // a shallow mask gradient, and fine noise turns that edge jagged.
  float v = m + (bleed - 0.5) * 0.45 + (fiber - 0.5) * 0.05;

  float a = smoothstep(0.24, 0.60, v);
  // Pigment pools where the wash is drying: a thin, darker band at the edge.
  float rim = smoothstep(0.24, 0.34, v) * (1.0 - smoothstep(0.34, 0.60, v));

  vec4 img = texture2D(uImage, vec2(uv.x, 1.0 - uv.y) * uCover.xy + uCover.zw);
  vec3 col = img.rgb;
  col *= 1.0 - rim * 0.22;
  col *= 1.0 - (fiber - 0.5) * 0.10;     // granulation
  // Headline glyphs inside the wash read as pure white.
  float t = texture2D(uText, vec2(uv.x, 1.0 - uv.y)).a;
  col = mix(col, vec3(1.0), t);
  a *= img.a;

  gl_FragColor = vec4(col * a, a);       // premultiplied
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
  return s
}

// Soft, irregular brush tip: a radial falloff whose edge is broken up by
// value noise, so each stamp reads like a drop of water rather than a disc.
function makeBrush(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const seed = Math.random() * 100
  const n = (x: number, y: number) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453
    return s - Math.floor(s)
  }
  const vnoise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = x - xi, yf = y - yi
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
    const a = n(xi, yi), b = n(xi + 1, yi), c2 = n(xi, yi + 1), d = n(xi + 1, yi + 1)
    return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + d) * u * v
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x / size) * 2 - 1, dy = (y / size) * 2 - 1
      const r = Math.sqrt(dx * dx + dy * dy)
      const wob = (vnoise(x / 10, y / 10) - 0.5) * 0.28 + (vnoise(x / 3, y / 3) - 0.5) * 0.08
      const t = Math.max(0, 1 - (r + wob))
      img.data[(y * size + x) * 4 + 3] = Math.round(255 * Math.pow(t, 1.6))
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}

export default function HeroWash() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) return

    let prog: WebGLProgram
    try {
      prog = gl.createProgram()!
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    } catch {
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uCover = gl.getUniformLocation(prog, 'uCover')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    gl.uniform1i(gl.getUniformLocation(prog, 'uMask'), 0)
    gl.uniform1i(gl.getUniformLocation(prog, 'uImage'), 1)
    gl.uniform1i(gl.getUniformLocation(prog, 'uText'), 2)

    const makeTex = (unit: number) => {
      const t = gl.createTexture()!
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    const maskTex = makeTex(0)
    const imageTex = makeTex(1)
    const textTex = makeTex(2)
    const textCanvas = document.createElement('canvas')
    const tctx = textCanvas.getContext('2d')!
    const words = Array.from(canvas.parentElement?.querySelectorAll<HTMLImageElement>('.v8-hero__word') ?? [])

    // Rasterize the headline SVGs at their on-screen positions, in the
    // canvas's own pixel space, and upload as the text mask.
    function buildText() {
      const c = canvas!.getBoundingClientRect()
      if (!c.width || !c.height) return
      textCanvas.width = canvas!.width
      textCanvas.height = canvas!.height
      const sx = canvas!.width / c.width, sy = canvas!.height / c.height
      tctx.clearRect(0, 0, textCanvas.width, textCanvas.height)
      for (const w of words) {
        if (!w.complete || !w.naturalWidth) continue
        const r = w.getBoundingClientRect()
        tctx.drawImage(w, (r.left - c.left) * sx, (r.top - c.top) * sy, r.width * sx, r.height * sy)
      }
      gl!.activeTexture(gl!.TEXTURE2)
      gl!.bindTexture(gl!.TEXTURE_2D, textTex)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, textCanvas)
    }
    words.forEach(w => { if (!w.complete) w.addEventListener('load', () => { buildText(); render(performance.now()) }, { once: true }) })

    const mask = document.createElement('canvas')
    const mctx = mask.getContext('2d')!
    const brush = makeBrush(128)

    let imgW = 0, imgH = 0, cssW = 0, cssH = 0
    let raf = 0, running = false, introTimer = 0, prevT = 0
    // The brush eases toward the cursor and paints from that smoothed path
    // each frame, so slow or uneven pointer events still lay an even stroke.
    let target: { x: number; y: number } | null = null
    let brushPos: { x: number; y: number } | null = null
    let lastMove = 0, lastStampAt = 0
    let last: { x: number; y: number } | null = null
    // Stamps live in CSS px so the mask can be rebuilt at any size.
    type Stamp = { x: number; y: number; r: number; rot: number; alpha: number; born: number }
    let stamps: Stamp[] = []
    const start = performance.now()

    function updateCover() {
      if (!imgW || !cssW) return
      // object-fit: cover — scale the shorter axis to fit, crop the other.
      const ca = cssW / cssH, ia = imgW / imgH
      const sx = ca > ia ? 1 : ca / ia
      const sy = ca > ia ? ia / ca : 1
      gl!.uniform4f(uCover, sx, sy, (1 - sx) / 2, (1 - sy) / 2)
    }

    function resize() {
      const r = canvas!.getBoundingClientRect()
      cssW = r.width; cssH = r.height
      // The wash is soft, so 1.5× is indistinguishable from 2× and much cheaper.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas!.width = Math.round(cssW * dpr)
      canvas!.height = Math.round(cssH * dpr)
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
      gl!.uniform2f(uRes, canvas!.width, canvas!.height)
      mask.width = Math.max(1, Math.round(cssW * MASK_SCALE))
      mask.height = Math.max(1, Math.round(cssH * MASK_SCALE))
      updateCover()
      buildText()
      render(performance.now())
    }

    function stamp(x: number, y: number, strength: number) {
      // No positional jitter: at slow speeds the shader's edge threshold
      // amplifies any offset at the stroke head into visible flicker.
      const r = BRUSH * (0.97 + Math.random() * 0.06)
      stamps.push({
        x,
        y,
        r,
        // Random rotation so the brush tip's texture doesn't repeat along
        // the stroke (identical stamps read as a scalloped edge).
        rot: Math.random() * Math.PI * 2,
        alpha: strength * (0.85 + Math.random() * 0.3),
        born: performance.now(),
      })
      lastStampAt = performance.now()
    }

    // Opacity and size over a stamp's life (age in seconds): a quick soak-in,
    // then a long ease-out while the radius keeps spreading. Because opacity
    // drops as it grows, the visible edge first blooms outward, then recedes.
    function life(age: number) {
      const soak = Math.min(1, age / SOAK)
      const t = Math.min(1, age / LIFETIME)
      return {
        alpha: soak * soak * (3 - 2 * soak) * (1 - Math.pow(t, FADE_CURVE)),
        scale: 1 + (SPREAD - 1) * (1 - Math.pow(1 - t, 2)),
      }
    }

    function rebuildMask(now: number) {
      mctx.setTransform(1, 0, 0, 1, 0, 0)   // clearRect respects the transform
      mctx.clearRect(0, 0, mask.width, mask.height)
      stamps = stamps.filter(s => now - s.born < LIFETIME * 1000)
      for (const s of stamps) {
        const l = life((now - s.born) / 1000)
        const r = s.r * l.scale * MASK_SCALE
        mctx.globalAlpha = s.alpha * l.alpha
        mctx.setTransform(Math.cos(s.rot), Math.sin(s.rot), -Math.sin(s.rot), Math.cos(s.rot), s.x * MASK_SCALE, s.y * MASK_SCALE)
        mctx.drawImage(brush, -r, -r, r * 2, r * 2)
      }
    }

    // `last` is the last stamp placed, not the last pointer position, so
    // stamps land at even intervals however fast or slow the pointer moves.
    function strokeTo(x: number, y: number, strength = STRENGTH) {
      if (!last) {
        stamp(x, y, strength)
        last = { x, y }
      } else {
        const dx = x - last.x, dy = y - last.y
        const dist = Math.hypot(dx, dy)
        const step = BRUSH * SPACING
        if (dist < step) return
        let d = step
        for (; d <= dist; d += step) stamp(last.x + (dx * d) / dist, last.y + (dy * d) / dist, strength)
        d -= step
        last = { x: last.x + (dx * d) / dist, y: last.y + (dy * d) / dist }
      }
      wake()
    }

    function wake() {
      if (!running) { running = true; prevT = performance.now(); raf = requestAnimationFrame(loop) }
    }

    function render(now: number) {
      rebuildMask(now)
      gl!.activeTexture(gl!.TEXTURE0)
      gl!.bindTexture(gl!.TEXTURE_2D, maskTex)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, mask)
      gl!.uniform1f(uTime, (now - start) / 1000)
      gl!.clearColor(0, 0, 0, 0)
      gl!.clear(gl!.COLOR_BUFFER_BIT)
      if (imgW) gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    }

    function loop(now: number) {
      const dt = Math.min(0.05, (now - prevT) / 1000)
      prevT = now
      let following = false
      if (target && brushPos) {
        const k = 1 - Math.exp(-dt / FOLLOW)
        brushPos = { x: brushPos.x + (target.x - brushPos.x) * k, y: brushPos.y + (target.y - brushPos.y) * k }
        strokeTo(brushPos.x, brushPos.y)
        // Distance-only stamping starves slow strokes (too few live stamps
        // to clear the reveal threshold, so the edge flickers). Keep pigment
        // flowing on a timer too while the pointer is moving.
        const moving = (now - lastMove) / 1000 < ACTIVE
        if (moving && (now - lastStampAt) / 1000 >= DWELL) {
          stamp(brushPos.x, brushPos.y, STRENGTH)
          last = { ...brushPos }
        }
        following = moving || Math.hypot(target.x - brushPos.x, target.y - brushPos.y) > 0.5
      }
      render(now)
      if (!stamps.length && !following) { running = false; return }
      raf = requestAnimationFrame(loop)
    }

    function onMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) {
        target = brushPos = null
        last = null
        return
      }
      target = { x, y }
      lastMove = performance.now()
      if (!brushPos) { brushPos = { x, y }; strokeTo(x, y) }
      wake()
    }

    // A slow sweep across the headline on load so the effect is discoverable
    // (and so touch visitors, who never hover, still see it once).
    function intro() {
      const t0 = performance.now(), dur = 1800
      const path = (t: number) => ({
        x: cssW * (0.12 + 0.76 * t),
        y: cssH * (0.42 + 0.14 * Math.sin(t * Math.PI * 1.6)),
      })
      last = null
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur)
        const p = path(t)
        strokeTo(p.x, p.y, STRENGTH * 1.1)
        if (t < 1) requestAnimationFrame(step)
        else last = null
      }
      requestAnimationFrame(step)
    }

    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      imgW = image.naturalWidth; imgH = image.naturalHeight
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, imageTex)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      updateCover()
      introTimer = window.setTimeout(intro, INTRO_DELAY)
    }
    image.src = SRC

    // Extend the canvas from the hero up to the top of the page, so the wash
    // runs behind the (transparent) header instead of stopping under it.
    // Changing the lift resizes the canvas, which the observer picks up.
    function lift() {
      const hero = canvas!.parentElement
      if (!hero) return
      const top = hero.getBoundingClientRect().top + window.scrollY
      canvas!.style.setProperty('--v8-wash-lift', `${Math.max(0, top)}px`)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const header = document.querySelector('.v8-header')
    const lro = new ResizeObserver(lift)
    if (header) lro.observe(header)
    lift()
    resize()
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(introTimer)
      ro.disconnect()
      lro.disconnect()
      window.removeEventListener('pointermove', onMove)
      image.onload = null
    }
  }, [])

  return <canvas ref={canvasRef} className="v8-hero__wash" aria-hidden />
}
