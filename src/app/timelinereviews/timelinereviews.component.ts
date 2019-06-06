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
import { Query } from '../query';

import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';
import * as Moment from 'moment';
import * as settingsFile from 'assets/settings/app-settings.json';
import { EventsComponent } from '../events';



// Google
declare const gapi: any;

@Component({
  selector: 'events',
  entryComponents: [ ItemDetails ], // can also go in module if everyone makes use of it
  templateUrl: './timelinereviews.component.html',
})
export class TimelineReviewsComponent implements OnInit {

  private TLRData = [];

  @ViewChild('ItemDetailsAnchor', {read: ViewContainerRef}) ItemDetailsAnchor: ViewContainerRef;

  constructor(
    public router: Router,
    public http: HttpClient,
    private _apiService: ApiService,
    private formBuilder: FormBuilder,
    public notificationService: NotificationService,
    private _ApplicationService: ApplicationService,
    ) {
    }

  ngOnInit() {
    this.getTimelineReviewData('ASIM');


    // this._ApplicationService.itemsUpdated
    //     .subscribe( (data) => {
    //       switch (data.type) {
    //         case 'events': this.events = data.data;
              
    //           if (!this.SelectedEventsCategories) {
    //             this.events = data.data;
    //           } else {
    //             this.events = [];
    //             data.data.forEach((event) => { // filter events
    //               if ( this.SelectedEventsCategories.every((elem) => event.categories.sort().indexOf(elem) > -1)) {
    //                   this.events.push(event);
    //               }
    //             });
    //           }
    //           break;
    //         case 'todos': this.todos = data.data;
    //           break;
    //         case 'files': this.files = data.data;
    //           break;
    //         case 'categories':
    //           this.categories = [...data.data];
    //         default:
    //       }
    //       });
  }

  private getTimelineReviewData(filter) {
    let URLs = [];
    URLs.push('/events/?dtstart=' + Moment.utc().subtract(5, 'days').toDate().toISOString() + '&dtend=' + Moment.utc().add(20, 'days').toDate().toISOString() + '&source[]=optimis&category[]=COL');
    URLs.push('/events/?dtstart=' + Moment.utc().subtract(5, 'days').toDate().toISOString() + '&dtend=' + Moment.utc().add(20, 'days').toDate().toISOString() + '&source[]=optimis&category[]=COL RESOURCE');
    URLs.push('/events/?dtstart=' + Moment.utc().subtract(5, 'days').toDate().toISOString() + '&dtend=' + Moment.utc().add(20, 'days').toDate().toISOString() + '&source[]=optimis&category[]=KU-BD');
    URLs.push('/events/?dtstart=' + Moment.utc().subtract(5, 'days').toDate().toISOString() + '&dtend=' + Moment.utc().add(20, 'days').toDate().toISOString() + '&source[]=optimis&category[]=MCC COORD');
    this._apiService.getHourglassData([{'queries': URLs}])
      .subscribe(
        (resp) => {
          let bandData = [];
          resp.forEach((band) => {
            let events = [];
            band.forEach(event => {
              if(event.summary.includes(filter)) {
                events.push(event);
              }
            });
            this._ApplicationService.sortObj(events, 'dtstart');
            bandData.push(events);
          });
          this.generateTLRTable(bandData);
        },
        (err) => { console.log(err); },
        () => {
        }
      );
  }

  private generateTLRTable(activities) {
    console.log(activities);
    let TLRStart = Moment.utc().hours(6).minutes(0).seconds(0).milliseconds(0);
    let TLREnd = Moment.utc().hours(6).minutes(0).seconds(0).milliseconds(0).add(1,'days');
    this.TLRData = [
      { 'start': TLRStart.toDate(), 'end': TLREnd.toDate()},
      { 'start': TLRStart.add(1,'days').toDate(), 'end': TLREnd.add(1,'days').toDate() },
      { 'start': TLRStart.add(1,'days').toDate(), 'end': TLREnd.add(1,'days').toDate() },
      { 'start': TLRStart.add(1,'days').toDate(), 'end': TLREnd.add(1,'days').toDate() }
    ]
    this.TLRData.forEach(review => {
      activities[0].forEach(event => { // COL band activities
        if(event.summary = "ASIM-GND-CMD" && event.dtstart.getTime() == review.start.getTime() && event.dtend.getTime() == review.end.getTime()) {
          review['ASIM-GND-CMD'] = event;
        }
        if(event.summary = "DMS-ASIM FILE-U/XFER" && event.dtstart.getTime() >= review.start.getTime() && event.dtstart.getTime() < review.end.getTime()) {
          review['DMS-ASIM FILE-U/XFER'] = event;
        }
      });

    });   
    console.log(this.TLRData);

  }





}
