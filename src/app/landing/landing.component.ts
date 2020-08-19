import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DrawComponent } from '../draw/draw.component';

const TOLLERANCE_ZONE = 120;

class AnimatableObject {
  distanceFromTop: number;

  constructor(private sectionLocation: ElementRef, private animationSequence: () => void) {
    this.distanceFromTop = sectionLocation.nativeElement.getBoundingClientRect().top;
  }

  orchestrateAnimation(): void {
    this.animationSequence();
  }
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  @ViewChild('heroSection') heroArt: ElementRef;
  @ViewChild('heroDrawing') drawingComponent: DrawComponent;
  @ViewChild('projectSection') projectSection: ElementRef;
  @ViewChild('skillSection') skillSection: ElementRef;
  sections: Map<string, AnimatableObject>;

  animateSkill = false;
  animateLanguage = false;

  constructor() {
    this.sections = new Map;
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event) {
    this.sections.forEach((animatableObject, key, sections) => {
      if (window.scrollY >= animatableObject.distanceFromTop + TOLLERANCE_ZONE) {
        animatableObject.orchestrateAnimation();
        sections.delete(key);
      }
    });
  }

  ngAfterViewInit(): void {
    /* Related to DrawingComponent */
    // I want the dimension for this particular drawing <drawing #heroDrawing> that is inside <section #heroSection>,
    // to be based on the width and height of a <section class="hero is-fullheight">
    // let [w, h] = [this.heroArt.nativeElement.clientWidth, this.heroArt.nativeElement.clientHeight];
    // this.drawingComponent.forceUpdateDimension(w, h);

    /* Related to scroll animations */
    this.sections.set("skillSection", new AnimatableObject(this.skillSection, () => {
      this.animateSkill = true;
    }));
  }

  // Only trigerred, should the user resize the browser window
  // See (window:resize)="customResizer($event)" in landing.component.html
  customResizer(event) {
    setTimeout(() => { // Wait for our generic resizer to finish, then do this custom resize
      let [w, h] = [this.heroArt.nativeElement.clientWidth, this.heroArt.nativeElement.clientHeight];
      this.drawingComponent.forceUpdateDimension(w, h);
    }, 2); // Do it quickly, so it can't be noticed
  }

  ngOnInit(): void {
  }

}