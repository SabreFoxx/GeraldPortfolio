import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './home/home.component';
import { ShowInfoDirective } from './show-info.directive';


@NgModule({
  declarations: [HomeComponent, ShowInfoDirective],
  imports: [
    CommonModule,
  ],
  exports: [HomeComponent, ShowInfoDirective]
})
export class ProjectPageModule { }
