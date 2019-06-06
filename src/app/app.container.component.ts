import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TopNavbar } from './top-navbar';

@Component({
  selector: 'container-gpt-app',
  templateUrl: './app.container.component.html'
})

export class ContainerApp {
  constructor(public router: Router) {}
}
