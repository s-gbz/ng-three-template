import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core';

import * as THREE from 'three';
import { AnimationClip, AnimationMixer, HemisphereLight, LoopOnce, LoopRepeat, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private importedModel;

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

  private textDropAction: THREE.AnimationAction;
  textMixer: THREE.AnimationMixer;

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
      this.importedModel = importedModel;

      this.animations = importedModel.animations;
      this.mixer = new THREE.AnimationMixer(importedModel.scene);

      this.scene.add(importedModel.scene);
      this.createTextWithTextGeometry();

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
    const boxOpen = this.mixer.clipAction(this.animations[0]);
    const boxClose = this.mixer.clipAction(this.animations[1]);
    const emptyFall = this.textDropAction;

    // boxOpen.clampWhenFinished = true;
    // boxClose.clampWhenFinished = true;
    // emptyFall.clampWhenFinished = true;

    // boxOpen.loop = LoopOnce;
    // boxClose.loop = LoopOnce;
    // emptyFall.loop = LoopOnce;

    boxOpen.play();

    this.mixer?.addEventListener("loop", (e) => {
      console.log("startBoxAnimation loop event. Action: ", e.action);

      if (e.action._clip.name === "box_open") {
        console.log("box_open done");

        // boxOpen.paused = true;
        boxOpen.stop();
        emptyFall.play();
        this.textDropAction.play();
      }

      if (e.action._clip.name === "empty_falling") {
        console.log("empty_falling done");

        emptyFall.stop();
        boxClose.play();
      }

      if (e.action._clip.name === "box_close") {
        console.log("box_close done");

        boxClose.stop();
      }
    });
  }

  public createTextWithTextGeometry() {
    const loader = new THREE.FontLoader();

    loader.load('assets/helvetiker_regular.typeface.json', (font) => {

      const textGeometry = new THREE.TextGeometry('Hello World!', {
        font: font,
        size: 0.5,
        height: 0.5,
      });

      const textMesh = new Mesh(textGeometry);
      this.textMixer = new AnimationMixer(textMesh);
      this.textDropAction = this.textMixer.clipAction(this.animations[2]);


      console.log("textMesh ", textMesh);
      console.log("textMixer ", this.textMixer);
      console.log("textDropAction ", this.textDropAction);


      this.scene.add(textMesh);
    });
  }


  public printCameraInformation() {
    console.log("printCameraInformation: ", this.camera);
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
    this.mixer?.update(0.02); // BETTER
    this.textMixer?.update(0.02);
    // this.mixer.update(0.1); // For debugging
    // this.mixer.update(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }
}
