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
import { Observable, Subscription } from 'rxjs';
//import { Observable } from 'rxjs/Observable';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';
import { TimelineService } from '../services/timeline.service';

// import { AppointmentsService } from '../services/appointmentsservice';
// import { AuthenticationService } from '../services/authenticationservice';

import { MenuItem, AutoCompleteModule, CalendarModule, ScheduleModule, Header, Footer, PanelModule } from 'primeng/primeng';

import * as Moment from 'moment';

@Component({
  selector: 'events',
  // entryComponents: [ ItemDetails ], // can also go in module if everyone makes use of it
  templateUrl: './countdown.component.html',
})
export class CountdownComponent implements OnInit {

  // private countdown: string = '';
  private kuCountdown: string = '';
  private sCountdown: string = '';
  private saaCountdown: string = '';
  private daynightCountdown: string = '';
  private eventCountdown: string = '';
  public band: any;
  private upcomingEvents: Event[] = [];
  private selectedEvent: Event;
  private difference: number;
  private eventAlert: boolean = false;
  private useEventEnd: boolean = false;

  private timerSubscription: Subscription;

  //@ViewChild('ItemDetailsAnchor', {read: ViewContainerRef}) ItemDetailsAnchor: ViewContainerRef;

  constructor(
    public router: Router,
    public http: HttpClient,
    private _apiService: ApiService,
    private formBuilder: FormBuilder,
    // private parseFormatter: NgbDateParserFormatter,
    public notificationService: NotificationService,
    private _ApplicationService: ApplicationService,
    private resolver: ComponentFactoryResolver,
    private _TimelineService: TimelineService,

    ) {
    }

  ngOnInit() {
    this.getCountdownData();
    // Observable.interval(1000 * 3600).subscribe((x) => {
    //     this.getCommsData();
    // });
  }

//   private checkAlerts() {
//       if (!this.eventAlert) {
//         document.getElementById('alert').pause();
//       }
//   }

  private getCountdownData () {
    let hourglassQueries: any = [];
    hourglassQueries = [{
        queries: [],
        events: []
    }]; // can it not all go in one request..?
    hourglassQueries[0].queries.push('/events/?dtstart=' + Moment.utc().subtract(600, 'minutes').toISOString() + '&dtend=' + Moment.utc().add(1000, 'minutes').toISOString() + '&source[]=comms&category[]=ALL_KU_AVAIL&category[]=ALL_S_AVAIL');
    hourglassQueries[0].queries.push('/events/?dtstart=' + Moment.utc().subtract(600, 'minutes').toISOString() + '&dtend=' + Moment.utc().add(10000, 'minutes').toISOString() + '&source[]=comms&category[]=SAA');
    hourglassQueries[0].queries.push('/events/?dtstart=' + Moment.utc().subtract(600, 'minutes').toISOString() + '&dtend=' + Moment.utc().add(1000, 'minutes').toISOString() + '&source[]=comms&category[]=DayNight');   
    hourglassQueries[0].queries.push('/events/?dtstart=' + Moment.utc().subtract(1, 'minutes').toISOString() + '&dtend=' + Moment.utc().add(2000, 'minutes').toISOString() + '&category[]=' + this._ApplicationService.getPayload());   
    console.log(hourglassQueries);
    this._apiService.getHourglassData(hourglassQueries)
    .subscribe(
        (resp) => {
            console.log(resp);
            let band = {
                type: 'CommsBand',
                events: resp[0]
            };
            this.Countdown(band);
            band = {
                type: 'SaaBand',
                events: resp[1]
            }
            this.Countdown(band);
            band = {
                type: 'DayNightBand',
                events: resp[2]
            }
            this.Countdown(band);
            this.upcomingEvents = resp[3];
        },
        (err) => { console.log(err); },
        () => { }
    )
  }

  private calculateEventCountdown () {

    let timer = Observable.timer(1000, 1000);
    this.timerSubscription = timer.subscribe((t) => { // bad casting: expects number
        if (this.useEventEnd) {
            this.difference =  Math.round((this.selectedEvent.dtend - Moment().utc().toDate()) / 1000);
            this.eventCountdown = this.convertToTime(Math.round((this.selectedEvent.dtend - Moment().utc().toDate()) / 1000)).toString() + ' to ' + this.selectedEvent.summary;
        } else {
            this.difference =  Math.round((this.selectedEvent.dtstart - Moment().utc().toDate()) / 1000);
            this.eventCountdown = this.convertToTime(Math.round((this.selectedEvent.dtstart - Moment().utc().toDate()) / 1000)).toString() + ' to ' + this.selectedEvent.summary;
        }
        if (this.difference < 120 && this.eventAlert) {
            // document.getElementById('alert').play();
        }
        // this.eventCountdown = this.convertToTime(Math.round((this.selectedEvent.dtstart - Moment().utc().toDate()) / 1000)).toString() + ' seconds to ' + this.selectedEvent.summary;
    });
  }

  private Countdown(band) {
    // if (this.timerSubscription) {
    //     this.timerSubscription.unsubscribe();
    // }
    let timer = Observable.timer(1000, 1000);
    switch (band.type) {
        case 'Events':
            // this.timerSubscription = timer.subscribe((t) => {
            // });
            break;
        case 'SaaBand':
            this.timerSubscription = timer.subscribe((t) => {
                band.events.push({
                    start: Moment().utc().toDate(),
                    summary: 'now'
                });
                try {
                    this._ApplicationService.sortObj(band.events, 'start');
                    for (let i = band.events.length - 1; i >= 0; i--) {
                        if (band.events[i].summary === 'now' && band.events[i].start > band.events[i-1].start && band.events[i].start < band.events[i-1].stop) {
                            this.saaCountdown = this.convertToTime(Math.round((band.events[i - 1].stop - band.events[i].start) / 1000)).toString() + ' to SAA EXIT';
                        };
                        if (band.events[i].summary === 'now' && band.events[i].start > band.events[i-1].stop && band.events[i].start < band.events[i+1].start) {
                            this.saaCountdown = this.convertToTime(Math.round((band.events[i + 1].start - band.events[i].start) / 1000)).toString() + ' to SAA ENTRY';
                        };
                    };
                    for (let i = band.events.length - 1; i >= 0; i--) {
                        if (band.events[i].summary === 'now') {
                            band.events.splice(i, 1);
                        }
                    };
                } catch(err) {
                    this.saaCountdown = 'error';
                }
            });
            break;
        case 'DayNightBand':
            this.timerSubscription = timer.subscribe((t) => {
                band.events.push({
                    start: Moment().utc().toDate(),
                    summary: 'now'
                });
                try {
                    this._ApplicationService.sortObj(band.events, 'start');
                    for (let i = band.events.length - 1; i >= 0; i--) {
                        if (band.events[i].summary === 'now' && band.events[i].start > band.events[i-1].start && band.events[i].start < band.events[i-1].stop) {
                            this.daynightCountdown = this.convertToTime(Math.round((band.events[i - 1].stop - band.events[i].start) / 1000)).toString() + ' to ISS NIGHT';
                        };
                        if (band.events[i].summary === 'now' && band.events[i].start > band.events[i-1].stop && band.events[i].start < band.events[i+1].start) {
                            this.daynightCountdown = this.convertToTime(Math.round((band.events[i + 1].start - band.events[i].start) / 1000)).toString() + ' to ISS DAY';
                        };
                    };
                    for (let i = band.events.length - 1; i >= 0; i--) {
                        if (band.events[i].summary === 'now') {
                            band.events.splice(i, 1);
                        }
                    };
                } catch(err) {
                    this.daynightCountdown = 'error';
                }
            });
            break;
        case 'CommsBand':
            this.timerSubscription = timer.subscribe((t) => {
                let i = 0;
                let nextTarget: Date;
                let ku = [];
                let s = [];
                ku.push({
                    start: Moment().utc().toDate(),
                    summary: 'now'
                });
                s.push({
                    start: Moment().utc().toDate(),
                    summary: 'now'
                });
                try {
                    for (i = band.events.length - 1; i >= 0; i--) {
                        if (band.events[i].Ku) {
                            ku.push({
                                start: band.events[i].start,
                                stop: band.events[i].stop
                            });
                        }
                        if (band.events[i].S) {
                            s.push({
                                start: band.events[i].start,
                                stop: band.events[i].stop
                            });
                        }
                    };
                    this._ApplicationService.sortObj(ku, 'start');
                    for (i = ku.length - 1; i >= 0; i--) {
                        if (ku[i].summary === 'now' && ku[i].start > ku[i - 1].start && ku[i].start < ku[i - 1].stop ) {
                            let seconds = Math.round((ku[i - 1].stop - ku[i].start) / 1000).toString();
                            this.kuCountdown = this.convertToTime(seconds) + ' to KU band LOS';

                        }
                        if (ku[i].summary === 'now' && ku[i].start > ku[i - 1].stop && ku[i].start < ku[i + 1].start ) {
                            let seconds = Math.round((ku[i + 1].start - ku[i].start) / 1000).toString();
                            this.kuCountdown = this.convertToTime(seconds) + ' to KU band AOS';
                        }
                    }
                    this._ApplicationService.sortObj(s, 'start');
                    for (i = s.length - 1; i >= 0; i--) {
                        if (s[i].summary === 'now' && s[i].start > s[i - 1].start && s[i].start < s[i - 1].stop ) {
                            let seconds = Math.round((s[i - 1].stop - s[i].start) / 1000).toString();
                            this.sCountdown = this.convertToTime(seconds) + ' to S band LOS';
                        }
                        if (s[i].summary === 'now' && s[i].start > s[i - 1].stop && s[i].start < s[i + 1].start ) {
                            let seconds = Math.round((s[i + 1].start - s[i].start) / 1000).toString();
                            this.sCountdown = this.convertToTime(seconds) + ' to S band AOS';
                        }
                    }
                } catch(err) {
                   this.kuCountdown = 'error';
                }
            });
            break;
        default:
    }
  }

  private convertToTime(count) {
    let minutes = Math.floor(count / 60);
    let seconds  = count - minutes * 60;
    return minutes.toString() + ' Minutes ' + seconds.toString() + ' seconds';
  }

}
