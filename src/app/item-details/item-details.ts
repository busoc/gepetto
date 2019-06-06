import { Component, OnInit, EventEmitter, ViewChild, ComponentFactoryResolver, ViewContainerRef  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Event } from '../models/event';
// import { User } from '../models/user';
import { File } from '../models/file';
import { Todo } from '../models/todo';
// import { Category } from '../models/category';
import { FormBuilder } from '@angular/forms';

import 'rxjs/add/operator/map';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';

import { ToggleButtonModule, DropdownModule, DialogModule } from 'primeng/primeng';

// import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';

import * as Moment from 'moment';
// import { DOY } from '../pipes/dayoffyear.pipe';
import * as settingsFile from 'assets/settings/app-settings.json';
import { settings } from 'cluster';

// const template = require('./item-details.html');

// import '../../node_modules/quill/dist/quill.js';


@Component({
  selector: 'item-details',
  templateUrl: './item-details.html',
  // entryComponents: [ ItemDetails ], // addding deze lijn geeft serieuze error ze. Ma werkt ook zonder dus vreemd
  // styles: ['>>> .modal-xl { width: 950px; height: 600px;']
})
export class ItemDetails implements OnInit {

  events: Event[] = [];
  files: File[] = [];
  todos: Todo[] = [];

  event: Event;
  file: File;
  todo: Todo;

  copyItem: any;

  history: any[] = [];
  selectedItem: Event;
  item: any;
  newItem: boolean;
  categories: SelectItem[];
  users: SelectItem[];
  item_id: number;
  isSelected: boolean = false;
  dateStart: Date;
  dateEnd: Date;
  itemType: string;
  scheduledDuration: number;
  executedDuration: number;
  public selectedTodo: Todo;
  selectedAttachTodo: Todo;
  toggleScheduledExecuted: boolean = true;
  public statusList: SelectItem[];
  public priorityList: SelectItem[];
  public activityTemplates: SelectItem[];
  public selectedTemplate: SelectItem[];
  public froalaOptions: any;
  public froalaOptionsSmall: any;
  public userdata: any;
  itemDuration: number;
  allDay: boolean = false;
  public newChild: boolean = false;
  public taskFromEvent: boolean = false;
  public scheduledDurationNew: Date;

  // private utcOffset: string;

  itemDetailsModal: boolean = false;
  subtaskModal: boolean = false;

  public testModel: any;

  public close = new EventEmitter();

  // @ViewChild('modal') modal: ModalComponent;

  // @ViewChild('taskdescriptionmodal') taskdescriptionmodal: ModalComponent;

  constructor(
    public router: Router,
    public http: HttpClient,
    private _apiService: ApiService,
    private formBuilder: FormBuilder,
    public notificationService: NotificationService,
    private _ApplicationService: ApplicationService,
    private _FormBuilder: FormBuilder,
    // private resolver: ComponentFactoryResolver,
    ) {}

  ngOnInit() {

    // this.utcOffset = Moment().format('Z');

    switch (this.itemType) { // set type of item
      case 'events':
        this.item = new Event();
        this.item = this.event;
        if (!this.newItem) {
          this.ItemDetails(); // this.eventDetails(); // edit: just one 'details' fucntion for everything since history, todo all incduled! except for raw....
        };
        // let difference_ms = this.item.dtend - this.item.dtstart;
        // difference_ms = difference_ms / 1000;
        // let seconds = Math.floor(difference_ms % 60);
        // difference_ms = difference_ms / 60;
        // let minutes = Math.floor(difference_ms % 60);
        // difference_ms = difference_ms / 60;
        // let hours = Math.floor(difference_ms % 24);
        // let days = Math.floor(difference_ms / 24);
        this.calculateDuration('');
        break;
      case 'files':
        this.item = new File();
        this.item = this.file;
        this.ItemDetails(); //this.fileDetails();
        break;
      case 'todos':
        this.item = new Todo();
        this.item = this.todo;
        if (!this.newItem) {
          this.ItemDetails(); //this.todoDetails();
        };
        break;
      default:
    };

    // temp
    // this._ApplicationService.setPayload('asim');

    this.froalaOptions = {
      toolbarButtons: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'fontFamily', 'fontSize', '|',
      'specialCharacters', 'color', '|', 'paragraphFormat', 'formatOL', 'formatUL', 'outdent',
      'indent', 'insertLink', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
      height: 400
    };

    this.froalaOptionsSmall = {
      toolbarButtons: ['fullscreen', 'bold', 'italic', 'underline', 'fontFamily', 'fontSize', '|',
      'specialCharacters', 'color', 'inlineStyle', '|', 'align', 'formatOL', 'formatUL', 'outdent',
      'indent', 'insertLink', 'insertTable'],
      height: 50
    };

    this.users = this._ApplicationService.getUsers();
    this.categories = this._ApplicationService.getCategories();

    this.statusList = settingsFile.status;
    this.priorityList = settingsFile.priorities;
    let payloadObject = Object.keys(settingsFile.ControlCenterSpecs.Payloads).find((k) => settingsFile.ControlCenterSpecs.Payloads[k].name === this._ApplicationService.getPayload());
    this.activityTemplates = settingsFile.ControlCenterSpecs.Payloads[payloadObject].activityTemplates;
    this._ApplicationService.sortObj(this.activityTemplates, 'label');

    // this.modal.open();
    this.itemDetailsModal = true;
    $('#item-modal').modal('show');

    // zijn deze 2 nu echt nodig??
    // this._ApplicationService.queryData({ // put in switch statement and use based on which type of data it is
    //     type: 'files',
    //     categories: [this._ApplicationService.getPayload()],
    //   });
    // this._ApplicationService.queryData({
    //     type: 'todos',
    //     categories: [this._ApplicationService.getPayload()],
    //     additional: '&status[]=tentative&status[]=on going&status[]=canceled&status[]=scheduled'
    //   });

    if (!this.newItem) { // always included
      // this.History();
    }

    // this.itemDuration = this.item.dtend - this.item.dtstart;
    // console.log(this.itemDuration);
    this.copyItem = this.item;
    // console.log(this.categories);

    // console.log(this.selectedTemplate);

    this._ApplicationService.itemsUpdated
        .subscribe( (data) => {
          switch (data.type) {
            case 'events': this.events = data.data;
              break;
            case 'todos': this.todos = data.data;
              break;
            case 'files': this.files = data.data;
              break;
            // case 'categories': this.categories = data.data;
            //   break;
            default:
          }
          });
  }

  public showTodoDescription(todo) {
    this.selectedTodo  = todo;
    this.subtaskModal = true;
    $('#subtask-modal').modal('show');
    // this.taskdescriptionmodal.open();
  }

  private ItemDetails() {
    let query = '';
    console.log(this.item);
    // console.log(this.item.source);
    try {
      this._apiService.getAPIData(this.itemType, query, this.item.uid.toString())
        .subscribe(
          (data) => {
            this.item = data[0];
            if (this.item.metadata) {
              this.userdata = Object.keys(this.item.metadata).map((data) => [data, this.item.metadata[data]]);
            }
          },
          (err) => { console.log(err.text()); this.notificationService.addAlert('error', err.text()); },
          () => { }
        );
    } catch(err) {
      console.log(err);
    }

  }

  // private fileDetails () {
  //   let query = '?embed[]=raw&embed[]=metadata';
  //   this._apiService.getAPIData('files', query, this.item.uid.toString())
  //     .subscribe(
  //       (data) => { this.item = data[0]; console.log(this.item); },
  //       (err) => { console.log(err); },
  //       () => { }
  //     );
  // }

  private saveTodo(todo) {
    console.log(this.selectedTodo); // same content...
    let createdTodo: any = null;
    // put of post afhankelijk van of hij nog gemaakt moet worden...
    if (this.taskFromEvent) {
        this._apiService.createAPIData('todos', this.selectedTodo)
        .subscribe(
          (response) => { createdTodo = response; console.log(response); },
          (err) => { console.log(err); this._apiService.returnCodes(err); },
          () => {
            this._apiService.linkItems('events', this.item.uid, 'todos', Number(createdTodo.uid))
            .subscribe(
                (response) => { console.log('task from event created'); },
                (err) => { console.log(err); this._apiService.returnCodes(err); },
                () => { this.taskFromEvent = false; $('#subtask-modal').modal('hide'); this.ItemDetails(); }
            );
           }
        );
    } else {
      if (this.newChild) {
        this._apiService.createChild('todos', this.item.uid, this.selectedTodo)
          .subscribe(
              (response) => { console.log('child created'); },
              (err) => { console.log(err); this._apiService.returnCodes(err); },
              () => { this.newChild = false; $('#subtask-modal').modal('hide'); this.ItemDetails(); }
          );
      } else {
          this._apiService.updateAPIData('todos', this.selectedTodo.uid, this.selectedTodo)
          .subscribe(
            (response) => { console.log(response); },
            (err) => { console.log(err); this._apiService.returnCodes(err); },
            () => { $('#subtask-modal').modal('hide'); this.ItemDetails(); }
          );
      }
    }
  }


  // private saveSelectedTodo(value) {
  //   console.log(value);
  //   switch (value.field) {
  //     case 'status': this.selectedTodo.status = value.status;
  //       break;
  //     case 'assignees': this.selectedTodo.assignees = value.assignees;
  //       break;
  //     default:
  //   }
  //   console.log(this.selectedTodo);
  //   // if (type === 'dropdown') {
  //   //   console.log(value);
  //   // }
  //   // if (type === 'text') {
  //   //   console.log(value.data);
  //   // }
  //   // this._apiService.updateAPIData('todos', todo.uid, todo)
  //   //   .subscribe(
  //   //     (response) => { console.log(response); },
  //   //     (err) => { console.log(err); this._apiService.returnCodes(err); },
  //   //     () => { this.taskdescriptionmodal.close(); }
  //   //   );
  // }

  private dtstartChanged(event) { // gives trouble...
    this.item.dtend = Moment(event).add(this.itemDuration, 'ms').toDate();
    this.itemDuration = this.item.dtend - this.item.dtstart;
  }

  private Revert() {
    console.log(this.selectedItem);
    this.item = this.selectedItem;
  }

  private Selected(item: any) {
    if (!this.selectedItem) {
      return false;
    }
    return this.selectedItem.uid === item.uid ? true : false;
  }

  private Save() {
    console.log(this.item);
    // convert metadata to object!!!

    if (!this.item.uid) { // uid field undefinied with new event
      this.createItem(this.item);
    } else {
      this.updateItem(this.item.uid, this.item);
    };
  }

  private Delete () {
    if (confirm('Are you sure you want to delete this item?')) {
    this._apiService.deleteAPIData(this.itemType, this.item.uid)
      .subscribe(
        (data) => { $('#item-modal').modal('hide'); console.log(data); this.close.emit({ changed: true }); this.notificationService.addAlert('success', 'event deleted'); },
        (err) => { console.log(err); this._apiService.returnCodes(err); this.notificationService.addAlert('error', err);},
        () => { }
      );
    } else { }
  }

  private attachFile(file) { // not used now
    console.log(file);
    let query = '?embed[]=raw&embed[]=metadata';
    this._apiService.getAPIData('files', query, file)
      .subscribe(
        (data) => { this.item.raw = data[0].raw; console.log(this.item.raw); },
        (err) => { console.log(err); this.notificationService.addAlert('error', err);},
        () => { }
      );
    // gives 404 error, check again
    // this._apiService.linkItems('events', this.item.uid, 'files', Number(file))
    //   .subscribe(
    //     (data) => { console.log(data); console.log('jeuj attached'); },
    //     (err) => { console.log(err); this._apiService.returnCodes(err); },
    //     () => { this.eventDetails(); }
    //   );
  }

  private addSubTask() {
    $('#subtask-modal').modal('show');
    this.newChild = true;
    this.selectedTodo = new Todo(this.item.summary, this.item.status, this.item.categories, this.item.due, this.item.priority);
    this.selectedTodo.categories.push('subtask');
    // this.subtaskModal = true;
  }

  private addTask() {
    // fsl should be user usersettings
    $('#subtask-modal').modal('show');
    this.taskFromEvent = true;
    this.selectedTodo = new Todo('new task', 'on going', ['fsl'], Moment.utc().add(7, 'days').toDate(), 'normal');
    // this.taskdescriptionmodal.open();
  }

  private addAndAttachSubTask() {
    let createdSubTask: any = null;
    // show popup!!!
    let todo = new Todo('new subtask', 'on going', [this._ApplicationService.getPayload(), 'subtask'], Moment.utc().add(7, 'days').toDate(), 'normal');
    console.log(todo);
    this._apiService.createChild('todos', this.item.uid, todo)
      .subscribe(
          (response) => { console.log('child created'); },
          (err) => { console.log(err); this._apiService.returnCodes(err); this.notificationService.addAlert('error', err);},
          () => { this.ItemDetails(); }
      );
    // this._apiService.createAPIData('todos', todo)
    //   .subscribe(
    //       (response) => { createdSubTask = response; console.log('subtask created'); },
    //       (err) => { console.log(err); this._apiService.returnCodes(err); },
    //       () => {
    //         this._apiService.linkItems('todos', this.item.uid, 'todos', createdSubTask)
    //           .subscribe(
    //             (data) => { console.log(data); console.log('attached'); },
    //             (err) => { console.log(err); this._apiService.returnCodes(err); },
    //             () => { this.ItemDetails(); } //this.todoDetails(); }
    //           );
    //        }
    //     );
  }

  private addAndAttachTodo() {
    let createdTodo: any = null;
    let todo = new Todo('new task', 'on going', [this._ApplicationService.getPayload()], Moment.utc().add(7, 'days').toDate(), 'normal');
    console.log(todo);
    // create first a todo
    this._apiService.createAPIData('todos', todo)
      .subscribe(
          (response) => { createdTodo = response; console.log('task created'); },
          (err) => { console.log(err); this._apiService.returnCodes(err); },
          () => {
            this._apiService.linkItems('events', this.item.uid, 'todos', Number(createdTodo.uid))
              .subscribe(
                (data) => { console.log(data); console.log('attached'); },
                (err) => { console.log(err); this._apiService.returnCodes(err); this.notificationService.addAlert('error', err);},
                () => { this.ItemDetails(); } //this.eventDetails(); }
              );
           }
        );
  }

  private attachTodo() {
    this._apiService.linkItems('events', this.item.uid, 'todos', Number(this.selectedAttachTodo))
      .subscribe(
        (data) => { console.log(data); console.log('jeuj attached'); },
        (err) => { console.log(err); this._apiService.returnCodes(err); this.notificationService.addAlert('error', err);},
        () => { this.ItemDetails(); }//this.eventDetails(); }
      );
  }

  private dettachTodo(todo) {
    // subtask moet dan verwijderd worden he... werkt ook niet btw.
    this._apiService.unlinkItems('events', this.item.uid, 'todos', todo.uid)
      .subscribe(
        (data) => { },
        (err) => { console.log(err); this._apiService.returnCodes(err); this.notificationService.addAlert('error', err);},
        () => { this.ItemDetails(); } //this.eventDetails(); }
      );
  }

  private scheduledDurationChanged(duration) {
    this.item.dtend = Moment(this.item.dtstart).add(duration, 'seconds').toDate();
  }

  private executedDurationChanged(duration) {
    this.item.rtend = Moment(this.item.rtstart).add(duration, 'seconds').toDate();
  }

  private calculateEnd(type) {
    console.log(this.item.dtstart);
    if (type === 'scheduled') {
      this.item.dtend = Moment(this.item.dtstart).add(this.scheduledDuration, 'seconds').toDate();
    } else {
      this.item.rtend = Moment(this.item.rtstart).add(this.executedDuration, 'seconds').toDate();
    }
  }

  private calculateDuration(event) {
    if (this.selectedTemplate) {
      if (event === 'start') {
        this.item.dtend = Moment(this.item.dtstart).add(this.scheduledDuration, 'seconds').toDate();
      }
      if (event === 'end') {
        this.item.dtstart = Moment(this.item.dtend).subtract(this.scheduledDuration, 'seconds').toDate();
      }
      // if (event === 'executed') { // solved because if you edit the executed duration, it is no more a selectedtemplate...
      //   let days = '';
      //   let hours = '';
      //   let minutes = '';
      //   let difference = this.item.dtend - this.item.dtstart;
      //   this.scheduledDuration = Math.floor(((this.item.dtend - this.item.dtstart) / 1000) / 60);
      //   this.executedDuration = Math.floor(((this.item.rtend - this.item.rtstart) / 1000) / 60);
      //   if (this.scheduledDuration < 0) {
      //     this.item.dtend = this.item.dtstart;
      //     this.scheduledDuration = 0;
      //   }
      //   if (this.executedDuration < 0) {
      //     this.item.rtend = this.item.rtstart;
      //     this.executedDuration = 0;
      //   }
      // }
    } else {
      let days = '';
      let hours = '';
      let minutes = '';
      let difference = this.item.dtend - this.item.dtstart;
      // console.log(difference);
      // let temp: Date = new Date(difference);
      // console.log(temp);
      this.scheduledDuration = Math.floor(((this.item.dtend - this.item.dtstart) / 1000));
      this.executedDuration = Math.floor(((this.item.rtend - this.item.rtstart) / 1000));

      // this.scheduledDurationNew = temp;

      // if (this.scheduledDuration < 0) {
      //   this.item.dtend = this.item.dtstart;
      //   this.scheduledDuration = 0;
      // }
      // if (this.executedDuration < 0) {
      //   this.item.rtend = this.item.rtstart;
      //   this.executedDuration = 0;
      // }
    }
  }

  // private editTodo(selectedtodo) {
  //   this.selectedTodo = selectedtodo;
  //   console.log(this.selectedTodo);
  //   // if (newItem) {
  //   //   if (duplicate) {
  //   //     this.todo = Object.assign({}, this.selectedTodo);

  //   //   } else {
  //   //     this.todo = new Todo('', 'on going', [this._ApplicationService.getPayload()], Moment.utc().add(7, 'days').toDate(), 'normal');
  //   //   }
  //   // } else {
  //   //   this.todo = Object.assign({}, this.selectedTodo);
  //   // }
  //   // this.ItemDetailsDetailsAnchor.clear();
  //   // let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
  //   // let dialogComponentRef = this.ItemDetailsDetailsAnchor.createComponent(dialogComponentFactory);
  //   // dialogComponentRef.instance.itemType = 'todos';
  //   // dialogComponentRef.instance.categories = this.categories;
  //   // // dialogComponentRef.instance.events = this.events;
  //   // // dialogComponentRef.instance.files = this.files;
  //   // dialogComponentRef.instance.newItem = false;
  //   // dialogComponentRef.instance.todo = this.selectedTodo;
  //   // dialogComponentRef.instance.item_id = this.selectedTodo.uid;
  //   // dialogComponentRef.instance.close.subscribe(() => {
  //   //   dialogComponentRef.destroy();
  //   //   // this._ApplicationService.queryData({ type: 'todos' });
  //   // });
  // }

  private createItem(item) {
    this._apiService.createAPIData(this.itemType, item)
      .subscribe(
          (response) => { $('#item-modal').modal('hide'); console.log(response); this.close.emit({ changed: true }); this.notificationService.addAlert('success', 'item created'); },
          (err) => { console.log(err); this._apiService.returnCodes(err); this.notificationService.addAlert('error', err);},
          () => {}
        );
  }

  private updateItem(id, item) {
    // item.categories.forEach((d) => {
    //   if (!this.copyItem.categories.includes(d)) {
    //     console.log(d + ' added ' + d.uid);

    //   }
    //  });
    // this.copyItem.categories.forEach((d) => {
    //   if (!item.categories.includes(d)) {
    //     console.log(d + ' removed ' + d.uid);
    //   }
    // });

    // delete item.raw;
    item.raw = btoa(item.raw);
    // console.log(item);

    console.log('juw');
    this._apiService.updateAPIData(this.itemType, id, item)
      .subscribe(
        (response) => { $('#item-modal').modal('hide'); console.log(response); console.log(response.statusText); this.close.emit({ changed: true }); this.notificationService.addAlert('success', 'item updated');},
        (err) => { console.log(err); this.notificationService.addAlert('error', err.text(), false); },
        () => {  } // add notifications!
      );
  }

  private convertEventTemplateToEvent(event) {
    this.item.summary = event.value.summary; // not good because when the template keys are changed, this also has to be changed...
    this.item.description = event.value.description;
    this.item.categories = event.value.categories;
    this.item.dtstart = this.item.dtstart; //Moment.utc().toDate();
    this.scheduledDuration = event.value.duration;
    this.item.dtend = Moment(this.item.dtstart).add(event.value.duration, 'seconds').toDate();
    this.item.rtstart = this.item.rtstart;
    this.executedDuration = event.value.duration;
    this.item.rtend = Moment(this.item.rtstart).add(event.value.duration, 'seconds').toDate();
    this.item.metadata = event.value.metadata;
    this.userdata = Object.keys(event.value.metadata).map((data) => [data, event.value.metadata[data]]);
  }

  private userdataChanged(i) { // convert array back to metadata object of the item
    this.userdata[i][1] = this.testModel;
    let json: any;
    let tempobject: any;
    this.userdata.forEach((item) => {
      let optionName = item[0];
      json = {
        [optionName] : item[1]
      };
      if (tempobject) {
        Object.assign(tempobject, json);
      } else {
        tempobject = json;
      }
    });
    this.item.metadata = tempobject;
    // todo: refresh view...
  }

  private DownloadFile() {
    let FileSaver = require('file-saver');
    let blob = new Blob([this.item.raw], {type: 'text/plain;charset=utf-8'}); // change type!!!
    console.log(this.item.name);
    FileSaver.saveAs(blob, this.item.name);
  }

}
