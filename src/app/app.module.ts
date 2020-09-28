import { ProjectPageModule } from './../project-page/project-page.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { HeaderComponent } from './header/header.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { CreateComponent } from './create/create.component';
import { NavComponent } from './header/nav/nav.component';
import { GeneralComponent } from './general/general.component';
import { LandingComponent } from './landing/landing.component';
import { FooterComponent } from './footer/footer.component';
import { DrawComponent } from './draw/draw.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    LoginComponent,
    HeaderComponent,
    SideMenuComponent,
    CreateComponent,
    NavComponent,
    GeneralComponent,
    LandingComponent,
    FooterComponent,
    DrawComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ProjectPageModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
