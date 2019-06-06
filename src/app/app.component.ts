/**
 * Angular 2 decorators and services
 */
import {
  Component,
  ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';

/**
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'gpt-app',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './app.component.html',
  // host: {'(window:keydown)': 'hotkeys($event)'}
})
export class AppComponent {

  constructor(
    public router: Router
  ) {}

  // eventemit it to tasks/event component
  // hotkeys(event) {
  //   if (event.keyCode === 78) {
  //       console.log('test');
  //   }
  // }

}