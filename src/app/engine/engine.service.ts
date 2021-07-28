import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core';

import * as THREE from 'three';
import { AnimationClip, AnimationMixer, HemisphereLight, LoopRepeat } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private light: HemisphereLight;

  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private frameId: number = null;

  private animations: THREE.AnimationClip[];
  private action: THREE.AnimationAction;
  private mixer: THREE.AnimationMixer;
  private clock = new THREE.Clock();

  public constructor(private ngZone: NgZone) { }

  public createScene(canvas: ElementRef<HTMLCanvasElement>) {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.setupRendererAndScene();
    this.setupCamera();
    this.setupLight();

    this.loadBoxModelFromFile();
  }

  private setupRendererAndScene() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
  }

  private loadBoxModelFromFile() {
    const loader = new GLTFLoader();
    loader.load('assets/box_open_close2.glb', (importedModel) => {
      console.log("scene loaded!, ", importedModel);

      this.animations = importedModel.animations;
      this.mixer = new THREE.AnimationMixer(importedModel.scene);

      this.scene.add(importedModel.scene);
      
      this.startBoxAnimation();
    }, () => { }, (error) => {
      console.error(error);
    });
  }

  private setupCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.x = 5.531509444292354;
    this.camera.position.y = 3.851383153444635;
    this.camera.position.z = 1.6028883532758373;
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  private setupLight() {
    this.light = new THREE.HemisphereLight(0x404040);
    this.light.intensity = 3;
    this.light.position.x = -5;
    this.light.position.y = -3;
    this.light.position.z = -1;

    this.scene.add(this.light);
  }

  public startBoxAnimation() {
    console.log("startBoxAnimation");

    this.mixer.clipAction(this.animations[0]).play();


    this.mixer.addEventListener("loop", (e) => {
      console.log("startBoxAnimation loop event. Action: ", e.action);

      if (e.action._clip.name === "box_open") {
        console.log("box_open done");

        this.mixer.clipAction(this.animations[0]).stop();
        this.mixer.clipAction(this.animations[2]).play();
      }

      if (e.action._clip.name === "empty_falling") {
        console.log("empty_falling done");

        this.mixer.clipAction(this.animations[2]).stop();
        this.mixer.clipAction(this.animations[1]).play();
      }

      if (e.action._clip.name === "box_close") {
        console.log("box_close done");

        this.mixer.clipAction(this.animations[1]).stop();
      }
    });
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    // IMPORTANT to enable the animation
    if (this.mixer) {
      this.mixer.update(0.01); // BETTER
      // this.mixer.update(0.1); // For debugging
      // this.mixer.update(this.clock.getDelta());
    }
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public printCameraInformation() {
    console.log("printCameraInformation: ", this.camera);
  }

  private findAnimationByName(gltf, name) {
    var result;
    gltf.animations.forEach((animation) => {
      if (animation.name === name) {
        result = animation
        return
      }
    })
    if (result == null) {
      console.error("animation: " + name + " cannot be found!")
    }
    return result
  }

  ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }
}
