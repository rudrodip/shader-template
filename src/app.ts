import * as THREE from "three";
import {
  addPass,
  useCamera,
  useGui,
  useRenderSize,
  useScene,
  useTick,
} from "./render/init.js";

import vertexPars from "./shaders/vertex_pars.glsl?raw";
import vertexMain from "./shaders/vertex_main.glsl?raw";
import fragmentPars from "./shaders/fragment_pars.glsl?raw";
import fragmentMain from "./shaders/fragment_main.glsl?raw";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const startApp = () => {
  const scene = useScene();
  const camera = useCamera();
  const gui = useGui();
  const { width, height } = useRenderSize();

  // lighting
  const dirLight = new THREE.DirectionalLight("#526cff", 2);
  dirLight.position.set(2, 2, 2);

  const ambientLight = new THREE.AmbientLight("#4255ff", 0.6);
  scene.add(dirLight, ambientLight);

  // meshes
  const geometry = new THREE.IcosahedronGeometry(1, 400);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0,
    // @ts-ignore
    onBeforeCompile: (shader) => {
      // storing a reference to the shader object
      material.userData.shader = shader;

      // uniforms
      shader.uniforms.uTime = { value: 0 };

      const parsVertexString = /* glsl */ `#include <displacementmap_pars_vertex>`;
      shader.vertexShader = shader.vertexShader.replace(
        parsVertexString,
        parsVertexString + vertexPars
      );

      const mainVertexString = /* glsl */ `#include <displacementmap_vertex>`;
      shader.vertexShader = shader.vertexShader.replace(
        mainVertexString,
        mainVertexString + vertexMain
      );

      const mainFragmentString = /* glsl */ `#include <normal_fragment_maps>`;
      const parsFragmentString = /* glsl */ `#include <bumpmap_pars_fragment>`;
      shader.fragmentShader = shader.fragmentShader.replace(
        parsFragmentString,
        parsFragmentString + fragmentPars
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        mainFragmentString,
        mainFragmentString + fragmentMain
      );
    },
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

  lightFolder.add(dirLight, "intensity", 0, 2).name("Directional Intensity");
  lightFolder.add(ambientLight, "intensity", 0, 2).name("Ambient Intensity");
  lightFolder.addColor(dirLight, "color").name("Directional Color");
  lightFolder.addColor(ambientLight, "color").name("Ambient Color");

  lightFolder.close();

  const materialFolder = gui.addFolder("Material");
  materialFolder.add(material, "wireframe");
  materialFolder.open();

  materialFolder.add(material, "roughness", 0, 1);
  materialFolder.add(material, "metalness", 0, 1);

  // Add a new folder for bloom settings
  const bloomFolder = gui.addFolder("Bloom");
  const bloomParams = {
    strength: 1.24,
    radius: 0,
    threshold: 0.1,
  };

  bloomFolder.add(bloomParams, "strength", 0, 3).onChange(updateBloom);
  bloomFolder.add(bloomParams, "radius", 0, 1).onChange(updateBloom);
  bloomFolder.add(bloomParams, "threshold", 0, 1).onChange(updateBloom);

  function updateBloom() {
    bloomPass.strength = bloomParams.strength;
    bloomPass.radius = bloomParams.radius;
    bloomPass.threshold = bloomParams.threshold;
  }

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    1.24,
    0,
    0.1
  );
  addPass(bloomPass);

  useTick(({ timestamp, timeDiff }) => {
    const time = timestamp / 5000;
    material.userData.shader.uniforms.uTime.value = time;
  });
};

export default startApp;
