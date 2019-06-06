import { Component, OnInit, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
// import { Event } from '../models/event';
import { User } from '../models/user';
// import { File } from '../models/file';
import { Slot } from '../models/slot';
import { Category } from '../models/category';

import 'rxjs/add/operator/map';
import { ApiService} from '../services/api.service';

import {MenuItem} from 'primeng/primeng';

// const template = require('./management.html');


@Component({
  selector: 'management',
  templateUrl: './management.component.html',
})

export class ManagementComponent implements OnInit {
  jwt: string;
  decodedJwt: User;
  response: string;
  api: string;


  categories: Category[] = [];
  category: Category;

  slots: Slot[] = [];

  // cols: any[];
  selectedCategory: Category;
  selectSlot: Slot;
  // selectedPastEvent: Event;
  // event: Event;
  displayDetailDialog: boolean;
  // displayHistoryDialog: boolean;
  newCategory: boolean;
  items: MenuItem[];
  public category_id: number;

  // public notifyEventChange = new EventEmitter(); //test voor eventemitten

  constructor(
    public router: Router,
    public http: HttpClient,
    private _apiService: ApiService)
  {}

  ngOnInit() {
    this.jwt = localStorage.getItem('gpt_token');
    this.decodedJwt = this.jwt && (<any>window).jwt_decode(this.jwt);

    this.items = [
          {label: ' Edit', icon: 'fa fa-pencil-square-o', command: (category) => this.editItem()},
          // {label: ' History', icon: 'fa-history', command: (event) => this.historyCategory()},
          {label: ' Delete', icon: 'fa fa-trash-o', command: (category) => this.delete()},
    ];

    this.getCategories();
    this.getSlots();

  }

  showDialogToAdd(category) {
    this.newCategory = true;
    this.category = new Category('');
    this.displayDetailDialog = true;
  }

  editItem() {
    this.newCategory = false;
    // this.category = this.cloneCategory(this.selectedCategory);
    this.category = Object.assign({}, this.selectedCategory);
    this.category_id = this.category.uid;

    this.displayDetailDialog = true;
  }

  // historyEvent() {
  //   this.newEvent = false;
  //   this.event = this.cloneEvent(this.selectedEvent);
  //   this.event_id = this.event.uid;

  //   // this.nogeenevent = new Event();
  //   // this.eventHistory = new Event;
  //   // add history of the selected event
  //   this._apiService.getEventHistory(this.selectedEvent.uid)
  //   .subscribe(
  //     (data) => { this.eventHistory = data.history; },
  //     err => { console.log(err); }
  //   );    
  //   this.displayHistoryDialog = true;
  // }

  // revertEvent() {
  //   // should be able to access the uid of the main event...
  //   this.event = this.cloneEvent(this.selectedPastEvent);
  //   this.updateEvent(this.event_id, this.event);
  //   this.event = null;
  // }

  save (){
    if(this.newCategory)
      this.createItem('categories', this.category);
    else
      this.updateItem('categories', this.category.uid, this.category);
    this.displayDetailDialog = false;
    // this.getCategories();
    this.category = null;
  }

  delete () {
    if (confirm('Are you sure you want to delete this item?')) {
      this.deleteItem('category', this.selectedCategory.uid);
      this.displayDetailDialog = false;
    } else {}
  }

  // cloneCategory(c: Category): Category {
  //     let category = new Category('');
  //     for(let prop in c) {
  //         category[prop] = c[prop];
  //     }
  //     return category;
  //   }

  getCategories() {
    this._apiService.getAPIData('categories')
      .subscribe(
        (data) => { this.categories = data; console.log(this.categories); },
        err => {
            console.log(err);
          },
      );
  }

  getSlots() {
    this._apiService.getAPIData('slots')
      .subscribe(
        (data) => { this.slots = data; console.log(this.slots); },
        err => {
            console.log(err);
          },
      );
  }

  // createCategory(category) {
  //   // this._apiService.createItem('categories', category);
  //   this.getCategories();
  // }

  // updateCategory(id, category) {
  //   // this._apiService.updateItem('categories', id, category);
  //     this._apiService.updateAPIData('categories', id, category)
  //         .subscribe(
  //             response => { },
  //             err => {
  //                 console.log(err);
  //                 },
  //             () => {this.getCategories(); }  // moet een soort van 'getxxx' staan voor data up todate te houden
  //         );
  // }



    deleteItem(type: string, pk: number) {
        this._apiService.deleteAPIData(type, pk)
            .subscribe(
                (data) => { },
                err => { console.log(err); },
                () => { this.refreshTable('categories'); }
            );
    }

    updateItem(type: string, pk: number, item) {
        this._apiService.updateAPIData(type, pk, item)
            .subscribe(
                response => { },
                err => {console.log(err);                   },
                () => { this.refreshTable('categories'); }
            );
    }

    createItem(type: string, item) {
        this._apiService.createAPIData(type, item)
            .subscribe(
                response => { },
                err => { console.log(err); },
                () => { this.refreshTable('categories'); }
            );
    }

    refreshTable( type: string, param = '') {
      switch (type) {
        case 'categories':
          this.getCategories();
          break;
        case 'slots':
          this.getSlots();
          break;
        case 'events':
          // this.getEvents();
          break;
      };
    }
}
