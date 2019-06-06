import { Component, OnInit, EventEmitter, ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Event } from '../models/event';
import { User } from '../models/user';
import { File } from '../models/file';
import { Todo } from '../models/todo';
import { Category } from '../models/category';
import { Settings } from '../models/settings';
import { ItemDetails } from '../item-details';
import { FormGroup, FormControl, FormBuilder, FormsModule } from '@angular/forms';
// import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';

// import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';

import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';

import { MenuItem, AutoCompleteModule, CalendarModule, ScheduleModule } from 'primeng/primeng';

import * as Moment from 'moment';

// const template = require('./todo-management.html');

@Component({
  selector: 'tasks',
  entryComponents: [ ItemDetails ],
  templateUrl: './tasks.component.html'
})
export class TasksComponent implements OnInit {

  jwt: string;
  decodedJwt: User;
  response: string;
  api: string;

  events: Event[] = [];
  eventHistory: Event[] = [];

  actionItems: Todo[] = [];

  files: File[] = [];
  fileReader: FileReader;
  base64Encoded: string;
  file_result: File;
  fileName: string;

  newTodo: boolean;
  todo: Todo;
  todos: Todo[] = [];
  todosOriginal: Todo[] = []
  selectedTodo: Todo;
  selectedPastTodo: Todo;

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
  test: string[];

  allSettings: Settings;

  // for categories
  categories: SelectItem[];
  // MultiSelectCategories: SelectItem[];
  private SelectedTasksCategories: string[];

  public errorMessage: string;
  errorType: string;

  public event_id: number;

  public statusList: SelectItem[];
  public priorityList: SelectItem[];
  public users: SelectItem[];

  private subtaskBoolean: boolean = false;
  private completedBoolean: boolean = false;


  private defaultTodoQuery: any;

  // categoryChanged = new FormControl();

  dateStart: Date;
  dateEnd: Date;

  header: any;

  eventQuery: string;

  searchCategory: string[];

  @ViewChild('ItemDetailsAnchor', {read: ViewContainerRef}) ItemDetailsAnchor: ViewContainerRef;

  constructor(
    public router: Router,
    public http: HttpClient,
    private _apiService: ApiService,
    private formBuilder: FormBuilder,
    public notificationService: NotificationService,
    public _ApplicationService: ApplicationService,
    private resolver: ComponentFactoryResolver,
    ) {
     }

  ngOnInit() {
    this.test = ['completed'];
    this.items = [
          {label: ' Edit', icon: 'fa fa-pencil-square-o', command: (event) => this.Edit(false)},
          // {label: ' Duplicate', icon: 'fa-clone', command: (event) => this.Edit(true, true)},
          {label: ' Delete', icon: 'fa fa-trash-o', command: (event) => this.Delete()},
    ];

    this.statusList = [
    { label: 'tentative', value: 'tentative' },
    { label: 'scheduled', value: 'scheduled' },
    { label: 'on going', value: 'on going' },
    { label: 'completed', value: 'completed' },
    { label: 'canceled', value: 'canceled' },
    ];

    this.priorityList = [
    { label: 'low', value: 'low' },
    { label: 'normal', value: 'normal' },
    { label: 'high', value: 'high' },
    { label: 'urgent', value: 'urgent' },
    ];

    // is dit dan nog wel nodig, laat gewoon met wat er gesaved is of indien niet aanwezig: alles
    this.defaultTodoQuery = { // todo: get everything and filter based on what user wants to see
      type: 'todos',
      // categories: [this._ApplicationService.getPayload()],
      // additional: '&status[]=tentative&status[]=on going&status[]=canceled&status[]=scheduled'
    };

    this.categories = [...this._ApplicationService.getCategories()];

    if (localStorage.getItem('tasks_settings')) {
        let settings = JSON.parse(localStorage.getItem('tasks_settings'));
        this.SelectedTasksCategories = settings.filter;
        this.subtaskBoolean = settings.hideSubtasks;
        this.completedBoolean = settings.hideCompleted;
        this.categoriesChanged(JSON.parse(localStorage.getItem('tasks_settings')).filter);
    } else {
      this._ApplicationService.queryData(this.defaultTodoQuery);
    }

    // if (localStorage.getItem('tasks_settings')) {
    //   // this.SelectedTasksCategories = ['fsl'];
    //   if (this.SelectedTasksCategories) {
    //     this.SelectedTasksCategories = JSON.parse(localStorage.getItem('tasks_settings'));
    //     this.categoriesChanged(JSON.parse(localStorage.getItem('tasks_settings')));
    //   }

    // } else {
    //   this._ApplicationService.queryData(this.defaultTodoQuery);
    // }

    // this._ApplicationService.queryData({ type: 'categories' });
    // this.SelectedCategories = ['fsl']; // default category selection
    //   { label: 'fsl', value: 'fsl'}
    // ];
    // console.log(this.SelectedCategories);
    // this.categoriesChanged(['fsl']); // default category query

    // subscribe to events created by other services/components
    this._ApplicationService.payloadChange
        .subscribe( (data) => { console.log('taskcomponent'); this.defaultTodoQuery.categories = [this._ApplicationService.getPayload()]; this._ApplicationService.queryData(this.defaultTodoQuery); });
    this._ApplicationService.timeWindowChange
        .subscribe( (data) => { this.defaultTodoQuery.categories = [this._ApplicationService.getPayload()]; this._ApplicationService.queryData(this.defaultTodoQuery); });
    this._ApplicationService.itemsUpdated
        .subscribe( (data) => {
          switch (data.type) {
            case 'events': this.events = data.data;
              break;
            case 'todos': this.todos = data.data; this.todosOriginal = this.todos; this.categoriesChanged(this.SelectedTasksCategories);
              break;
            case 'files': this.files = data.data;
              break;
            case 'categories':
              this.categories = [...data.data];
              // when categories have loaded, fill with local storage values. Nu laat je tasks/events/... ook in het begin van de app he stomme..
              // beter: categories enzo laden nog voor je pagina's laad en dan niet via deze methode werken
              // if (localStorage.getItem('tasks_settings')) {
              //   this.SelectedTasksCategories = JSON.parse(localStorage.getItem('tasks_settings'));
              //   this.categoriesChanged(JSON.parse(localStorage.getItem('tasks_settings')));
              // } else {
              //   this._ApplicationService.queryData(this.defaultTodoQuery);
              // }  
              break;
            default:
          }
          });
  }

  private taskFilters() {
    console.log(this.test);
    localStorage.removeItem('tasks_settings');
    let settings: any = {
      filter: this.SelectedTasksCategories,
      hideSubtasks: this.subtaskBoolean,
      hideCompleted: this.completedBoolean
    };
    console.log(settings);
    localStorage.setItem('tasks_settings', JSON.stringify(settings));
    // let allSettings: Settings = new Settings();
    // allSettings = this._ApplicationService.getSettings();
    // allSettings.taskTableFilter = settings;
    // this._ApplicationService.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, { settings: { taskTable: settings }});

    let temp: Todo[] = [];
    if (this.subtaskBoolean) {
      this.todosOriginal.forEach((todo) => {
        let mySet = new Set(todo.categories);
        if (!mySet.has('subtask')) {
          temp.push(todo);
        }
      });
      this.todos = temp;
    } else {
      this.todos = this.todosOriginal;
    }
    // let temp2: Todo[] = [];
    // if (this.completedBoolean) {
    //   this.todosOriginal.forEach((todo) => {
    //     // let mySet = new Set(todo.status);
    //     if (todo.status !== 'completed') {
    //       temp2.push(todo);
    //     }
    //   });
    //   this.todos = temp2;
    // } else {
    //   this.todos = this.todosOriginal;
    // }
    // console.log(this.todos);

  }


  private categoriesChanged(cats) {
    localStorage.removeItem('tasks_settings');
    let settings: any = {
      filter: cats,
      hideSubtasks: this.subtaskBoolean,
      hideCompleted: this.completedBoolean
    };
    console.log(settings);
    localStorage.setItem('tasks_settings', JSON.stringify(settings));
    // this._ApplicationService.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, { settings: { taskTable: settings }});

    let categories = '';
    if (cats) { // cats can be empty...
      cats = cats.sort();
      cats.forEach((category) => {
          categories = categories + '&category[]=' + category;
      });
    }
    let todoQuery = '?' + categories;
    this._apiService.getAPIData('todos', todoQuery) // je hebt een applicationservice voor dit zenne...
        .subscribe((data) => {
            this.todos = [];
            console.log(data);
            if (data) {
              data.forEach((todo) => {
                  // console.log(todo.categories.sort());
                  if (cats) {
                    if ( cats.every((elem) => todo.categories.sort().indexOf(elem) > -1)) {
                        this.todos.push(todo);
                    }
                  } else {
                    this.todos.push(todo);
                  }
              });
              this.todosOriginal = this.todos;
            }
        },
        (err) => { console.log(err); },
        () => { this.taskFilters(); }
        );
  }

  private Edit(newItem: boolean, duplicate: boolean = false) {
    if (newItem) {
      if (duplicate) {
        this.todo = Object.assign({}, this.selectedTodo);

      } else {
        this.todo = new Todo('', 'on going', this.SelectedTasksCategories, Moment.utc().add(7, 'days').toDate(), 'normal');
      }
    } else {
      this.todo = Object.assign({}, this.selectedTodo);
    }
    this.ItemDetailsAnchor.clear();
    let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
    let dialogComponentRef = this.ItemDetailsAnchor.createComponent(dialogComponentFactory);
    dialogComponentRef.instance.itemType = 'todos';
    dialogComponentRef.instance.categories = this.categories;
    // dialogComponentRef.instance.events = this.events;
    // dialogComponentRef.instance.files = this.files;
    dialogComponentRef.instance.newItem = newItem;
    dialogComponentRef.instance.todo = this.todo;
    dialogComponentRef.instance.item_id = this.todo.uid;
    dialogComponentRef.instance.close.subscribe((event) => {
      dialogComponentRef.destroy();
      if (event.changed) {
        this._ApplicationService.queryData(this.defaultTodoQuery);
      }
    });
  }

  private markComplete(item) {
    item.status = 'completed';
    this.updateItem(item.uid, item);
  }

  private Delete () {
    if (confirm('Are you sure you want to delete this item?')) {
      this._apiService.deleteAPIData('todos', this.selectedTodo.uid)
        .subscribe(
          (data) => {},
          (err) => { console.log(err); },
          () => { this._ApplicationService.queryData(this.defaultTodoQuery); }
        );
    } else {
        // Do nothing!
    }
  }

  private createItem(todo) {
      this._apiService.createAPIData('todos', todo)
      .subscribe(
          (response) => { },
          (err) => { console.log(err); },
          () => { this._ApplicationService.queryData(this.defaultTodoQuery); }
        );
  }

  private updateItem(id, event) {
      console.log(event);
      this._apiService.updateAPIData('todos', id, event)
      .subscribe(
          (response) => { },
          (err) => { console.log(err); },
          () => this._ApplicationService.queryData(this.defaultTodoQuery)
        );
  }
}
