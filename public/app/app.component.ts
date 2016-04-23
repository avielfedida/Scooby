import {Component}                      from 'angular2/core';
import {RouteConfig, ROUTER_DIRECTIVES} from 'angular2/router';

import {Treatment}                      from './treatment.component';

@Component({
  selector: 'app',
  template: '<router-outlet></router-outlet>',
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  {
    path: '/',
    name: 'Treatment',
    component: Treatment
  }
])
export class AppComponent {}
