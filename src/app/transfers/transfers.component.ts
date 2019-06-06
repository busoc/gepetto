import { Component, OnInit, EventEmitter, ViewChild, ViewContainerRef, Input,ComponentFactoryResolver } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Event } from '../models/event';
import { User } from '../models/user';
import { File } from '../models/file';
import { Slot } from '../models/slot';
import { Uplink } from '../models/uplink';
import { Transfer } from '../models/transfer';
import { Downlink } from '../models/downlink';
import { Category } from '../models/category';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
// import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';

import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';

import { MenuItem, AutoCompleteModule, CalendarModule , DropdownModule, TreeNode } from 'primeng/primeng';

import * as Moment from 'moment';

import { ItemDetails } from '../item-details';

@Component({
  selector: 'filetransfer-management',
  templateUrl: './transfers.component.html',
  entryComponents: [ ItemDetails ],
})
export class TransfersComponent implements OnInit {

  jwt: string;
  decodedJwt: User;
  response: string;
  api: string;

  events: SelectItem[]; // Event[] = []; // euhm, neeenn......
  transferEvents: SelectItem[] = [];
  uplinkEvents: SelectItem[] = [];

  eventHistory: Event[] = [];

  // slots: SelectItem[]; // : Slot[] = [];
  slots: Slot[] = [];
  usedSlots: Slot[] = [];

  files: any[] = []; // File[] = [];
  Files: File[] = [];

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
  newEvent: boolean;
  items: MenuItem[];

  cats: any[];
  caters: any[]; // Category[] = [];
  test: any;

  fileTransfer: Transfer;
  transfers: Transfer[] = [];
  upcomingTransfers: Transfer[] = [];
  uplinks: Uplink[] = [];
  upcomingUplinks: Uplink[] = [];
  uplink: Uplink;
  selectedSlot: any; // has to be type of Slot...
  selectedFile: any;
  selectedUplinkActivity: any;
  selectedTransferActivity: any;
  selectedDownlinkActivity: any;
  selectedUplink: any;
  location: string;
  downlink: Downlink;
  downlinks: Downlink[] = [];
  upcomingDownlinks: Downlink[] = [];
  selectedFileDownlink: any;
  selectedOnBoardFile: any; // tree model...
  selectedGroundFile: any; // is tree model...
  selectedOnboardFiles: any;
  retrievedUplink: any;
  // for categories
  categories: SelectItem[];
  MultiSelectCategories: SelectItem[];

  public errorMessage: string;
  errorType: string;

  public event_id: number;

  loading: boolean = false;
  loadingTransfers: boolean = false;
  loadingUplinks: boolean = false;

  // currentDate: Date;
  DateStartISO;
  DateEndISO;
  dateStartDOY;
  dateEndDOY;

  start: Date;
  end: Date;

  file: File;

  selectedUplinks = [];
  selectedTransfers = [];
  selectedDownlinks = [];

  OnboardFilesTree: TreeNode[] = [];
  GroundFilesTree: TreeNode[] = [];

  private fileUploaded = new EventEmitter();

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
    ) {}

  ngOnInit() {

    this.loading = true;
    this.DateStartISO = Moment.utc().toDate();
    this.DateStartISO.setHours(1);
    this.DateStartISO.setMinutes(0);
    this.dateStartDOY = Moment.utc().format('DDDD');
    this.DateEndISO = Moment.utc().toDate();
    this.DateEndISO.setHours(23);
    this.DateEndISO.setMinutes(59);
    this.dateEndDOY = Moment.utc().format('DDDD');

    this.cols = [
      { field: 'event', header: 'Event' },
      { field: 'name', header: 'Uplink File Name' },
      { field: 'dtstart', header: 'Start', sortable: 'true' },
      { field: 'dtend', header: 'End' },
      { field: 'slot', header: 'Slot' },
      { field: 'status', header: 'Status' },
      { field: 'comment', header: 'Comment' },
      // { field: 'attachement', header: 'Attach' },
      // { field: 'person', header: 'Modified by' },
      { field: 'lastmod', header: 'Last modified' },
    ];
    this.items = [
          {label: ' Edit', icon: 'fa fa-pencil-square-o', command: (event) => this.editEvent()},
          // {label: ' History', icon: 'fa-history', command: (event) => this.historyEvent()},
          // {label: ' Duplicate', icon: 'fa-clone', command: (event) => this.duplicate()},
          // {label: ' Delete', icon: 'fa fa-trash-o', command: (event) => this.delete()},
    ];

    this.start = Moment.utc().subtract(12, 'months').toDate(); // why so loooong?????
    this.end = Moment.utc().add(12, 'months').toDate();

    this.getTransfersData();
    // this._ApplicationService.queryData( { type: 'slots'} );
    // this._ApplicationService.queryData( { type: 'transfers', start: this.start, end: this.end, categories: ['solar', 'asim', 'fsl'], status: ['completed', 'scheduled'] } );
    // this._ApplicationService.queryData( { type: 'uplinks', start: this.start, end: this.end, categories: ['solar', 'asim', 'fsl'], status: ['completed', 'scheduled'] } );
    // this._ApplicationService.queryData( { type: 'downlinks', start: this.start, end: this.end, categories: ['solar', 'asim', 'fsl'], status: ['completed', 'scheduled'] } );
    
    // ASIM hardcoded for now!!!!
    // console.log(this._ApplicationService.getPayload());
    // this._ApplicationService.queryData( { type: 'files', categories: ['asim']} );

    // why still doing this??
    //this._ApplicationService.queryData( { type: 'events', categories: [this._ApplicationService.getPayload()], start: Moment.utc().subtract(20, 'days').toDate(), end: Moment.utc().add(20, 'days').toDate() } );
    //this._ApplicationService.queryData( { type: 'events', categories: ['uplink'], start: Moment.utc().subtract(20, 'days').toDate(), end: Moment.utc().add(20, 'days').toDate() } );
    //this._ApplicationService.queryData( { type: 'events', categories: ['transfer'], start: Moment.utc().subtract(20, 'days').toDate(), end: Moment.utc().add(20, 'days').toDate() } );
    

    // set and get works!
    // this._apiService.updateAPIData('users', 1, { settings: {test: 'jaja'}})
    //   .subscribe(
    //     (response) => { console.log(response); },
    //     (err) => {
    //         console.log(err);
    //       },
    //     () => {
    //     }
    // //   );
    // let test = this._ApplicationService.getUserSettings(1);
    // console.log(test);

    // this.getSlots();
    // this.getFiles();
    // this.getTransfers();
    // this.getEvents(this.DateStartISO.toISOString(), this.DateEndISO.toISOString()); // '2016-12-19T00:00:00Z','2016-12-19T23:59:59Z');

    // subscribe to events created by other services/components
    // this._ApplicationService.payloadChange
    //     .subscribe( (data) => { this.getEvents(this.DateStartISO.toISOString(), this.DateEndISO.toISOString()); });
    this._ApplicationService.itemsUpdated
        .subscribe( (data) => {
          switch (data.type) {
            case 'events':
              this.events = data.data;
              this.transferEvents = [];
              this.uplinkEvents = [];
              this.events.forEach((event) => {
                if (event.value.categories.includes('uplink') && event.value.dtstart > Moment.utc().subtract(2, 'days').toDate()) {
                  this.uplinkEvents.push(event);
                }
                if (event.value.categories.includes('transfer') && event.value.dtstart > Moment.utc().subtract(2, 'days').toDate()) {
                  this.transferEvents.push(event);
                }
              });
              this._ApplicationService.sortObj(this.uplinkEvents, 'dtstart');
              this._ApplicationService.sortObj(this.transferEvents, 'dtstart');
              break;
            case 'files':
              this.files = data.data;
              this.OnboardFilesTree = this._ApplicationService.createOnboardDataTree(this.files);
              this.GroundFilesTree = this._ApplicationService.createGroundDataTree(this.files);
              this.loading = false; // this.renamingCommands(this.files);          
                // data.data.forEach((file) => {
                //     if (file.dummy === true) {
                //       this.files.push(file);
                //     }
                // });
              break;
            case 'slots':
              this.slots = [...data.data];
              this._ApplicationService.sortObj(this.slots, 'uid');
              this.usedSlots = [];
              this.slots.forEach((slot) => {
                if (!slot.file) {
                  this.usedSlots.push(slot);
                }
              });
              this.usedSlots = [...this.usedSlots];
              break;
            case 'categories':
              this.categories = [...data.data];
              break;
            case 'transfers':
              this.transfers = [...data.data];
              //console.log(this.transfers);
              this.upcomingTransfers = [];
              this.transfers.forEach((transfer) => {
                if (transfer.status !== 'completed') {
                  this.upcomingTransfers.push(transfer);
                }
              });
              this.upcomingTransfers = [...this.upcomingTransfers];
              //console.log(this.upcomingTransfers);
              this.loadingTransfers = false;
              break;
            case 'uplinks':
              this.uplinks = [...data.data];
              //console.log(this.uplinks);
              this.upcomingUplinks = [];
              this.uplinks.forEach((uplink) => {
                if (uplink.status !== 'completed') {
                  this.upcomingUplinks.push(uplink);
                }
              });
              this.upcomingUplinks = [...this.upcomingUplinks];
              this.loadingUplinks = false;
              //console.log(this.upcomingUplinks);
              break;
            case 'downlinks':
              this.downlinks = [...data.data];
              this.upcomingDownlinks = [];
              this.downlinks.forEach((downlink) => {
                if (downlink.status !== 'completed' && !downlink.event.summary.includes('U/L')) { // temp fix for downlink showing when it is an uplink
                  this.upcomingDownlinks.push(downlink);
                }
              });
              this.upcomingDownlinks = [...this.upcomingDownlinks];
              break;
            default:
          }
        },
        (err) => {
              console.log(err);
            },
        () => { this.loading = false; }
        );

    this._ApplicationService.payloadChange
      .subscribe( (data) => {
        this.loading = true;
        this.uplinks = []; // data clearen. zou eigenlijk een empty array moeten teruggeven en dan updaten geeft ook geen content ipv niks teruggeven he...
        this.downlinks = [];
        this.transfers = [];
        this.events = [];
        this.files = [];
        this.upcomingDownlinks = [];
        this.upcomingTransfers = [];
        this.upcomingUplinks = [];
        this.OnboardFilesTree = [];
        this.GroundFilesTree = [];
        this.getTransfersData();
      });
    
    this.fileUploaded.subscribe((file) => this.createFile(file));
  }

  dateSelected(event){
    //console.log(this.currentDateStartYMDDateType.toISOString());
    // this.currentDateEndYMDDateType.setHours(24);
    // this.currentDateEndYMDDateType.setMinutes(59);
    console.log(this.DateStartISO.toISOString());
    console.log(this.DateEndISO.toISOString());
    this.getEvents(this.DateStartISO.toISOString(), this.DateEndISO.toISOString());
    //console.log(this.currentDateEndYMDDateType.toISOString());
    //console.log(this.currentDateStartYMDDateType.getFullYear() + '-' + this.currentDateStartYMDDateType.getMonth() + '-' + this.currentDateStartYMDDateType.getDay());
  }

  fileTreeSelect(file) {
    // console.log(file);
    // console.log(this.selectedGroundFile);
    this.selectedFile = file.node.data;
    this.Edit(false);
  }

  wipeSelectedFilesOnboard() { // update the onboardLocation field to: ''
    let queries = [];
    console.log(this.selectedOnboardFiles);
    if (this.selectedOnboardFiles) {
      this.selectedOnboardFiles.forEach((file) => {
        if (file.data.uid) {
          queries.push({
            url: '/files/' + file.data.uid,
            file: file.data.metadata.onboardLocation,
            body: {
              metadata: {
                onboardLocation: ''
              }
            }
          })
        } 
      });
    this.selectedOnboardFiles.forEach((file) => {
        if (file.data.uid) {
          queries.push({
            url: '/files/' + file.data.uid,
            file: file.data.metadata.onboardLocation,
            body: {
              metadata: {
                onboardLocation: ''
              }
            }
          })
        } 
      });
      console.log(queries);
      this._apiService.updateMultipleHourglassData(queries)
      .subscribe(
          (response) => { 
            response.forEach((file) => {
              this.notificationService.addAlert('success', file.name + ' removed from ' + this._ApplicationService.getPayload().toUpperCase());
            });
          },
          (err) => { console.log(err); },
          () => {
            this._ApplicationService.queryData( { type: 'files', categories: [this._ApplicationService.getPayload()] });
            this.selectedOnboardFiles = [];
          }
      );         
    } else {
      alert('Select files to wipe.');
    }
  }

  Edit(newItem: boolean, duplicate: boolean = false) {
    // console.log(this._ApplicationService.getUsers());
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

  createFile(file) {
    this.loading = true;
    this._apiService.createAPIData('files', file)
      .subscribe(
          (response) => {this.selectedFile = response; },
          (err) => { console.log(err); this._apiService.returnCodes(err); },
          () => { this._ApplicationService.queryData({ type: 'files', categories: [this._ApplicationService.getPayload()] }); this.Edit(false); }
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

  // showDialogToAdd(event) {
  //   // start of transfer test
  //   // let test = {
  //   //   event: 3,
  //   //   slot: 4,
  //   //   attachment: 4,
  //   //   status: 'scheduled'
  //   // };
  //   // this._apiService.createAPIData('transfers', test)
  //   //   .subscribe(
  //   //       response => { console.log(response); },
  //   //       err => {
  //   //           console.log(err);
  //   //         },
  //   //       () => {  }
  //   //     );
  //   // end of tests
  //   // this.getCategories();
  //   // this.getEvents('2017-01-01T00:00:21.189Z', '2017-05-01T00:00:21.189Z'); // all events for now.
  //   // this.getSlots();
  //   // this.getFiles();
  //   this._ApplicationService.queryData( { type: 'files'} );
  //   this._ApplicationService.queryData( { type: 'events'} );
  //   // this.newEvent = true;
  //   this.uplink = new Uplink();
  //   // console.log(this.event);
  //   // console.log(this.event.metadata.parameter);
  //   this.displayDetailDialog = true;

  // }

  editEvent() {
    this.getCategories();
    this.newEvent = false;
    this.event = this.cloneEvent(this.selectedEvent); // fetch event met alle opties zoals parameters...
    this.event_id = this.event.uid;
    console.log(this.categories);
    console.log(this.event.categories); // transponeer dit naar label ,value waarden (moet in .map gebeuren...)
    // temp solution voor categories display
    this.test = {
      label: this.event.categories,
      value: this.event.categories
    }
    // end of temp solution
    this.displayDetailDialog = true;
  }

  historyEvent() {
    this.newEvent = false;
    this.event = this.cloneEvent(this.selectedEvent);
    this.event_id = this.event.uid;

    this._apiService.getAPIData('events', '?embed[]=history' , String(this.selectedEvent.uid))
      .subscribe(
        (data) => { this.eventHistory = data.history; },
        err => { console.log(err); }
      );
    this.displayHistoryDialog = true;
  }

  revertEvent() {
    // should be able to access the uid of the main event...
    this.event = this.cloneEvent(this.selectedPastEvent);
    this.updateEvent(this.event_id, this.event);
    this.event = null;
    this.displayHistoryDialog = false;
  }

  createTransfer () {
    // console.log(this.uplinks[0]);
    // if (!this.selectedUplink) { // why do you did nu....
    //   this.selectedUplink = this.uplinks[0];
    // }
    // if (!this.selectedTransferActivity) {
    //   this.selectedTransferActivity = this.transferEvents[0];
    // }
    try {
      let transferEvent = new Transfer(
        this.selectedTransferActivity.uid,
        this.selectedUplink.uid,
        this.location,
      );
      // console.log(this.selectedUplink.file.uid);
      this._apiService.createAPIData('transfers', transferEvent)
        .subscribe(
            (response) => { console.log(response); this.notificationService.addAlert('success', 'transfer created');},
            (err) => {
                console.log(err);
                this.notificationService.addAlert('error', err, true);
              },
            () => { this.getTransfersData(); }
          );     
    } catch(err) {
      this.notificationService.addAlert('error', 'Error creating transfer. ' + err, true);
    }

  }

  createUplink () {
    // if (!this.selectedFile) {
    //   this.selectedFile = this.files[0];
    // }
    console.log(this.selectedGroundFile);
    try {
      if (!this.selectedSlot) {
        this.selectedSlot = this.slots[0];
      }
      if (!this.selectedUplinkActivity) {
        this.selectedUplinkActivity = this.uplinkEvents[0];
      }
      let uplinkEvent = new Uplink(
        this.selectedUplinkActivity.uid,
        this.selectedGroundFile.data.uid, // this.selectedFile.uid,
        this.selectedSlot.uid
      );
      console.log(uplinkEvent);
      this._apiService.createAPIData('uplinks', uplinkEvent)
        .subscribe(
            (response) => { console.log(response); this.notificationService.addAlert('success', 'uplink created');},
            (err) => {
                console.log(err);
                this.notificationService.addAlert('error', err, true);
              },
            () => { this.getTransfersData(); }
          );       
    } catch(err) {
      this.notificationService.addAlert('error', 'Error creating uplink. ' + err, true);
    }

  }

  createUplinkTransfer() {
    // console.log(this.selectedGroundFile);
    try {
      let uplinkEvent = new Uplink(
        this.selectedUplinkActivity.uid,
        this.selectedGroundFile.data.uid,
        this.selectedSlot.uid
      );
      console.log(uplinkEvent);
      this._apiService.createAPIData('uplinks', uplinkEvent)
        .subscribe(
            (response) => { this.retrievedUplink = response; console.log(response); this.notificationService.addAlert('success', 'uplink created'); },
            (err) => {
                console.log(err); this.notificationService.addAlert('error', err, true);
              },
            () => {
              let transferEvent = new Transfer(
                this.selectedTransferActivity.uid,
                this.retrievedUplink.uid,
                this.location,
              );
              this._apiService.createAPIData('transfers', transferEvent)
                .subscribe(
                    (response) => { console.log(response); this.notificationService.addAlert('success', 'transfer created'); },
                    (err) => {
                        console.log(err); this.notificationService.addAlert('error', err, true);
                      },
                    () => {
                      // this.getTransfersData();
                      this._ApplicationService.queryData( { type: 'transfers', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
                      this._ApplicationService.queryData( { type: 'uplinks', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
                    }
                  );
            }
          );      
    } catch(err) {
      this.notificationService.addAlert('error', 'Error creating uplink/transfer. ' + err, true);
    }

  }


  createDownlink () {
    // if (!this.selectedFile) {
    //   this.selectedFile = this.files[0];
    // }

    if (!this.selectedSlot) {
      this.selectedSlot = this.slots[0];
    }
    if (!this.selectedDownlinkActivity) {
      this.selectedDownlinkActivity = this.transferEvents[0];
    }
    let downlinkEvent;
    try {
      downlinkEvent = new Downlink(
          this.selectedDownlinkActivity.uid,
          this.selectedOnBoardFile.data.uid, //this.selectedFile.uid,
          this.selectedSlot.uid
        );   
        this._apiService.createAPIData('downlinks', downlinkEvent)
          .subscribe(
              (response) => { console.log(response); this.notificationService.addAlert('success', 'downlink created'); },
              (err) => {
                  console.log(err);
                  this.notificationService.addAlert('error', err, true);
                },
              () => { this.getTransfersData(); }
            );           
    } catch(err) {
      this.notificationService.addAlert('error', 'Error creating downlink. ' + err, true);
    }

  }

  markUplinksComplete () {
    this.selectedUplinks.forEach((uplink, index) => {
      this.loadingUplinks = true;
      this._apiService.updateAPIData('uplinks', uplink.uid, 'completed')
        .subscribe(
            (response) => { console.log(response); this.notificationService.addAlert('success', 'uplink completed'); },
            (err) => {
                console.log(err);
                this.notificationService.addAlert('error', err, true);
              },
            () => {
              if (index === this.selectedUplinks.length - 1) {
                this._ApplicationService.queryData( { type: 'uplinks', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
              }
            }
          );
    });
  }

  markTransfersComplete () {
    this.selectedTransfers.forEach((transfer, index) => {
      this.loadingTransfers = true;
      this._apiService.updateAPIData('transfers', transfer.uid, 'completed')
        .subscribe(
            (response) => { console.log(response); },
            (err) => {
                console.log(err);
                this.notificationService.addAlert('error', err, true);
              },
            () => {
              this._apiService.updateAPIData('files', transfer.file.uid, { metadata: { onboardLocation: transfer.location } })
              .subscribe(
                (response) => { console.log(response); this.notificationService.addAlert('success', 'transfer completed'); },
                (err) => { console.log(err); this.notificationService.addAlert('error', err.text()), true},
                () => {
                  if (index === this.selectedTransfers.length - 1) {
                    // this.getTransfersData(); // try to avoid... lots of data
                    this._ApplicationService.queryData( { type: 'transfers', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
                  }
                }
              );
            }
          );
    });
  }

  markDownlinksComplete () { // forkjoin please...
    this.selectedDownlinks.forEach((downlink) => {
      this._apiService.updateAPIData('downlinks', downlink.uid, 'completed')
        .subscribe(
            (response) => { console.log(response); },
            (err) => {
                console.log(err);
                this.notificationService.addAlert('error', err, true);
              },
            () => { this.getTransfersData();
            }
          );
    });
  }

  // delete (){
  //   this._apiService.deleteAPIData('events', this.selectedEvent.uid)
  //     .subscribe(
  //       (data) => {},
  //       err => { console.log(err); },
  //       () => { this.getEvents(this.DateStartISO.toISOString(), this.DateEndISO.toISOString()); }
  //     );
  //   this.displayDetailDialog = false;
  // }

  // duplicate() {
  //   this.event = this.cloneEvent(this.selectedEvent);
  //   this.createEvent(this.event);
  //   this.event = null;
  // }

  logout() {
    localStorage.removeItem('gpt_token');
    this.router.navigate(['login']);
  }

  cloneEvent(c: Event): Event { // pak deepclone ding
      let event = new Event();
      for (let prop in c) {
          event[prop] = c[prop];
      }
      return event;
    }

  getEvents(start, end) {
      let pl = this._ApplicationService.getPayload();
      let query = '?dtstart=' + start + '&dtend=' + end + '&category[]=' + pl;
      this.events = [];
      this.events.push({label: 'Select Activity', value: null});
      this._apiService.getAPIData('events', query)
      .subscribe(
          (data) => {
            for (let d in data) {
               this.events.push({label: data[d].summary, value: data[d].uid });
            }
           },
          err => {
              console.log(err);
            }
        );
  }

  createEvent(event) {
      this._apiService.createAPIData('events', event)
      .subscribe(
          response => {},
          err => {
              console.log(err);
            },
          () => { this.getEvents(this.DateStartISO.toISOString(), this.DateEndISO.toISOString()); }
        );
  }

  updateEvent(id, event) {
      // this.event.metadata.parameter = 'update';
        this._apiService.updateAPIData('events', id, event)
      .subscribe(
          response => { },
          err => {
              console.log(err);
            },
          () => this.getEvents(this.DateStartISO.toISOString(), this.DateEndISO.toISOString())
        );
  }

  getCategories() {
    this.categories = [];
    this._apiService.getAPIData('categories')
      .subscribe(
        (data) => {
          for (let d in data) {
            this.categories.push({label: data[d].name, value: data[d].name});
          }
        }
      );
  }

  private downloadFiles() {
    console.log(this.selectedUplinks);
    let FileSaver = require('file-saver');
    let blob = new Blob([this.selectedUplinks[0].file.raw], {type: 'binary'}); // change type!!!
    // console.log(this.item.name);
    FileSaver.saveAs(blob, this.selectedUplinks[0].dropbox);
  }

  // getSlots() {
  //   let pl = this._ApplicationService.getPayload();
  //   let query = '?&category[]=' + pl;
  //   this.slots = [];
  //   this.slots.push({label: 'Select slot', value: null});
  //   this._apiService.getAPIData('slots', query)
  //     .subscribe(
  //       (data) => {
  //         this.slots = data;
  //         for (let d in data) {
  //           this.slots.push({label: data[d].name, value: data[d].uid });
  //         };
  //         // console.log(this.slots);
  //        }
  //     );
  // }

  // getFiles() {
  //   let pl = this._ApplicationService.getPayload();
  //   let query = '?&category[]=' + pl;
  //   this.files = [];
  //   this.files.push({label: 'Select file', value: null});
  //   this._apiService.getAPIData('files', query)
  //     .subscribe(
  //       (data) => {
  //         this.Files = data;
  //         for (let d in data) {
  //           this.files.push({label: data[d].summary, value: data[d].uid});
  //         };
  //         console.log(this.files);
  //        }
  //     );
  // }

  getTransfersData() { // doe eens in parrallel...
    this._ApplicationService.queryData( { type: 'transfers', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
    this._ApplicationService.queryData( { type: 'uplinks', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
    this._ApplicationService.queryData( { type: 'downlinks', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
    this._ApplicationService.queryData( { type: 'events', start: this.start, end: this.end, categories: ['uplink', 'transfer'] } ); // normally getpayload should be added, but hg does not do an AND function
    this._ApplicationService.queryData( { type: 'slots', start: this.start, end: this.end, categories: [this._ApplicationService.getPayload()], status: ['scheduled'] } );
    this._ApplicationService.queryData( { type: 'files', categories: [this._ApplicationService.getPayload()] } );
  }

  // getTransfers() {
  //   // let pl = this._ApplicationService.getPayload();
  //   // let query = '?&category[]=' + pl;
  //   // this.files = [];
  //   // this.files.push({label: 'Select file', value: null});
  //   this._apiService.getAPIData('transfers')
  //     .subscribe(
  //       (data) => {
  //         this.transfers = data;
  //         console.log(data);
  //        },
  //        err => {console.log(err); }
  //     );
  // }

  generateUplinkICN() {
    console.log(this.selectedUplinks);
    if (!this.selectedUplinks[0]) {
      alert('please select at least one uplink')
    } else {
      // special asim case to have one ICN with all the uplink/transfer info.
      if (this.selectedUplinks[0].event.summary == 'DMS-ASIM FILE-U&XFER') {
        let content = 'Title: ' + this.selectedUplinks[0].slot.category.toUpperCase() + ' files for uplink and transfer on GMT' + Moment(this.selectedUplinks[0].event.dtstart).utc().format('DDDD/HH:mm')  + '\n\nTo: COL FD, B-USOC-OPS, STRATOS\n\n\nB.USOC would like to uplink and transfer the following file(s) from the dropbox to ' + this.selectedUplinks[0].slot.category.toUpperCase() + ' (' + this.selectedUplinks[0].event.summary + ' on GMT' + Moment(this.selectedUplinks[0].event.dtstart).utc().format('DDDD/HH:mm') + '):\n\n\n';
        this.selectedUplinks.forEach((file) => {
          //if (file.slot && file.file.metadata) {
            let line = 'Filename: ' + file.dropbox + '\n';
            line = line + 'File Size: ' + file.file.length + '\n';
            line = line + 'Checksum: ' + file.file.sum + '\n';
            line = line + 'Location: /esa/mission/uplink\n\n';
            content = content + line;
          //}
        });
        let FileSaver = require('file-saver');
        let blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'Uplink-ICN-GMT' + Moment(this.selectedUplinks[0].event.dtstart).utc().format('DDDD_HH:mm') + '.txt'); 
      } else {
        let content = 'Title: ' + this.selectedUplinks[0].slot.category.toUpperCase() + ' files for uplink on GMT' + Moment(this.selectedUplinks[0].event.dtstart).utc().format('DDDD/HH:mm')  + '\n\nTo: COL FD, B-USOC-OPS, STRATOS\n\n\nB.USOC would like to uplink the following file(s) from the dropbox to ' + this.selectedUplinks[0].slot.category.toUpperCase() + ' (' + this.selectedUplinks[0].event.summary + ' on GMT' + Moment(this.selectedUplinks[0].event.dtstart).utc().format('DDDD/HH:mm') + '):\n\n\n';
        this.selectedUplinks.forEach((file) => {
          //if (file.slot && file.file.metadata) {
            let line = 'Filename: ' + file.dropbox + '\n';
            line = line + 'File Size: ' + file.file.length + '\n';
            line = line + 'Checksum: ' + file.file.sum + '\n';
            line = line + 'Location: /esa/mission/uplink\n\n';
            content = content + line;
          //}
        });
        let FileSaver = require('file-saver');
        let blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'Uplink-ICN-GMT' + Moment(this.selectedUplinks[0].event.dtstart).utc().format('DDDD_HH:mm') + '.txt');        
      }

    }
  }


  generateTransferICN() {
    console.log(this.selectedTransfers);
    if (!this.selectedTransfers[0]) {
      alert('please select at least one transfer')
    } else {
      let content = 'Title: ' + this.selectedTransfers[0].slot.category.toUpperCase() + ' files for transfer on GMT' + Moment(this.selectedTransfers[0].event.dtstart).utc().format('DDDD/HH:mm')  + ')\n\nTo: COL FD, B-USOC-OPS, STRATOS\n\n\nB.USOC would like to transfer the following file(s) from the MMU to ' + this.selectedTransfers[0].slot.category.toUpperCase() + ' (' + this.selectedTransfers[0].event.summary + ' on GMT' + Moment(this.selectedTransfers[0].event.dtstart).utc().format('DDDD/HH:mm') + '):\n\n\n';
      this.selectedTransfers.forEach((file) => {
        //if (file.slot && file.file.metadata) {
          let line = 'Filename: ' + file.slot.name.toUpperCase() + '\n';
          line = line + 'File Size: ' + file.file.length + '\n';
          line = line + 'Checksum: ' + file.file.sum + '\n';
          line = line + 'Rename to: ' + file.file.metadata.onboardLocation + '\n\n';
          content = content + line;
        //}
      });
      let FileSaver = require('file-saver');
      let blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
      FileSaver.saveAs(blob, this._ApplicationService.getPayload().toUpperCase() + '_file-XFER-ICN.txt');
    }

  }

  generateDownlinkICN() {
    console.log(this.selectedDownlinks);
    let content = 'Title: ' + this.selectedDownlinks[0].slot.category.toUpperCase() + ' MMU to Col MMU file transfer on GMT' + Moment(this.selectedDownlinks[0].event.dtstart).format('DDDD').toString() + '/' + this.selectedDownlinks[0].event.dtstart.getHours() + ':' + this.selectedDownlinks[0].event.dtstart.getMinutes() + '\n\nTo: COL FD, B-USOC-OPS, STRATOS\n\n\nPlease find below the information for the files to be transferred from ' + this.selectedDownlinks[0].slot.category.toUpperCase() + ' MMU to COL MMU on GMT' + Moment(this.selectedDownlinks[0].event.dtstart).format('DDDD').toString() + '/' + this.selectedDownlinks[0].event.dtstart.getHours() + ':' + this.selectedDownlinks[0].event.dtstart.getMinutes() + '\n\n\n';
    content = content + this.selectedDownlinks[0].slot.category.toUpperCase() + ' MMU FILE NAMES: \nFilename | SID OpsName\n\n';
    this.selectedDownlinks.forEach((file) => {
      //if (file.slot && file.file.metadata) {
        let line = file.slot.name.toUpperCase() + ' | ' + file.slot.uid + ' | ' + file.slot.file + '\n\n';
        content = content + line;
      //}
    });
    let FileSaver = require('file-saver');
    let blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
    FileSaver.saveAs(blob, this._ApplicationService.getPayload().toUpperCase() + '_file-XFER-ICN.txt');
  }

  downloadCommandStack() {
    let commands = '';
    commands = commands + 'issue_tc (ITEM : ' + this._ApplicationService.getPayload().toUpperCase() + '_Cmd_File_Ls(PCTS_TID :18 , PCTS_FID : 73, PCTS_HEADER1  : 32769, PCTS_HEADER2  : 51273));\n';
    this.selectedTransfers.forEach((file) => {
      //if (file.slot && file.file.metadata) {
        let temp = file.file.metadata.onboardLocation.substring(file.file.metadata.onboardLocation.indexOf('/') + 1);
        temp = temp.substring(temp.indexOf('/') + 1);
        temp = '/' + temp;
        let command = 'issue_tc (ITEM : '+ this._ApplicationService.getPayload().toUpperCase() + '_Cmd_SSL_File_MOVE(PCTS_TID : 18,PCTS_FID : 71, PCTS_HEADER1 : 32769, PCTS_HEADER2  : 51271, PCTS_FROMFILE : \"' + file.slot.name.toUpperCase() + '\", PCTS_TOFILE   : \"' + file.file.name + '\"));\n';
        commands = commands + command;
      //}
    });
    commands = commands + 'issue_tc (ITEM : ' + this._ApplicationService.getPayload().toUpperCase() + '_Cmd_File_Ls(PCTS_TID :18 , PCTS_FID : 73, PCTS_HEADER1  : 32769, PCTS_HEADER2  : 51273));\n';
    // MVIS specific:
    // commands = commands + 'issue_tc (ITEM : FSL_Cmd_INTMIL_Select_File_Transfer(PCTS_TID : 13, PCTS_FID : 8));\n';
    // this.selectedUplinks.forEach((file) => {
    //   if (file.slot && file.file.metadata) {
    //     let temp = file.file.metadata.onboardLocation.substring(file.file.metadata.onboardLocation.indexOf('/') + 1);
    //     temp = temp.substring(temp.indexOf('/') + 1);
    //     temp = '/' + temp;
    //     let command = 'issue_tc (ITEM : FSL_Cmd_INTMIL_Set_Mil_File(PCTS_TID : 13, PCTS_FID : 65, PCTS_SUBSYS : 1, PCTS_REMTADDR : 26, PCTS_SUBADDRC : 25, PCTS_SUBADDRE : 26, PCTS_READWR : 1, PCTS_FILLER : 255, PCTS_FILECRC : 42260, PCTS_LENGTHF : \"' + file.file.length + '\" , PCTS_FILENAME : \"' + temp + '\", PCTS_FILENAME1 : \"' + file.file.name + '\", PCTS_FILLER1 : 0));\n';
    //     commands = commands + command;
    //     commands = commands + 'issue_tc (ITEM : FSL_Cmd_INTMIL_Filetransfer_Start(PCTS_TID : 13, PCTS_FID : 5));\n';
    //   }
    // });
    // end of MVIS specific
    let FileSaver = require('file-saver');
    let blob = new Blob([commands], {type: 'text/plain;charset=utf-8'});
    FileSaver.saveAs(blob, this._ApplicationService.getPayload().toUpperCase() + '_file_renaming_commandstack.ms');
  }

}
