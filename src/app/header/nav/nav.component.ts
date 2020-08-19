import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'nav[app-nav]',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  isMobileNavActive: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  onBurgerClicked() {
    this.isMobileNavActive = !this.isMobileNavActive;
  }

}
