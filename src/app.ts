import * as THREE from "three";
import {
  addPass,
  useCamera,
  useGui,
  useRenderSize,
  useScene,
  useTick,
} from "./render/init.js";
import { SavePass } from "three/examples/jsm/postprocessing/SavePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { BlendShader } from "three/examples/jsm/shaders/BlendShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";

import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

const startApp = () => {
  const scene = useScene();
  const camera = useCamera();
  const gui = useGui();
  const { width, height } = useRenderSize();

  // settings
  const MOTION_BLUR_AMOUNT = 0;

  // lighting
  const dirLight = new THREE.DirectionalLight("#ffffff", 0.75);
  dirLight.position.set(5, 5, 5);

  const ambientLight = new THREE.AmbientLight("#ffffff", 0.2);
  scene.add(dirLight, ambientLight);

  // uniforms
  const uniforms = {
    u_time: { type: "f", value: 0.0 },
    u_resolution: {
      type: "v2",
      value: new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      ).multiplyScalar(window.devicePixelRatio),
    },
    u_mouse: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
  };

  // meshes
  const geometry = new THREE.IcosahedronGeometry(1, 10);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
  });

  const ico = new THREE.Mesh(geometry, material);
  scene.add(ico);

  // GUI
  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "z", 0, 10);
  cameraFolder.open();

  const lightFolder = gui.addFolder("Light");
  lightFolder.add(dirLight.position, "x", -10, 10);
  lightFolder.add(dirLight.position, "y", -10, 10);
  lightFolder.add(dirLight.position, "z", -10, 10);
  lightFolder.close();

  const materialFolder = gui.addFolder("Material");
  materialFolder.add(material, "wireframe");
  materialFolder.open();

  const motionBlurFolder = gui.addFolder("Motion Blur");
  motionBlurFolder
    .add({ amount: MOTION_BLUR_AMOUNT }, "amount", 0, 1)
    .onChange((value) => {
      blendPass.uniforms["mixRatio"].value = value;
    });
  motionBlurFolder.close();

  // postprocessing
  const renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false,
  };

  // save pass
  const savePass = new SavePass(
    new THREE.WebGLRenderTarget(width, height, renderTargetParameters)
  );

  // blend pass
  const blendPass = new ShaderPass(BlendShader, "tDiffuse1");
  blendPass.uniforms["tDiffuse2"].value = savePass.renderTarget.texture;
  blendPass.uniforms["mixRatio"].value = MOTION_BLUR_AMOUNT;

  // output pass
  const outputPass = new ShaderPass(CopyShader);
  outputPass.renderToScreen = true;

  // adding passes to composer
  addPass(blendPass);
  addPass(savePass);
  addPass(outputPass);

  useTick(({ timestamp }) => {
    uniforms.u_time.value = timestamp / 1000;
    ico.rotation.x += 0.01;
    ico.rotation.y -= 0.01;
  });

  window.addEventListener("resize", () => {
    uniforms.u_resolution.value
      .set(window.innerWidth, window.innerHeight)
      .multiplyScalar(window.devicePixelRatio);
  });

  window.addEventListener("mousemove", (e) => {
    uniforms.u_mouse.value.set(
      e.screenX / window.innerWidth,
      1 - e.screenY / window.innerHeight
    );
  });
};

export default startApp;
