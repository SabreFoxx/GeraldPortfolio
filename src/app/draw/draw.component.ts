/**
 * Angular Threejs canvas component
 * @author Gerald Nnebe geraldnebs@gmail.com
 * @copyright (c) 2020 Gerald Nnebe
 */

import { Component, OnInit, Input, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { InstanceLoader, Drawing } from './draw-utility.service';
import { Scene, WebGLRenderer, OrthographicCamera, DirectionalLight } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
// SSAA Render Pass
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';

@Component({
  selector: 'drawing',
  templateUrl: './draw.component.html',
  styleUrls: ['./draw.component.scss']
})
export class DrawComponent implements OnInit {
  scene: Scene;
  camera: OrthographicCamera;
  renderer: WebGLRenderer;
  composer: EffectComposer; // Effect composer, needed to add post processing
  renderPass: RenderPass;
  ssaaRenderPass: SSAARenderPass;
  light: DirectionalLight;
  drawingInstance: Drawing;
  viewRatio: number[]; // 0 is for width, 1 is for height

  @ViewChild('drawFigure') el: ElementRef;
  @Input() drawingName: string = 'BasicDrawing'; // default
  @Input() viewportRatio: string = '1:1'; // default

  constructor(private loader: InstanceLoader<Drawing>, private ngRenderer: Renderer2) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true }); // alpha for transparent background
    // Increase density for better anti aliasing; Increase more than two, and it gets too sharp
    // this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio * 1.5);
    this.renderer.setClearColor(0x000000, 0); // To maintain our transparent background

    this.scene = new Scene();
    this.light = new DirectionalLight();
    this.light.name = "light";
    this.light.position.set(0.0, 0.0, 15.0);
    this.light.intensity = 3;
    this.scene.add(this.light);
  }

  ngOnInit(): void {
    // Set our internal viewport ratio, from the one supplied through the viewportRatio @Input()
    this.viewRatio = this.viewportRatio.split(":").map(x => +x); // .map() is for string to number
  
    // By now we've got our viewport ratio, so what parameters would we use for creating our
    // orthographic camera so it'll match? If the aspect ratio of our camera dimension doesn't match
    // that of the window or container containing it, we'll have a squished and/or squashed output.
    // Let's keep a fixed width of 100 for our camera. Therefore, left will be -50.0, and right 50.0.
    // This is because their absolute values add up to 100 our width.
    // Whatever we're using for top and bottom will also be added up. So, it a matter of dividing
    // 100 by 2, and our height by 2.
    // In order to do its work correctly, this method will go as far as chopping off parts of the
    // visible object.
    // [+]marker1 (I will refer to [+]marker1 later, so you can find this comment)
    // We will now compute the height:
    let height = this.ratioHeightFromWidth(this.viewRatio[0], this.viewRatio[1], 100);
    height /= 2;
    this.camera = new OrthographicCamera(-50.0, 50.0, height, -height, 0.0, 20.0);
    this.camera.position.z = 10.0;

    /**
     * Precaution:
     * Because of the way the orthographic camera is setup, i.e our -50.0 and 50.0 for left and right,
     * and because the vertical height of our camera varies, our scene objects should fill the width
     * to if side spaces are to be avoided, and extra objects can be added to the top and bottom part
     * of our scene, in case the camera will grow, so things will be visible and not space.
     * In other words, we can say that our camera and viewport setup, is width preserving.
     */
  }

  ngAfterViewInit(): void {
    this.el.nativeElement.style.paddingBottom = this.computePaddingBottomPercent();
    // Set the renderer size to be whatever size it's HTML container (our <figure> in this case) is,
    // in order to be responsive
    this.renderer.setSize(this.el.nativeElement.clientWidth, this.el.nativeElement.clientHeight);
    // Add the WebGLRenderer DOM element (an HTML canvas, really), to our <figure> container
    this.ngRenderer.appendChild(this.el.nativeElement, this.renderer.domElement);
    // Make our camera principled
    this.camera.updateProjectionMatrix();

    this.loader = new InstanceLoader<Drawing>();
    this.drawingInstance = this.loader.getInstance(this.drawingName);
    this.drawingInstance.setup(this);

    /* Our composer is now ready so it's possible to configure the chain of post-processing passes.
       These passes are responsible for creating the final visual output of the application.
       They are processed in order of their addition/insertion. In our example, the instance of
       RenderPass is executed first. RenderPass is normally placed at the beginning of the chain in
       order to provide the rendered scene as an input for the next post-processing step.
       In our case, SSAARenderPass is going to use these image data to apply a SSAA so we'll get
       even smoother anti aliasing.
    */
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer = new EffectComposer(this.renderer);
    this.ssaaRenderPass = new SSAARenderPass(this.scene, this.camera, 0x000000, 0);
    this.ssaaRenderPass.unbiased = true;
    this.ssaaRenderPass.sampleLevel = 3;

    this.composer.addPass(this.renderPass);
    // this.composer.addPass(this.ssaaRenderPass);

    this.drawingInstance.draw();
  }

  // Only trigerred, should the user resize the browser window
  onResize(event) {
    // event.target is the HTML element having (window:resize)="onResize($event)"
    // Let us get the width of the HTML container containing our WebGLRenderer DOM element (an HTML canvas, really)
    // We'll use this width to set the size of our WebGLRenderer, so it'll be responsive.
    // We're using a <figure> as the container.
    let [w, h] = [this.el.nativeElement.clientWidth, this.el.nativeElement.clientHeight];
    this.renderer.setSize(w, this.ratioHeightFromWidth(this.viewRatio[0], this.viewRatio[1], w));
    this.renderer.domElement.style.width = w;
    // this.renderer.domElementstyle.height = "Height has been set (using css) to be relative to the width, by using
    // absolute positioning on an expanded container, expanded using padding-bottom"

    // Others
    this.composer.setSize(w, this.ratioHeightFromWidth(this.viewRatio[0], this.viewRatio[1], w));
    this.camera.updateProjectionMatrix();
  }

  /**
   * Used, when updating the dimension in a nonconventional way e.g when not relying on the onResize event
   * @param width The new width
   * @param height The new height 
   */
  forceUpdateDimension(width, height) {
    // Compute the w value for our aspect ratio
    this.viewRatio[0] = width/height;
    // Since we're not relying on aspect ratios, but instead computing them,
    // we'll leave our height ratio at 1. Therefore, if our width ratio is less than one, then
    // our height is bigger (e.g landscape devices like phones). If our width is greater than
    // or equal to one, then our height is smaller (e.g portrait devices like PC)
    this.viewRatio[1] = 1;
    // Compute a reasonable height, instead of naively using the supplied one
    let newHeight = this.ratioHeightFromWidth(this.viewRatio[0], this.viewRatio[1], width);
    // Update styles and sizes
    this.el.nativeElement.style.width = width;
    this.el.nativeElement.style.paddingBottom = this.computePaddingBottomPercent();
    this.renderer.setSize(width, newHeight);
    this.renderer.domElement.style.width = width;
    this.composer.setSize(width, newHeight);

    // Adjust the camera
    // Search for [+]marker1 in this source to understand what I'm doing here
    let camVerticalExtent = this.ratioHeightFromWidth(this.viewRatio[0], this.viewRatio[1], 100);
    camVerticalExtent /= 2;
    this.camera.left = -50.0; // abs(-50.0) + 50.0 adds up to that 100 we used above
    this.camera.right = 50.0;
    this.camera.top = camVerticalExtent;
    this.camera.bottom = -camVerticalExtent;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Given the width, compute what the height will be, using an aspect ratio firstNumber:secondNumber
   */
  ratioHeightFromWidth(firstNumber: number, secondNumber: number, width: number): number {
    /*
      Example: Given a ratio 4:3 and a supplid width 16, what will be the height?
      Solution: How many times can 4 divide 16? that's 16/4=4. And 4 becomes our atomic.
      When we expand our atom 3 times, we get the height.
    */
    return (width / firstNumber) * secondNumber;
  }

  computePaddingBottomPercent() {
    // See draw.component.scss for why we set padding-bottom style
    return ((this.viewRatio[1] / this.viewRatio[0]) * 100) + "%";
  }

}
