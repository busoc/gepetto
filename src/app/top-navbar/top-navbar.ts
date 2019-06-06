// Core elements
import { Component, OnInit, Input, Output, EventEmitter, ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Services
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';

// Models
import { User } from '../models/user';
import { Todo } from '../models/todo';
// import { IAlert } from '../services/notification.service';
import * as settingsFile from 'assets/settings/app-settings.json';
import { Message, Messages } from 'primeng/primeng';
// import { MessageModule } from 'primeng/message';
// import { Message } from 'primeng/components/common/api';
import { MessageService } from 'primeng/api';

import { ItemDetails } from '../item-details';

// import 'rxjs/Rx';
// import { Observable } from 'rxjs';
import * as Moment from 'moment';
import { settings } from 'cluster';

@Component({
  selector: 'top-navbar',
  entryComponents: [ ItemDetails ],
  templateUrl: './top-navbar.html',
  // inputs: ['counterValue'], // vb van hoe data van parent naar child component te krijgen
  // outputs: ['counterChange'] // vb van een functie te triggeren in een andere component
})
export class TopNavbar implements OnInit {
  jwt: string;
  decodedJwt: User;
  msgs: Message[] = [];
  alerts: Message[] = [];
  todos: Todo[] = [];
  myTasks: Todo[] = [];
  categories: SelectItem[];
  now: Date;
  public Payloads: any[] = []; // define object
  public wikilink: string = '';

  // openItems: number;

  @ViewChild('ItemDetailsAnchor', {read: ViewContainerRef}) ItemDetailsAnchor: ViewContainerRef;

  constructor(
    public router: Router,
    private _apiService: ApiService,
    public http: HttpClient,
    private route: ActivatedRoute,
    private _NotificationService: NotificationService,
    private _ApplicationService: ApplicationService,
    private resolver: ComponentFactoryResolver,
    private messageService: MessageService
  ) {
    //this.msgs = this._NotificationService.msgs;
    this.alerts = this._ApplicationService.alerts;
  }

  ngOnInit () {

    this.Payloads = settingsFile.ControlCenterSpecs.Payloads;
    this.now = Moment.utc().toDate();
    this.navigate(this.getRouteSettings());
    this.jwt = localStorage.getItem('gpt_token');
    this.decodedJwt = this.jwt && (<any> window).jwt_decode(this.jwt);
    if (!(this.decodedJwt.payload.positions.indexOf('uhb') > -1)) {//!this.decodedJwt.payload.positions.includes('uhb')) {
      this.wikilink = settingsFile.ControlCenterSpecs.wikiLinkInternal;
    } else {
      this.wikilink = settingsFile.ControlCenterSpecs.wikiLinkExternal;
    }

    this._ApplicationService.queryData({ type: 'todos' });
    this._ApplicationService.queryData( { type: 'categories'} );
    this._ApplicationService.queryData( { type: 'users'} );

    // hourglass/yamcs checks on app loading - only for busoc:
    if (settingsFile.ControlCenterSpecs.centerName === 'B.USOC') {
      this._apiService.getAPIData('events', '?dtstart=' + Moment.utc().subtract(16, 'hours').toDate().toISOString() + '&dtend=' + Moment.utc().add(16, 'hours').toDate().toISOString() + '&source[]=comms&category[]=ALL_KU_AVAIL')
      .subscribe(
          (resp) => {
              if (resp) {
                  if ((Moment.utc().unix() - Moment(resp[0].lastmod).unix()) > 86400 ) {
                    this._NotificationService.addAlert('error', 'OPTIMIS data is outdated (older then 24 hrs)!', true);
                  }                
              } else {
                this._NotificationService.addAlert('error', 'No OPTIMIS data found.', true);
              }
              },
          (err) => { console.log(err); },
          () => {}
      );
      this._apiService.testYamcsAvailibility()
      .subscribe(
        (resp) => {
          console.log(resp);
          let response: any = resp;
          if (response.status !== 200) {
            this._NotificationService.addAlert('error', 'Yamcs unreachable. Contact a GC!', true);
          }
        },
        (err) => { console.log(err); },
        () => {}
      );
    }


    // do dit eens weg... of verander
    this._ApplicationService.itemsUpdated // problem with this: when changing payload, also called with other categories value and todos vanish.
        .subscribe( (data) => {
          switch (data.type) {
            case 'todos':
              this._apiService.getAPIData('todos') // a bit redundant...
                  .subscribe(
                      (data) => { this.todos = data; this.myTodos(); },
                      (err) => { console.log(err); },
                      () => {  }
                  );
              break;
            case 'categories': this.categories = data.data;
              break;
            default:
          }
          });
  }

  myTodos() {
    this.myTasks = [];
    this.todos.forEach((todo) => {
      for (let key in todo.assignees) {
        if (todo.assignees.hasOwnProperty(key)) {
          if (todo.assignees[key] === this.decodedJwt.payload.initial && todo.status !== 'completed') {
            this.myTasks.push(todo);
          }
        }
      }
    });
  }

  Edit(todo) {
    this.ItemDetailsAnchor.clear();
    let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
    let dialogComponentRef = this.ItemDetailsAnchor.createComponent(dialogComponentFactory);
    dialogComponentRef.instance.itemType = 'todos';
    dialogComponentRef.instance.categories = this.categories;
    // dialogComponentRef.instance.events = this.events;
    // dialogComponentRef.instance.files = this.files;
    dialogComponentRef.instance.newItem = false;
    dialogComponentRef.instance.todo = todo;
    dialogComponentRef.instance.item_id = todo.uid;
    dialogComponentRef.instance.close.subscribe((event) => {
      dialogComponentRef.destroy();
      if (event.changed) {
        this._ApplicationService.queryData({ type: 'todos' });
      }
    });
  }

  navigate(path) {
    this.router.navigate([{outlets: { mainnav: path }}], {relativeTo: this.route});
  }

  logout() { // werkt toch niet 100% zenne. zeker niet als je een 401 krijgt doorheen u programma
    // localStorage.clear();
    this.router.navigate(['login']);
    localStorage.clear();
  }

  private getRouteSettings() {
    if (localStorage.getItem('gpt settings')) {
        try {
            let temp  = JSON.parse(localStorage.getItem('gpt settings'));
            if (temp.route) {
                return temp.route;
            } else { // in case of first time
                return 'events';
            }
        } catch (e) { console.log(e); }
    } else {
        return [];
    }
}

}
