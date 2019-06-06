// Core elements
import { Component, OnInit, EventEmitter, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Models
import { Event } from '../models/event';
import { User } from '../models/user';
import { File } from '../models/file';
import { Slot } from '../models/slot';
import { Todo } from '../models/todo';

// Services
import 'rxjs/add/operator/map';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';

// Components
import { ItemDetails } from '../item-details';

// PrimeNG
import { MenuItem, TreeNode, TreeModule, Header, Footer } from 'primeng/primeng';

// Constants
const template = require('./files.component.html');

// Vendors
import * as Moment from 'moment';

@Component({
  selector: 'files',
  entryComponents: [ ItemDetails ],
  // template: template
  templateUrl: './files.component.html',
})
export class FilesComponent implements OnInit {
  jwt: string;
  decodedJwt: User;
  response: string;
  api: string;

  files: File[] = [];
  fileReader: FileReader;
  base64Encoded: string;
  file_result: File;
  fileName: string;
  selectedFile: File;
  file: File;

  event: Event;
  events: Event[] = [];

  todos: Todo[] = [];

  slots: SelectItem[]; // : Slot[] = [];
  Slots: Slot[] = [];
  selectedSlot: string;

  categories: SelectItem[];

  cols: any[];
  displayDetailDialog: boolean;
  displayHistoryDialog: boolean;
  displayTransferDialog: boolean;
  displayEventDialog: boolean;
  newFile: boolean;
  newEvent: boolean;
  items: MenuItem[];
  cats: any[];
  public event_id: number;

  loading: boolean = false;

  // @ViewChild('expandingTree')
  // expandingTree: Tree;
  OnboardFilesTree: TreeNode[] = [];
  GroundFilesTree: TreeNode[] = [];
  private SelectedFilesCategories: string[];

  public fileUploaded = new EventEmitter();

  @ViewChild('ItemDetailsAnchor', {read: ViewContainerRef}) ItemDetailsAnchor: ViewContainerRef;

  constructor(
    public router: Router,
    public http: HttpClient,
    private _apiService: ApiService,
    public notificationService: NotificationService,
    private _ApplicationService: ApplicationService,
    private resolver: ComponentFactoryResolver,
    ) {
    this.event_id = 0;
  }

  ngOnInit() {

    this.loading = true;
    this._ApplicationService.queryData({ type: 'files', categories: [this._ApplicationService.getPayload()] });
    this._ApplicationService.queryData( { type: 'categories'} );
    this._ApplicationService.queryData( { type: 'users'} );

    this.cols = [
      // { field: 'uid', header: 'id' },
      { field: 'summary', header: 'Summary' },
      { field: 'categories', header: 'Categories' },
      { field: 'size', header: 'Size (bytes)' },
      { field: 'user', header: 'Edited by' },
      { field: 'description', header: 'Description' },
      { field: 'checksum', header: 'Checksum' },
      { field: 'lastmod', header: 'Last modified' },
      { field: 'location', header: 'Location' },
      { field: 'comment', header: 'Comment' },
    ];
    this.items = [
          {label: ' Edit', icon: 'fa fa-pencil-square-o', command: (event) => this.Edit(false)},
          // {label: ' Transfer', icon: 'fa-exchange', command: (event) => this.transfer()},
          {label: ' Schedule', icon: 'fa fa-calendar-plus-o', command: (event) => this.Schedule()},
          {label: ' Delete', icon: 'fa fa-trash-o', command: (event) => this.Delete()},
    ];

    // this._ApplicationService.queryData({ type: 'categories' });
    // if (localStorage.getItem('categories')) {
    //    this.categories = JSON.parse(localStorage.getItem('categories'));
    // }

    this.fileUploaded.subscribe((file) => this.createFile(file)); // call back for when a file has been uploaded

    this._ApplicationService.payloadChange
        .subscribe( (data) => {
          this.files = [];
          this.OnboardFilesTree = [];
          this.GroundFilesTree = [];
          this.loading = true;
          this._ApplicationService.queryData({ type: 'files', categories: [this._ApplicationService.getPayload()] });
        });


    this._ApplicationService.itemsUpdated
        .subscribe( (data) => {
          switch (data.type) {
            case 'events': this.events = data.data;
              break;
            case 'todos': this.todos = data.data;
              break;
            case 'files':
              console.log(data.data);
              this.files = data.data;
              this.loading = false;
              this.OnboardFilesTree = this._ApplicationService.createOnboardDataTree(this.files);
              console.log(this.OnboardFilesTree);
              this.GroundFilesTree = this._ApplicationService.createGroundDataTree(this.files);
              //console.log(this.GroundFilesTree);
              break;
            case 'slots': this.slots = data.data;
              break;
            case 'categories': this.categories = data.data;
              break;
            default:
          }
        });

  }

  showDialogToAdd(event) {
    this.newFile = true;
    this.file = new File();
    this.displayDetailDialog = true;
  }

  Schedule () { // link between event and file not created yet!
    this.newEvent = true;
    this.event = new Event(Moment.utc().toDate(), Moment.utc().toDate(), Moment.utc().toDate(), Moment.utc().toDate(), 'scheduled', [''], this.selectedFile.name, );
    this.event.categories = this.selectedFile.categories; // [this.selectedFile.categories[0], 'science run']; // [this.selectedFile.categories[0]]; // find good copy algorythm
    this.event.file = this.selectedFile.uid;

    // this.Edit(true);
    // duplicate code so find alternative...
    this.ItemDetailsAnchor.clear();
    let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
    let dialogComponentRef = this.ItemDetailsAnchor.createComponent(dialogComponentFactory);
    dialogComponentRef.instance.itemType = 'events';
    dialogComponentRef.instance.categories = this.categories; // function
    // dialogComponentRef.instance.events = this.events;
    dialogComponentRef.instance.files = this.files;
    dialogComponentRef.instance.newItem = this.newEvent;
    dialogComponentRef.instance.event = this.event;
    // dialogComponentRef.instance.item_id = this.file.uid;
    dialogComponentRef.instance.close.subscribe(() => {
      dialogComponentRef.destroy();
      console.log('destroyed');
      this._ApplicationService.queryData({ type: 'files', categories: [this._ApplicationService.getPayload()] });
    });

  }

  // transfer() {
  //   this._ApplicationService.queryData({ type: 'slots' });
  //   this.displayTransferDialog = true;
  // }


  Edit(newItem: boolean, duplicate: boolean = false) {
    // console.log(this._ApplicationService.getUsers());
    console.log(this.selectedFile);
    if (this.selectedFile.uid) { // in case selectedFile is a directory from the tree...
      if (newItem) {
        if (duplicate) {
          // check voor nieuw kopieer ding
          this.file = Object.assign({}, this.selectedFile); // use deepcopy!!!

        } else {
          this.file = new File('dummy file');
        }
      } else {
        // if (!this.fromCalendar) {
        this.file = Object.assign({}, this.selectedFile);
        // }
      }
      this.ItemDetailsAnchor.clear();
      // console.log(this.file);
      let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
      let dialogComponentRef = this.ItemDetailsAnchor.createComponent(dialogComponentFactory);
      dialogComponentRef.instance.itemType = 'files';
      // dialogComponentRef.instance.categories = this._ApplicationService.getCategories();
      // dialogComponentRef.instance.events = this.events;
      // dialogComponentRef.instance.files = this.files;
      dialogComponentRef.instance.newItem = newItem;
      dialogComponentRef.instance.file = this.file;
      dialogComponentRef.instance.item_id = this.file.uid;
      dialogComponentRef.instance.close.subscribe((event) => {
        dialogComponentRef.destroy();
        if (event.changed) {
          this._ApplicationService.queryData({ type: 'files', categories: [this._ApplicationService.getPayload()] });
        }
      });      
    }
  }

  // editFile() {

  //   this.newFile = false;
  //   let query = '?embed[]=raw&embed[]=metadata';
  //   this._apiService.getAPIData('files', query, this.selectedFile.uid.toString())
  //     .subscribe(
  //       (data) => { this.file = data; }, // this.file.raw = atob(this.file.raw); },
  //       err => {
  //           console.log(err);
  //         },
  //       () => {
  //           this.ItemDetailsAnchor.clear();
  //           let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
  //           let dialogComponentRef = this.ItemDetailsAnchor.createComponent(dialogComponentFactory);
  //           dialogComponentRef.instance.itemType = 'files';
  //           dialogComponentRef.instance.categories = this.categories; // function
  //           // dialogComponentRef.instance.events = this.events;
  //           dialogComponentRef.instance.files = this.files;
  //           dialogComponentRef.instance.newItem = this.newFile;
  //           // if (!this.newEvent) {
  //           //   if (!this.fromCalendar) {
  //           //     this.event = this.cloneEvent(this.selectedEvent);
  //           //   }
  //           // }
  //           dialogComponentRef.instance.file = this.file;
  //           dialogComponentRef.instance.item_id = this.file.uid;
  //           dialogComponentRef.instance.close.subscribe(() => {
  //             dialogComponentRef.destroy();
  //             console.log('destroyed');
  //             this._ApplicationService.queryData({ type: 'files' });
  //           });
  //       }
  //     );

  //   // this.fromCalendar = false;
  //   this.newFile = false;


  //   // this.newFile = false;
  //   // let query = '?embed[]=raw&embed[]=metadata';
  //   // this._apiService.getAPIData('files', query, this.selectedFile.uid.toString())
  //   //   .subscribe(
  //   //     (data) => { this.file = data; }, // this.file.raw = atob(this.file.raw); },
  //   //     err => {
  //   //         console.log(err);
  //   //       },
  //   //     () => console.log('done')
  //   //   );

  //   // this.displayDetailDialog = true;
  // }

  // save () {
  //   if (this.newFile) {
  //     this.createFile(this.file);
  //   }
  //   if (this.event) {
  //     this.createEvent(this.event);
  //   } else {
  //     this.file.metadata = eval("("+this.file.metadata+")");
  //     this.file.raw = btoa(this.file.raw);
  //     this.updateFile(this.file.uid, this.file);
  //   }
  //   this.displayDetailDialog = false;
  //   this.displayEventDialog = false;
  //   this.file = null;
  //   this.event = null;
  // }

  Delete (){ // to be implemented by NB
    console.log(this.selectedFile);
    this._apiService.deleteAPIData('files', this.selectedFile.uid)
      .subscribe(
        (data) => { },
        (err) => { console.log(err); this._apiService.returnCodes(err); },
        () => { this._ApplicationService.queryData({ type: 'files', categories: [this._ApplicationService.getPayload()] }); }
        );
  }

  addFile(e) {
    let files = e.target.files;
    let file = files[0];
    this.fileName = file.name;
    let reader = new FileReader();
    reader.readAsDataURL(file);
    // reader.readAsText(file); // to have the content as plain text
    reader.onloadend = (file) => {
          let pattern = 'base64,';
          let base64data = reader.result.slice(reader.result.indexOf(pattern) + pattern.length);
          let payload = {
            name: this.fileName,
            raw: base64data,
            location: '/',
            dummy: false,
            categories: [this._ApplicationService.getPayload()],
            metadata: {
              onboardLocation: '',
              groundLocation: '',
              crc: ''
            }
          };
          //console.log(payload);
          this.fileUploaded.emit(payload);
    };
  }

  addDummyFile() {
    let payload = {
      name: 'dummy file-' + Moment().utc().toISOString(),
      categories: [this._ApplicationService.getPayload()],
      dummy: true,
      metadata: {
        onboardLocation: '',
        groundLocation: '',
        crc: ''
      }
    };
    this.createFile(payload);
  }

  createFile(file) {
    //console.log(file);
    this.loading = true;
    this._apiService.createAPIData('files', file)
      .subscribe(
          (response) => {this.selectedFile = response; },
          (err) => { console.log(err); this._apiService.returnCodes(err); },
          () => { this._ApplicationService.queryData({ type: 'files', categories: [this._ApplicationService.getPayload()] }); this.Edit(false); }
        );
  }

  // createEvent(event) {
  //   console.log(event);
  //   this._apiService.createAPIData('events', event)
  //     .subscribe(
  //         response => {},
  //         err => {
  //             console.log(err);
  //           },
  //         () => { }
  //       );
  // }

  // private updateFile(id, file) {
  //   // if (event.categories.length === 1) {
  //   //   this.cats= [event.categories[0]];
  //   // }
  //   // else {
  //   //   this.cats = event.categories.split(',');
  //   // }
  //   console.log(file);
  //   this._apiService.updateAPIData('files', id, file)
  //     .subscribe(
  //         (response) => { },
  //         (err) => {
  //             console.log(err);
  //           },
  //         () => this._ApplicationService.queryData({ type: 'files' })
  //       );
  // }


  nodeSelect(event) {
    console.log(event.node.data);
    this.selectedFile = event.node.data;
    this.Edit(false);

  }
  nodeUnselect(event) {

  }

  private expandAllOnboard() {
      this.OnboardFilesTree.forEach( (node) => {
          this.expandRecursive(node, true);
      } );
  }

  private collapseAllOnboard() {
      this.OnboardFilesTree.forEach( (node) => {
          this.expandRecursive(node, false);
      } );
  }

  private expandAllGround() {
    this.GroundFilesTree.forEach( (node) => {
        this.expandRecursive(node, true);
    } );
}

private collapseAllGround() {
    this.GroundFilesTree.forEach( (node) => {
        this.expandRecursive(node, false);
    } );
}

  private expandRecursive(node: TreeNode, isExpand: boolean) {
    node.expanded = isExpand;
    if (node.children) {
        node.children.forEach( (childNode) => {
            this.expandRecursive(childNode, isExpand);
        } );
    }
}

  private categoriesChanged(cats) {

  }

   private removeDuplicates(arr, prop) {
      var new_arr = [];
      var lookup  = {};

      for (var i in arr) {
          lookup[arr[i][prop]] = arr[i];
      }
  
      for (i in lookup) {
          new_arr.push(lookup[i]);
      }
  
      return new_arr;
  }
}
