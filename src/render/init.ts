import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import TickManager from './tick-manager'

export interface TickData {
  timestamp: number;
  timeDiff: number;
  frame: XRFrame | null;
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let composer: EffectComposer
let controls: OrbitControls
let stats: Stats
let gui: GUI
let renderWidth: number
let renderHeight: number
let renderAspectRatio: number
const renderTickManager = new TickManager()



export const initEngine = async (): Promise<void> => {
  scene = new THREE.Scene()

  renderWidth = window.innerWidth
  renderHeight = window.innerHeight

  renderAspectRatio = renderWidth / renderHeight

  camera = new THREE.PerspectiveCamera(75, renderAspectRatio, 0.1, 100)
  camera.position.z = 2

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(renderWidth, renderHeight)

  // shadow
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  document.body.appendChild(renderer.domElement)

  const target = new THREE.WebGLRenderTarget(renderWidth, renderHeight, {
    samples: 8,
  })
  composer = new EffectComposer(renderer, target)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  stats = new Stats()
  document.body.appendChild(stats.dom)

  gui = new GUI()

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  window.addEventListener(
    'resize',
    () => {
      renderWidth = window.innerWidth
      renderHeight = window.innerHeight
      renderAspectRatio = renderWidth / renderHeight

      renderer.setPixelRatio(window.devicePixelRatio * 1.5)

      camera.aspect = renderAspectRatio
      camera.updateProjectionMatrix()

      renderer.setSize(renderWidth, renderHeight)
      composer.setSize(renderWidth, renderHeight)
    },
    false
  )

  renderTickManager.startLoop()
}

export const useRenderer = (): THREE.WebGLRenderer => renderer

export const useRenderSize = (): { width: number; height: number } => ({ width: renderWidth, height: renderHeight })

export const useScene = (): THREE.Scene => scene

export const useCamera = (): THREE.PerspectiveCamera => camera

export const useControls = (): OrbitControls => controls

export const useStats = (): Stats => stats

export const useComposer = (): EffectComposer => composer

export const useGui = (): GUI => gui

export const addPass = (pass: Pass): void => {
  composer.addPass(pass)
}

export const useTick = (fn: (data: TickData) => void): void => {
  const tickManager = new TickManager();
  tickManager.addEventListener('tick', ((e: CustomEvent<TickData>) => {
      fn(e.detail);
  }) as EventListener);
  tickManager.startLoop();
}