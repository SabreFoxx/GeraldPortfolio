import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appShowInfo]'
})
export class ShowInfoDirective {

  constructor(private element: ElementRef) {
    console.log(element.nativeElement);
  }

}
