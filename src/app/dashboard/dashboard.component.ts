import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  json = Symbol('alternative toJSON');

  constructor() {
    const character = {
      name: "character name",
      ['gen' + 'der']: "female",
      [this.json]: () => ({
        key: 'value'
      })
    }
    console.log(this.stringify(character))

    console.log(character)

  }

  stringify(target) {
    if (this.json in target) {
      return JSON.stringify(target[this.json]())
    }
    return JSON.stringify(target)
  }

  ngOnInit(): void {
  }

}
