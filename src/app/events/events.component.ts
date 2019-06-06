import { Component, OnInit, EventEmitter, ComponentFactoryResolver, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Event } from '../models/event';
import { User } from '../models/user';
import { File } from '../models/file';
import { Todo } from '../models/todo';
import { Settings } from '../models/settings';

import { Category } from '../models/category';
import { ItemDetails } from '../item-details';
import { FormGroup, FormControl, FormBuilder, FormsModule } from '@angular/forms';
// import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Query } from '../query';

import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';
// import { AppointmentsService } from '../services/appointmentsservice';
// import { AuthenticationService } from '../services/authenticationservice';

import { MenuItem, AutoCompleteModule, CalendarModule, Header, Footer } from 'primeng/primeng';

import * as Moment from 'moment';
import * as settingsFile from 'assets/settings/app-settings.json';



// Google
declare const gapi: any;

@Component({
  selector: 'events',
  entryComponents: [ ItemDetails ], // can also go in module if everyone makes use of it
  templateUrl: './events.component.html',
})
export class EventsComponent implements OnInit {


	// appointments: Array<string>;
	// authenticationService: AuthenticationService;
	// appointmentService: AppointmentsService;

  // jwt: string;
  // decodedJwt: User;
  // response: string;
  // api: string;
  private eventColumns: any[];
  // events: Event[] = [];
  events: Event[] = [];
  eventHistory: Event[] = [];
  // calendarEvents: Event[] = [];

  files: File[] = [];
  fileReader: FileReader;
  base64Encoded: string;
  file_result: File;
  fileName: string;

  cols: any[];
  selectedEvent: Event;
  selectedPastEvent: Event;
  event: Event;
  displayDetailDialog: boolean;
  displayHistoryDialog: boolean;
  newEvent: boolean = false;
  fromCalendar: boolean = false;
  items: MenuItem[];

  cats: any[];
  caters: any[]; // Category[] = [];
  test: any;
  categoriesFilter: any[];

  // for categories
  categories: SelectItem[];
  categoriesValue: SelectItem[];
  categoriesLabel: SelectItem[];
  MultiSelectCategories: SelectItem[];
  public SelectedEventsCategories: string[]; // SelectItem[];

  public errorMessage: string;
  errorType: string;

  public event_id: number;

  private settings: any = {
    eventsFilter: [],
  }

  categoryChanged = new FormControl();

  dateStart: Date;
  dateEnd: Date;
  now: Date;
  cates: any[];

  header: any;

  defaultEventQuery: any;

  searchCategory: string[];

  private clientID = '941889093811-h4gqit2jjfc9d9n3cq4ubifgd4l3cpt4.apps.googleusercontent.com';
  private calendarID= '50jcsehmtgugjlg33o2h69dg5s@group.calendar.google.com';
  private userTimeZone = 'Paris';
  private scopes = 'https://www.googleapis.com/auth/calendar';

  todos: Todo[] = [];

  @ViewChild('ItemDetailsAnchor', {read: ViewContainerRef}) ItemDetailsAnchor: ViewContainerRef;

  constructor(
    public router: Router,
    public http: HttpClient,
    private _apiService: ApiService,
    private formBuilder: FormBuilder,
    // private parseFormatter: NgbDateParserFormatter,
    public notificationService: NotificationService,
    private _ApplicationService: ApplicationService,
    private resolver: ComponentFactoryResolver,
    

    // private EventDetails: EventDetails,
    // appointmentService: AppointmentsService, authenticationService: AuthenticationService
    ) {
    //   gapi.load('auth2', function () {
    //     gapi.auth2.init()
    //   }
    // );


      // this.appointments = ['please refresh view'];
      // this.authenticationService = authenticationService;
      // this.appointmentService = appointmentService;
    }

  ngOnInit() {

    this.eventColumns = [
      { field: 'dtstart', header: 'Start'},
      { field: 'dtend', header: 'End' },
      { field: 'summary', header: 'Summary' },
      { field: 'categories', header: 'Categories' },
      { field: 'lastmod', header: 'Last modified' },
    ];

    this.items = [
          {label: ' Edit', icon: 'fa fa-pencil-square-o', command: (event) => this.Edit(this.selectedEvent, false)},
          // {label: ' Duplicate', icon: 'fa-clone', command: (event) => this.createItem(Object.assign({}, this.selectedEvent))}, // verander code want saved direct.. moet gewoon pop up openen met details van vorige
          {label: ' Delete', icon: 'fa fa-trash-o', command: (event) => this.Delete()},
    ];

    // for calendar view:
    this.header = {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay,listMonth'
    };

    try {
      this.SelectedEventsCategories = this._ApplicationService.getSettings().calendarCategories;
      this.cats = this.SelectedEventsCategories;
      if (!this.SelectedEventsCategories) {
        this.SelectedEventsCategories = settingsFile.ControlCenterSpecs.Payloads[0].name; // default
      }
    } catch(err) {
      this.SelectedEventsCategories = settingsFile.ControlCenterSpecs.Payloads[0].name; // default
      this.categoriesChanged(this.SelectedEventsCategories);
    }

    // set initial dates - mss laten setten door topnavbar? -> moet zijn wat er in u view staat he
    // this.dateStart = Moment.utc().subtract(100, 'days').toDate();
    // console.log(Moment.utc());
    // this.dateEnd = Moment.utc().add(600, 'days').toDate();
    // this._ApplicationService.setTimeWindow(this.dateStart, this.dateEnd);
    // this.dateStart = this._ApplicationService.getTimeWindow().start;
    // this.dateEnd = this._ApplicationService.getTimeWindow().end;

    // temp fix for pschedule that is broken:
    this.dateStart = Moment.utc().subtract(5, 'days').toDate();
    this.dateEnd = Moment.utc().add(10, 'days').toDate();
    this._ApplicationService.queryData({ type: 'events', categories: this.SelectedEventsCategories, start: this.dateStart, end: this.dateEnd });


    this.defaultEventQuery = {
      type: 'events',
      start: this.dateStart,
      end: this.dateEnd,
      // categories: [this._ApplicationService.getPayload()], // get it from settings
    };
    this._ApplicationService.queryData( { type: 'categories'} );
    // heeft geen zin he:
    this.categories = [...this._ApplicationService.getCategories()]; // in api service onstartup he...


    // $('#calendar').fullCalendar ({
    //   googleCalendarApiKey: 'mlhJ7oadjS0nX7XdrS1DG-Gx',
    //     events: {
    //       googleCalendarId: 'uunb9cv1v8q5o6j7aule66ukno@group.calendar.google.com',
    //     }
    // });


    // CORS....
    // this._apiService.getAlfrescoData()
    //   .subscribe((data) => {console.log(data); },
    //   (err) => { console.log(err); },
    //   () => { }
    // );

    // $('#calendar').fullCalendar({
    //     googleCalendarApiKey: '586478867644-gvrn498iao3uuu92r13ps13iaaqk99nb.apps.googleusercontent.com',
    //     events: {
    //         googleCalendarId: 'uunb9cv1v8q5o6j7aule66ukno@group.calendar.google.com',
    //         className: 'gcal-event'
    //     }
    // });

    // subscribe to events created by other services/components
    // this._ApplicationService.payloadChange
    //     .subscribe( (data) => { this._ApplicationService.queryData( { type: 'events', categories: [this._ApplicationService.getPayload()], start: this.dateStart, end: this.dateEnd }); });
    // this._ApplicationService.timeWindowChange
    //     .subscribe( (data) => { this._ApplicationService.queryData({ type: 'events', categories: [this._ApplicationService.getPayload()], start: this.dateStart, end: this.dateEnd }); });
    this._ApplicationService.itemsUpdated
        .subscribe( (data) => {
          switch (data.type) {
            case 'events': this.events = data.data;
              
              if (!this.SelectedEventsCategories) {
                this.events = data.data;
              } else {
                this.events = [];
                data.data.forEach((event) => { // filter events
                  if ( this.SelectedEventsCategories.every((elem) => event.categories.sort().indexOf(elem) > -1)) {
                      this.events.push(event);
                  }
                });
              }
              break;
            case 'todos': this.todos = data.data;
              break;
            case 'files': this.files = data.data;
              break;
            case 'categories':
              this.categories = [...data.data];
            default:
          }
          });
  }

  private handleAuthClick(event) {
    gapi.auth.authorize({client_id: this.clientID, scope: this.scopes, immediate: false}, this.handleAuthResult);
    return false;
  }

 private handleAuthResult(authResult) {
      console.log(authResult);
      let authorizeButton = document.getElementById('authorize-button');
      if (authResult && !authResult.error) {
          // authorizeButton.style.visibility = 'hidden';
          gapi.client.load('calendar', 'v3', () => {
              // let request = gapi.client.calendar.calendarList.list();
              let request = gapi.client.calendar.events.list({
                calendarId: 'uunb9cv1v8q5o6j7aule66ukno@group.calendar.google.com',
                timeMin: (new Date()).toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 10,
                orderBy: 'startTime'
              });
              request.execute((resp) => {
                console.log(resp);
              });
              // request.execute((resp) => {
              //     $.each( resp.items, ( key, value ) => {
              //         console.log(resp.items[key].id);
              //     });
              // });
              // let request1 = gapi.client.calendar.events.list({
              //     calendarId: 'primary',
              //     timeMin: '2017-03-23T04:26:52.000Z' //Suppose that you want get data after 23 Dec 2014
              //   });
              // request1.execute((resp) => {
              //     $.each( resp.items, ( key, value ) => {
              //         console.log(resp.items[key].id); // here you give all events from google calendar
              //     });
              // });
          });
      } else {
          authorizeButton.style.visibility = '';
          authorizeButton.onclick = this.handleAuthClick;
      }
  }

   private makeApiCall() {
      gapi.client.load('calendar', 'v3', function() {
          let request = gapi.client.calendar.calendarList.list();
          request.execute(function(resp){
              $.each( resp.items, function( key, value ) {
                  console.log(resp.items[key].id);
              });
          });
          let request1 = gapi.client.calendar.events.list({
              'calendarId': 'primary',
              'timeMin': '2017-03-23T04:26:52.000Z'//Suppose that you want get data after 23 Dec 2014
            });
          request1.execute(function(resp){
              $.each( resp.items, function( key, value ) {
                  console.log(resp.items[key].id);// here you give all events from google calendar
              });
          });
      });
    }

  private googleLogin() { // logged u automatisch in op basis van user id in template (moet anders he)
      let googleAuth = gapi.auth2.getAuthInstance();
      googleAuth.then(() => {
         googleAuth.signIn({scope: 'profile email'}).then(googleUser => {
            console.log(googleUser.getBasicProfile());
         });
      });
   }

  // private onSignIn (googleUser) {
  //   console.log('hallo');
  //   let profile = googleUser.getBasicProfile();
  //   console.log(profile.getName());
  // }

  private signOut() {
    let auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      console.log('User signed out.');
    });
  }

  private doSomething() {
      return new Promise((resolve, reject) => {
        var request = gapi.client.calendar.events.list({
          'calendarId': 'primary',
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 10,
          'orderBy': 'startTime'
        });

        request.execute((resp) => {
          var appointments = [];
      var events = resp.items;
      console.log(events);
      var i;
          if (events.length > 0) {
        for (i = 0; i < events.length; i++) {
          var event = events[i];
          var when = event.start.dateTime;
          if (!when) {
            when = event.start.date;
          }
          appointments.push(event.summary + ' (' + when + ')')
        }
      } else {
        appointments.push('No upcoming events found.');
      }
      resolve(appointments);
        });
    });

  }

  // not used now
  private queryEvents(query) {
    query.type = 'events';
    // console.log(query);
    this._ApplicationService.queryData(query);
  }

  private categoriesChanged(cats) {
    // can be deleted:
    // localStorage.removeItem('events_settings');
    // localStorage.setItem('events_settings', JSON.stringify(cats));

    console.log(cats);
    let allSettings: Settings = new Settings();
    allSettings = this._ApplicationService.getSettings();
    allSettings.calendarCategories = cats;
    console.log(allSettings);
    try { localStorage.setItem('gpt settings', JSON.stringify(allSettings));
    } catch (e) {console.log(e); }
    this._ApplicationService.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, allSettings ); // { settings: { timelineBands: bandsCopy }});
    let categories = '';
    cats = cats.sort();
    this.cats = cats;
    if (!cats[0]) {
      this.events = [];
    } else {
      this._ApplicationService.queryData({ type: 'events', categories: cats, start: this.dateStart, end: this.dateEnd });
    }
  }

  private addEventFromCalendar(event) {
    // console.log(event);
    console.log(this.SelectedEventsCategories);
    this.newEvent = true;
    this.event = new Event(Moment.utc().toDate(), Moment.utc().toDate(), Moment.utc().toDate(), Moment.utc().toDate(), 'scheduled', this.SelectedEventsCategories);
    if (event.date) { // todo: add hour in stead of 'now'
      console.log(event.date);
      event.date = event.date.hours(Moment.utc().hours()).minutes(Moment.utc().minutes());
      this.event.dtstart = event.date.toDate();
      this.event.dtend = event.date.toDate();
      this.event.rtstart = event.date.toDate();
      this.event.rtend = event.date.toDate();
    }
    console.log(this.event);
    this.Edit(this.event, true, false);
  }

  private Edit(event: any, newItem: boolean, duplicate: boolean = false) {

    if (newItem && duplicate) { // when + clicked on table
         event = new Event(Moment.utc().toDate(), Moment.utc().toDate(), Moment.utc().toDate(), Moment.utc().toDate(), 'scheduled', [this._ApplicationService.getPayload()]);
    }
    this.ItemDetailsAnchor.clear();
    let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
    let dialogComponentRef = this.ItemDetailsAnchor.createComponent(dialogComponentFactory);
    dialogComponentRef.instance.itemType = 'events';
    // dialogComponentRef.instance.categories = this.categoriesLabel;
    // dialogComponentRef.instance.events = this.events;
    // dialogComponentRef.instance.files = this.files;
    dialogComponentRef.instance.newItem = newItem;
    dialogComponentRef.instance.event = event;
    dialogComponentRef.instance.item_id = event.uid;
    dialogComponentRef.instance.close.subscribe((event) => {
      dialogComponentRef.destroy();
      if (event.changed) {
        // categories: moeten u settings zijn
        this._ApplicationService.queryData({ type: 'events', categories: this.cats, start: this.dateStart, end: this.dateEnd });
      }
    });
  }

  private editEventFromCalendar(e) {
    this.newEvent = false;
    this.fromCalendar = true;
    // calendar gives moment dates...
    // remove calEvent crap:
    delete e.calEvent.source;
    delete e.calEvent.className;
    delete e.calEvent._start;
    delete e.calEvent.allDay;
    delete e.calEvent._allDay;
    delete e.calEvent._end;
    delete e.calEvent._id;
    console.log(e.calEvent);
    this.event = Object.assign({}, e.calEvent);
    // console.log(this.event);
    this.event_id = this.event.uid;
    // this.editEvent();
    this.Edit(this.event, false);
  }

  private Delete () {
    if (confirm('Are you sure you want to delete this item?')) {
      this._apiService.deleteAPIData('events', this.selectedEvent.uid)
        .subscribe(
          (data) => { },
          (err) => { console.log(err); },
          () => { this._ApplicationService.queryData({ type: 'events', categories: this.SelectedEventsCategories, start: this.dateStart, end: this.dateEnd }); }
        );
    } else { }
  }

  private createItem(event) {
      this._apiService.createAPIData('events', event)
      .subscribe(
          (response) => { },
          (err) => { console.log(err); },
          () => { this._ApplicationService.queryData({ type: 'events', categories: this.SelectedEventsCategories, start: this.dateStart, end: this.dateEnd }); }
        );
      return null;
  }

  private updateItem(id, item) {
    this._apiService.updateAPIData('events', id, item)
      .subscribe(
        (response) => { console.log(response); },
        (err) => { console.log(err); }, // this._apiService.returnCodes(err); },
        () => { this._ApplicationService.queryData({ type: 'events', categories: this.SelectedEventsCategories, start: this.dateStart, end: this.dateEnd }); }
      );
  }

  private Move(event, extended) {
    console.log(event);
    let start: Date;
    let end: Date;
    if (extended) {
      end = Moment(event.event.dtend).add(event.delta._milliseconds, 'milliseconds').add(event.delta._days, 'days').add(event.delta._months, 'months').toDate();
      start = Moment(event.event.dtstart).toDate();
    } else {
      start = Moment(event.event.dtstart).add(event.delta._milliseconds, 'milliseconds').add(event.delta._days, 'days').add(event.delta._months, 'months').toDate();
      end = Moment(event.event.dtend).add(event.delta._milliseconds, 'milliseconds').add(event.delta._days, 'days').add(event.delta._months, 'months').toDate();
    }

    delete event.event.source;
    delete event.event.className;
    delete event.event._id;
    delete event.event.allDay;
    delete event.event._allDay;
    delete event.event._end;
    delete event.event._start;
    let updatedEvent: Event = Object.assign({}, event.event);
    updatedEvent.dtstart = start;
    updatedEvent.dtend = end;
    updatedEvent.rtstart = start;
    updatedEvent.rtend = end;
    console.log(updatedEvent);
    this.updateItem(updatedEvent.uid, updatedEvent);
  }

  private eventHoover(event) {
    // console.log(event.calEvent.dtstart + event.calEvent.dtend);
  }

  private loadEventsData() {
    this._ApplicationService.queryData({ type: 'events', categories: this.SelectedEventsCategories, start: this.dateStart, end: this.dateEnd });
  }

  private loadEvents(event) { // ask nico to return events that have a start > < end. so that continues events are also displayed. subtract will not be necessary then...
    // if (localStorage.getItem('gpt settings')) {
    //      let settings: Settings = new Settings();
    //      settings = JSON.parse(localStorage.getItem('gpt settings'));
    //      this.SelectedEventsCategories = settings.calendarCategories;
    // };
    console.log(this.SelectedEventsCategories);
    this.dateStart = event.view.start.toDate();
    this.dateEnd = event.view.end.toDate();

    this._ApplicationService.queryData({ type: 'events', categories: this.SelectedEventsCategories, start: this.dateStart, end: this.dateEnd });
  }

  private refreshAppointments() {
    /*
      * loading the appointments is done asychronously. the service's loadAppointments() method
      * returns a Promise that provides access to the newly loaded set of appointments. Updating
      * the array of appointments triggers angular's one-way-binding between the field and the 
      * widget.
      */
  //   this.appointmentService.loadAppointments().then((newAppointments) => {
  //     // clean the array of existing appointments
  //     this.appointments.splice(0, this.appointments.length);
  //     // copy all new items to the array of existing appointments
  //     this.appointments.push.apply(this.appointments, newAppointments);
  //     console.log('displaying ' + this.appointments.length + ' appointments')
  //   });
  }

}
