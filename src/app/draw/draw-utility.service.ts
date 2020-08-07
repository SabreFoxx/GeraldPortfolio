import { SimpleHeroArtDrawing } from './drawings/simple-hero-art';
import { SkillsDrawing } from './drawings/skills';
import { DrawComponent } from './draw.component';
import { Injectable } from '@angular/core';
import { HeroArtDrawing } from './drawings/hero-art';
import { Vector3, Scene, Geometry, LineBasicMaterial, Line } from 'three';

export interface Drawing {
  setup(base: DrawComponent);
  draw();
}

@Injectable({
  providedIn: 'root'
})
export class InstanceLoader<T> {
  constructor() {
    /* Initialize drawing prototypes, but keep them light and unloaded */
    (window as any).SkillsDrawing = SkillsDrawing;
    (window as any).SimpleHeroArtDrawing = SimpleHeroArtDrawing;
    (window as any).HeroArtDrawing = HeroArtDrawing;
  }

  getInstance(className: string): T {
    let instance = new window[className]();
    return <T>instance;
  }
}

/**
 * Used for debugging raycasts. draws a line on the raycast
 * @param tail tail of vector
 * @param head head of vector
 * @param scale should you scale?
 * @param scene scene to render in
 */
export function showLine(tail: Vector3, head: Vector3, scale: number, scene: Scene) {
  let direction = new Vector3;
  direction.subVectors(head, tail).normalize();

  let newHead = new Vector3;
  newHead.addVectors(tail, direction.multiplyScalar(scale));
  let geom = new Geometry;
  geom.vertices.push(tail);
  geom.vertices.push(newHead);
  let mat = new LineBasicMaterial({ color: 0xff0000 });
  let line = new Line(geom, mat);
  scene.add(line);
}