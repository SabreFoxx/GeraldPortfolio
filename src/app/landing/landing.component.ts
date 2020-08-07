import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DrawComponent } from '../draw/draw.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  @ViewChild('heroSection') heroArt: ElementRef;
  @ViewChild('heroDrawing') drawingComponent: DrawComponent;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // I want the dimension for this particular drawing <drawing #heroDrawing> that is inside <section #heroSection>,
    // to be based on the width and height of a <section class="hero is-fullheight">
    let [w, h] = [this.heroArt.nativeElement.clientWidth, this.heroArt.nativeElement.clientHeight];
    this.drawingComponent.forceUpdateDimension(w, h);
  }

  // Only trigerred, should the user resize the browser window
  // See (window:resize)="customResizer($event)" in landing.component.html
  customResizer(event) {
    setTimeout(() => { // Wait for our generic resizer to finish, then do this custom resize
      let [w, h] = [this.heroArt.nativeElement.clientWidth, this.heroArt.nativeElement.clientHeight];
      this.drawingComponent.forceUpdateDimension(w, h);
    }, 2); // Do it quickly, so it can't be noticed
  }

}