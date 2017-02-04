import {bootstrap}        from 'angular2/platform/browser';
import {provide}          from 'angular2/core';
import {
  ROUTER_PROVIDERS
} from 'angular2/router';

import {LocationStrategy, HashLocationStrategy} from 'angular2/platform/common';

import {AppComponent}     from './app.component';

bootstrap(AppComponent, [
  ROUTER_PROVIDERS,
  provide(LocationStrategy, {useClass: HashLocationStrategy}) // During developmennt due to the refreshes.
]);

console.log('%c Hi, my name is Scooby', 'background: #222; color: #fff; font-size: 36px;');
