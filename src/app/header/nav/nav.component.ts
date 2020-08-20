import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'nav[app-nav]',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  @HostBinding("attr.class") cssClass = "navbar has-shadow";
  isMobileNavActive: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  onBurgerClicked() {
    this.isMobileNavActive = !this.isMobileNavActive;
  }

}
