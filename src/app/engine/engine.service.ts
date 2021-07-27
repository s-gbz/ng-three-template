import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core';

import * as THREE from 'three';
import { AnimationClip, AnimationMixer, LoopRepeat } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/js/controls/OrbitControls.js';

@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;

  private cube: THREE.Mesh;
  private frameId: number = null;

  private animations: THREE.AnimationClip[];
  private action: THREE.AnimationAction;
  private mixer: THREE.AnimationMixer;
  private clock = new THREE.Clock();

  public constructor(private ngZone: NgZone) {
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public loadScene(canvas: ElementRef<HTMLCanvasElement>) {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();

    const loader = new GLTFLoader();

    loader.load('assets/box_open_close2.glb', (importedModel) => {
      console.log("scene loaded!, ", importedModel);

      this.animations = importedModel.animations;

      this.mixer = new THREE.AnimationMixer(importedModel.scene);
      this.action = this.mixer.clipAction(importedModel.animations[0]);
      console.log("mixer ", this.mixer);

      this.startBoxAnimation();


      // let mixer = new AnimationMixer(importedModel.scene);
      // let loading = mixer.clipAction(this.getAnimation(importedModel, "box_open"));
      // loading.loop = LoopRepeat;
      // loading.reset().play();
      this.scene.add(importedModel.scene);

    }, () => { }, (error) => {
      console.error(error);
    });

    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.z = 10;
    this.scene.add(this.camera);

    // soft white light
    this.light = new THREE.AmbientLight(0x404040);
    console.log("light: ", this.light.intensity);

    this.light.position.z = 10;
    this.light.intensity = 10;
    this.scene.add(this.light);

    // const controls = new OrbitControls( this.camera, this.renderer.domElement );
  }

  public startBoxAnimation() {
    console.log("startBoxAnimation");
    // console.log("action ", this.action);

    // this.action.play();

    // this.mixer.clipAction(this.animations[2]).reset();
    // this.mixer.clipAction(this.animations[1]).reset();
    // this.mixer.clipAction(this.animations[0]).play().crossFadeTo(this.mixer.clipAction(this.animations[1]), 1, false);
    this.mixer.clipAction(this.animations[0]).play();


    this.mixer.addEventListener("loop", (e) => {
      console.log("startBoxAnimation loop event. Action: ", e.action);
      // console.log("box_open done ", e.action._clip.name);

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
        // this.mixer.clipAction(this.animations[1]).play();
      }
    });
    // this.mixer.clipAction(this.animations[1]).reset();

    // this.animations.forEach((clip) => {
    //   console.log(clip);

    //   this.mixer.clipAction(clip).play();
    // });
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

  private getAnimation(gltf, name) {
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
}
