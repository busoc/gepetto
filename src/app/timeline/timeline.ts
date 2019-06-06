import { Component, OnInit, EventEmitter, HostListener , ComponentFactoryResolver , ViewChild, ViewContainerRef, ElementRef, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Event } from '../models/event';
import { User } from '../models/user';
import { Settings } from '../models/settings';
import { ItemDetails } from '../item-details';
import { CountdownComponent } from '../countdown';
import { Slot } from '../models/slot';
import { Category } from '../models/category';
import { TimelineBand } from '../models/timelineband';
import { Timeline } from '../models/timeline';
import { Observable, Subscription } from 'rxjs';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';
import { TimelineService } from '../services/timeline.service';
import { MenuItem, CheckboxModule, InputTextareaModule, TabViewModule, GMapModule } from 'primeng/primeng';
import { $WebSocket, WebSocketSendMode } from 'angular2-websocket/angular2-websocket';
import * as settingsFile from 'assets/settings/app-settings.json';
import { addDays, Timeline as YamcsTimeline } from '@yamcs/timeline';
import * as html2canvas from 'html2canvas';
import Moment from 'moment';
import { MessageService } from 'primeng/api';
// Google
declare const gapi: any;

@Component({
    selector: 'timeline',
    entryComponents: [ ItemDetails, CountdownComponent ],
    templateUrl: './timeline.html',
    styleUrls: ['./timeline.css'],
    host: {'(body:click)': 'this.closeEventMenu()'}
})

export class TimelineViewer implements OnInit {

    public selectedTimelineLabel: string;
    public centerName: string = '';
    public GMTcenter: string = '';
    public t;
    public eventMenuOptions: MenuItem[];
    public showEventMenu: boolean = false;
    public relocate_date: Date;
    public selectedSequence: any; // create model of a sequence
    public bands: any = []; // model needed!
    public timelineSettings: string;
    public bandLabel: string;
    public bandToAdd: any;
    private yamcsParameters: SelectItem[] = [];
    private api: string;
    private asim_events: Event[] = [];
    private asimActivitySequences: SelectItem[];
    private asimActivityTemplates: SelectItem[];


    private busoc_events: Event[] = [];
    private BUSOCCalendar= '50jcsehmtgugjlg33o2h69dg5s@group.calendar.google.com'; // what the hell is this one??
    private BUSOCCalendarDeadlines = 'isoggqvjv4k409fk8g7ulelkhc@group.calendar.google.com';
    private BUSOCCalendarINC = '53d3j8qarolfeohn1k7vahdakc@group.calendar.google.com';
    private BUSOCCalendarMain = 'uunb9cv1v8q5o6j7aule66ukno@group.calendar.google.com';
    private BUSOCCalendarSATeamOverview = '7hfjqvdm01j7049fc2brssdcro@group.calendar.google.com';
    private categories: SelectItem[];
    private category_id: number;
    private category: Category;
    private clickedOnEvent: boolean = false;
    private clientID = '586478867644-gvrn498iao3uuu92r13ps13iaaqk99nb.apps.googleusercontent.com';
    private countdown: string;
    private dataHasLoaded = new EventEmitter();
    private dataLoaded: boolean = false;
    private datepickerEl;
    private decodedJwt: User;
    private displayDetailDialog: boolean;
    private events: Event[] = [];
    private fanSpeed: string = '0';
    private firstTime: boolean;
    private fsl_events: Event[] = [];
    private fsl_meetings_events: Event[] = [];
    private getGoogle: number = 0;
    private getShiftPlanner: number = 0;
    private GMTcursor: string = '000';
    private goforGoogleLoading: boolean = false;
    private increment_events: Event[] = [];
    private increment_integration_events: Event[] = [];
    private incrementStart: Date;
    private instanceTelemetry: SelectItem[] = [];
    private jwt: string;
    private kuCountdown: string;
    private listOfBands: TimelineBand[]; // asdf
    private mapOptions: any;
    private mxgsBand: number;
    private MXGSModes: Event[] = [];
    private myBands: any = [];
    private newCategory: boolean;
    private newTimelineLabel: string;
    private optimisBands: SelectItem[] = [];
    private pointedTime: Date;
    private previousEnd: Date;
    private previousStart: Date;
    private rangeSpanEl;
    private response: string;
    private saaData: boolean = false;
    private scopes = 'https://www.googleapis.com/auth/calendar';
    private sCountdown: string;
    private selectedBand: any;
    private selectedCategories: string[];
    private selectedCategory: Category;
    private selectedTimeline: Timeline;
    private selectedTimelineEvent: Event;
    private selectedTM: any;
    private selectSlot: Slot;
    private settingsBoolean: Boolean = false;
    private slots: Slot[] = [];
    private solarEvents: any[];
    private solarTemp: any[];
    private subscribeHourglass: Subscription;
    private subscribeYamcsTM: Subscription;
    private targetEl;
    private TDRS: Event[] = [];
    private testColor: string;
    private timelineBands: TimelineBand[];
    private timelines: Timeline[] = [];

    private timerSubscription: Subscription;
    private tmValue: string;
    private userTimeZone = 'Paris';
    private ws: $WebSocket;
    private yamcsInstance: string;
    private yamcsInstances: SelectItem[] = [];
    private yamcsUnreachable: boolean = false;

    @ViewChild('ItemDetailsAnchor', {read: ViewContainerRef}) private ItemDetailsAnchor: ViewContainerRef;
    @ViewChild('CountdownAnchor', {read: ViewContainerRef}) private CountdownAnchor: ViewContainerRef;
    @ViewChild('menu') private el: ElementRef;
 
    constructor(
        public router: Router,
        public http: HttpClient,
        private _apiService: ApiService,
        private _notificationService: NotificationService,
        private _ApplicationService: ApplicationService,
        private resolver: ComponentFactoryResolver,
        private _TimelineService: TimelineService,
        private renderer: Renderer2,
        private messageService: MessageService
    ) {}
    private ngOnInit() {
        this.eventMenuOptions = [
                { label: 'Edit', command: (onclick) => (this.showEventMenu = false, this.editEvent(this.selectedTimelineEvent, false)) },
                { label: 'Mark complete', command: (onclick) => (this.showEventMenu = false, this.markEventComplete(this.selectedTimelineEvent)) },
                { label: 'Duplicate', command: (onclick) => (this.showEventMenu = false, this.duplicateEvent(this.selectedTimelineEvent))},
                { label: 'Delete', command: (onclick) => (this.showEventMenu = false, this.deleteEvent(this.selectedTimelineEvent))},
                { label: 'Append activity', command: (onclick) => (this.showEventMenu = false, this.appendEvent(this.selectedTimelineEvent))},
        ];
        this.timelineBands = settingsFile.TimelineBands;
        this.centerName = settingsFile.ControlCenterSpecs.centerName;
        this._ApplicationService.sortObj(this.timelineBands, 'label');
        // this.asimActivitySequences = settingsFile.ASIMEventSequences;
        // this._ApplicationService.sortObj(this.asimActivitySequences, 'label');
        // this.asimActivityTemplates = settingsFile.ASIMEventTemplates;

        if (this._ApplicationService.getSettings().timelines) {
            this.timelines = this._ApplicationService.getSettings().timelines;
        } else {
            this.timelines = settingsFile.defaultTimelines;
        }
        if (this._ApplicationService.getSettings().selectedTimeline) {
            let mytimeline: string = this._ApplicationService.getSettings().selectedTimeline;
            this.selectedTimelineLabel = mytimeline;
            this.selectedTimeline = this.timelines.find((o) => o.label === mytimeline);
            this.bands = this.selectedTimeline.value.bands;
        } else {
            this.selectedTimeline = this.timelines[0];
            this.selectedTimelineLabel = this.timelines[0].label;
        }
        this.newTimelineLabel = this.selectedTimelineLabel;
        this.bandToAdd = this.timelineBands[0];

        // refresh timeline data - leak?
        Observable.interval(1000 * 600).subscribe((x) => {
                if (this._ApplicationService.getRoute()[0].outlets.mainnav === 'timeline') {
                this.t.reveal(this.t.visibleCenter);
                }
            });
        // this.categories = [...this._ApplicationService.getCategories()];
        //   this._apiService.getYamcsInstances()
        //         .subscribe(
        //             (data) => {
        //                 console.log(data);
        //                 data.forEach((instance) => {
        //                     this.yamcsInstances.push({label: instance.name, value: instance.name});
        //                 });
        //             },
        //             (err) => {
        //                 console.log(err);
        //                 this.yamcsInstances = [
        //                     { label: 'fsl-ops', value: 'fsl-ops' },
        //                     { label: 'fsl-em', value: 'fsl-em' },
        //                     { label: 'fsl-sim', value: 'fsl-sim' },
        //                     { label: 'asim-gm', value: 'asim-gm' },
        //                 ]
        //             },
        //             () => { }
        //         );
        this._ApplicationService.itemsUpdated // dit is enkel maar indien dit de eerst te laden pagina was. oplossing: altijd naar default front page?
        .subscribe( (data) => {
            switch (data.type) {
                case 'events': this.events = data.data;
                    break;
                case 'categories': this.categories = [...data.data];
                    break;
                default:
            }
        });

        let categorieen = this.categories;
        let tdrs = this.TDRS;
        let that = this; // foefelare...
        this.targetEl = document.getElementById('timeline');
        this.rangeSpanEl = document.getElementById('current-range');
        // let startDate = Moment.utc().toDate();
        let startconditions = this._ApplicationService.getSettings();
        let startDate: Date;
        let startZoom: number;
        try {
            // startDate = startconditions.timelineView.start;
            // startZoom = startconditions.timelineView.zoom;
            startDate = Moment.utc().toDate();
            startZoom = 12;
        } catch (e) {
            startDate = Moment.utc().toDate();
            startZoom = 12;
        }
        that.t = new YamcsTimeline(this.targetEl, {
            initialDate: startDate, // this.getRequestedStart() || '2018-04-01T07:40:00Z', // to get it from the url
            zoom: startZoom, // 8, // this.getRequestedZoom() || 5, // to get it from the url
            sidebarWidth: 150,
            style: {
                // gutterWidth: 150,
                bandHeight: 30,
            },
            tracker: 'location', // location, event, or all
            // domReduction: false, // true makes the time band go wacko in Chrome
            pannable: 'X_ONLY',
            }).on('viewportChange', () => {
                /*
                    Very frequent event, with every mouse motion
                */
                let visibleStart = that.t.visibleStart.toISOString();
                let visibleStop = that.t.visibleStop.toISOString();
                that.rangeSpanEl.innerText = (visibleStart + ' - ' + visibleStop + '. ');
                this.GMTcenter = Moment(that.t.visibleCenter).format('DDDD').toString();
            }).on('viewportChanged', () => {
                /*
                    Less frequent, only when mouse was released or leaves area
                */
                that.showEventMenu = false;
                let visibleCenter = that.t.visibleCenter.toISOString();
                this.GMTcenter = Moment(that.t.visibleCenter).format('DDDD').toString();
                //console.log(Moment(that.t.visibleCenter));
                //console.log(Moment(that.t.visibleCenter).format('DDDD'));
                // console.log('juw');
                // this.t.reveal(that.t.visibleStart, that.t.visibleStop);
                // window.location.replace('#' + visibleCenter + ',' + that.t.zoom);
            }).on('eventClick', (evt) => {
                // let event = evt.userObject;
                // console.log(evt);
                // let d = document.getElementById('timelinemenu');
                // d.style.position = 'absolute';
                // d.style.left = evt.clientX + 'px'; // '200px';
                // d.style.top = evt.clientY + 'px'; // '300px';

                // that.selectedTimelineEvent = event;
                // // this.el.nativeElement.toggle();
                // // document.getElementById('menu').classList.toggle('menu');
                // //that.editEvent(event, false);
                // this.clickedOnEvent = true;
                // this.showEventMenu = true;
            }).on('eventContextMenu', (evt) => {
                let event: any = evt.userObject;
                // console.log(event);
                if ('summary' in event && !event.summary.includes('ALL S AVAIL') && !event.summary.includes('ALL KU AVAIL' ) && !event.summary.includes('ALL KU AVAIL')) { //'user' in event && event.user !== 'gpt') {
                    let d = document.getElementById('timelinemenu');
                    d.style.position = 'absolute';
                    d.style.left = evt.clientX + 'px'; // '200px';
                    d.style.top = evt.clientY + 'px'; // '300px';
                    that.selectedTimelineEvent = event;
                    this.clickedOnEvent = true;
                    this.showEventMenu = true;
                }
            }).on('sidebarClick', (evt) => {
                let band = evt.userObject;
                console.log('band', band);
            }).on('viewportHover', (evt) => {
                that.pointedTime = Moment(evt.date).utc().toDate();
                this.GMTcursor = Moment(evt.date).utc().format('DDDD').toString();
            }).on('loadRange', (evt) => { // gecalled met t.reveal()
                // console.log(Moment(evt.loadStart).format('YYYY-MM-DD').toString());
                
                // timeline default zoom/view only stored in localstorage
                // let tempSettings = this._ApplicationService.getSettings();
                // tempSettings.timelineView = {
                //     zoom: that.t.zoom,
                //     start: that.t.visibleCenter,
                // };
                // this._ApplicationService.setSettings(tempSettings);

                // try { // doesn't work first time because the login button has to be clicked...
                //     gapi.client.load('calendar', 'v3', () => {
                //         // let request = gapi.client.calendar.calendarList.list();
                //         let request = gapi.client.calendar.events.list({
                //         calendarId: 'uunb9cv1v8q5o6j7aule66ukno@group.calendar.google.com', // busoc main calendar
                //         timeMin: loadStart.toISOString(),
                //         timeMax: loadStop.toISOString(),
                //         showDeleted: false,
                //         singleEvents: true,
                //         maxResults: 20,
                //         orderBy: 'startTime'
                //         });
                //         request.execute((resp) => {
                //         console.log(resp);
                //         });
                //     });
                // } catch (e) { console.log(e); };

                // api request hier met loadstart en loadstop waarden afhankelijk van u keuze, in de () finish tags de rommel hieronder doen en dan t.setdata
                /*
                    Indicates the range of data that will be rendered by timeline, this range of data
                    may include off-screen data.
                */
                
                // let eventQuery = [];

                // moet eerder 
                // that.bands = that.getTimelineSettings();

                that.unsubscribeEverything();
            
                let jwt = localStorage.getItem('gpt_token');
                let decodedJwt = jwt && (<any> window).jwt_decode(jwt);
                let hourglassQueries: any = [];
                let yamcsEventsQueries: any = [];
                let yamcsCmdQueries: any = [];
                let yamcsTMQueries: any = [];
                let ShiftplannerQueries: any = [];

                // VERANDER he seg
                // geef gewoon bands mee naar getdata.... Q: queries is lijst met enkel de urls... dus response index komt niet overeen met bands list
                that.bands.forEach((band) => { // assemble query list or add events now. MOET EIGENLIJK in API SERVICE he...
                    let bandQuery: any = {
                        bandIndex: that.bands.indexOf(band),
                        queries: [],
                        events: [],
                        type: '',
                        bandInfo: band
                    };
                    switch (band.what) {
                        case 'Tagged events':
                            bandQuery.type = 'hourglass';
                            let categories: string = '';
                            let getEverything: boolean = false;
                            if (band.filterCategories[0]) {
                                band.filterCategories.forEach((category) => {
                                    categories = categories + '&category[]=' + category;
                                });
                            } else {
                                getEverything = true;
                            }
                            if (getEverything) {
                                bandQuery.queries.push('/events/?' + 'dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString());
                            } else {
                                bandQuery.queries.push('/events/?' + categories + '&dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString());
                            }
                            bandQuery.filterCategories = band.filterCategories;
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'Increment timing':
                            let tempstartdate = new Date(band.incrementStartDate);
                            let tempenddate = new Date(band.incrementEndDate);
                            band.events = that._TimelineService.incrementTimingBand(tempstartdate, tempenddate);
                            break;
                        case 'Yamcs events':
                            bandQuery.queries.push(band.yamcsInstance + '/events?start=' + evt.loadStart.toISOString() + '&stop=' + evt.loadStop.toISOString() + '&order=desc&limit=500');
                            bandQuery.type = 'yamcs';
                            yamcsEventsQueries.push(bandQuery);
                            break;
                        case 'Yamcs command history':
                            bandQuery.queries.push(band.yamcsInstance + '/commands?start=' + evt.loadStart.toISOString() + '&stop=' + evt.loadStop.toISOString() + '&order=desc&limit=500');
                            bandQuery.type = 'yamcs';
                            yamcsCmdQueries.push(bandQuery);
                            break;
                        case 'TDRS':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=comms&category[]=ALL_KU_AVAIL&category[]=ALL_S_AVAIL'); //iss tdrs';
                            if (!(band.visibleZoomLevel > that.t.zoom)) { hourglassQueries.push(bandQuery); }
                            break;
                        case 'Attitude':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=comms&category[]=ATTITUDE'); // should be optimis;
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'Day/Night':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=comms&category[]=DayNight');
                            if (!(band.visibleZoomLevel > that.t.zoom)) { hourglassQueries.push(bandQuery); }
                            break;
                        case 'SAA':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=comms&category[]=SAA'); // &category[]=iss saa';
                            if (!(band.visibleZoomLevel > that.t.zoom)) { hourglassQueries.push(bandQuery); }
                            break;
                        case 'ASIMSAA':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=asim_saa&category[]=SAA'); // &category[]=iss saa';
                            if (!(band.visibleZoomLevel > that.t.zoom)) { hourglassQueries.push(bandQuery); }
                            break;
                        case 'ASIMDayNight':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=comms&category[]=DayNight');
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'MXGS submode planned':
                            bandQuery.type = 'mxgs submode planned';
                            bandQuery.queries.push('/events/?dtstart=' + Moment(evt.loadStart.toISOString()).subtract(1, 'days').toDate().toISOString() + '&dtend=' + Moment(evt.loadStop.toISOString()).add(1, 'days').toDate().toISOString() + '&source[]=comms&category[]=SAA'); // &category[]=iss saa';
                            bandQuery.queries.push('/events/?&category[]=MXGS mode' + '&dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString()); // &category[]=iss saa';
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'MXGS submode as run':
                            bandQuery.type = 'mxgs submode as run';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MX_M_SW_Submode?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MX_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_2_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_1_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'MXGS submodes':
                            bandQuery.type = 'mxgs submodes';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MX_M_SW_Submode?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MX_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_2_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_1_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'MXGS mode as run':
                            bandQuery.type = 'mxgs mode as run';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MX_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_2_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_1_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'MXGS modes':
                            bandQuery.type = 'mxgs modes';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MX_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_2_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_1_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'MMIA submode planned':
                            bandQuery.type = 'mmia submode planned';
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=comms&category[]=DayNight');
                            if (!(band.visibleZoomLevel > that.t.zoom)) { hourglassQueries.push(bandQuery); }
                            break;
                        case 'MMIA mode as run':
                            bandQuery.type = 'mmia mode as run';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_DHPU_STATE_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MM_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_3_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'MMIA modes':
                            bandQuery.type = 'mmia mode as run';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_DHPU_STATE_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MM_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_3_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'MMIA submode as run':
                            bandQuery.type = 'mmia submode as run';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_DHPU_STATE_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MM_M_SW_Submode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MM_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_3_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'MMIA submodes':
                            bandQuery.type = 'mmia submodes';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_DHPU_STATE_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MM_M_SW_Submode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_MM_M_SW_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_PB3A_28V_3_STS_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'DHPU mode as run':
                            bandQuery.type = 'dhpu mode as run';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_DHPU_STATE_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'ASIM_Meas_SAAStatus_HK':
                            bandQuery.type = 'ASIM_Meas_SAAStatus_HK'; // use the band.what....
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_SAAStatus_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'ASIM_Meas_SUNStatus_HK':
                            bandQuery.type = 'ASIM_Meas_SUNStatus_HK'; // use the band.what....
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/ASIM_Meas_SUNStatus_HK?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';                    
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'FSL Mode':
                            bandQuery.type = 'FSL Mode';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_Op_Mode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); 
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'VMU REC Mode':
                            bandQuery.type = 'VMU REC Mode';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_VMU_Recorder_OpMode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); 
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'FSL HRDL':
                            bandQuery.type = 'FSL HRDL';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_VMU_HRDL_OPER_STATE?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc');
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_VMU_HRDL_RATE_LSB?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc');
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_VMU_HRDL_RATE_MSB?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc');
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'FSL VMU REC':
                            bandQuery.type = 'FSL VMU REC';
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_VMU_Recorder_OpState?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc');
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_VMU_Rec_Mem_Free_LSW?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc');
                            bandQuery.queries.push(band.yamcsInstance + '/parameters/APM/FSL_VMU_Recorder_OpMode?' + '&start=' + Moment(evt.loadStart.toISOString()).subtract(2, 'days').toDate().toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc');
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'Yamcs archived telemetry':
                            bandQuery.type = 'Yamcs archived telemetry'; // use the band.what....
                            bandQuery.queries.push(band.yamcsInstance + '/parameters' + band.yamcsParameter.qualifiedName + '?&start=' + evt.loadStart.toISOString() + '&stop=' + evt.loadStop.toISOString() + '&norepeat&limit=1000&order=asc'); // &category[]=iss saa';
                            yamcsTMQueries.push(bandQuery);
                            break;
                        case 'OPTIMIS CR':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=optimis&category[]=COL RESOURCE');
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'OPTIMIS JSL-2':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=optimis&category[]=JSL-2');
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'OPTIMIS VC':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=optimis&category[]=VIDEO CHANNELS');
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'OPTIMIS COL':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=optimis&category[]=COL');
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'OPTIMIS KU-BD':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=optimis&category[]=KU-BD');
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'OPTIMIS MC':
                            bandQuery.queries.push('/events/?dtstart=' + evt.loadStart.toISOString() + '&dtend=' + evt.loadStop.toISOString() + '&source[]=optimis&category[]=MCC COORD');
                            hourglassQueries.push(bandQuery);
                            break;
                        case 'google calendar':
                            that.getGoogle = that.bands.indexOf(band);
                        case 'Shiftplanner':
                            bandQuery.type = 'Shiftplanner';
                            bandQuery.queries.push('startdatetime=' + Moment(evt.loadStart).format('YYYY-MM-DD').toString() + '+00:00:00&enddatetime=' + Moment(evt.loadStop).format('YYYY-MM-DD').toString() + '+00:00:00');
                            that.getShiftPlanner = that.bands.indexOf(band);
                            ShiftplannerQueries.push(bandQuery);
                        default:
                    }
                });
                //console.log(hourglassQueries);
                //console.log(yamcsTMQueries);
                // Shift Planner
                // if (that.getShiftPlanner) {
                //     let todaydate = '20161231';
                //     that._apiService.getShiftPlannerData(todaydate)
                //     .subscribe(
                //         (resp) => {
                //                 console.log(resp);
                //             },
                //         (err) => { console.log(err); },
                //         () => {
                //             that.t.setData(that.bands);
                //             // if (refresh) { this.t.reveal(this.t.visibleCenter); } else { if (!this.dataLoaded) { this.dataLoaded = true; this.dataHasLoaded.emit(); }  }
                //         }
                //     );
                // }
                if (that.getShiftPlanner) {
                    let client = new XMLHttpRequest();
                    client.open("GET", "https://shifts.busoc.be/usoc/tyna/getShift.php?startdatetime=2018-04-26+00:00:00&enddatetime=2018-04-28+00:00:00", true);
                    client.send();
                    client.onreadystatechange = function() {
                        if (this.readyState === this.HEADERS_RECEIVED) {
                            let contentType = client.getAllResponseHeaders();
                            console.log(contentType);
                        }
                    };
                    // that._apiService.getShiftPlannerData(ShiftplannerQueries)
                    //     .subscribe(
                    //         (resp) => { console.log(resp); },
                    //         (err) => { 
                    //             console.log(err);
                    //             // console.log(err.headers.get());
                    //             const keys = err.headers.keys();
                    //             // console.log(keys);
                    //             let headers = keys.map((key) =>
                    //             `${key}: ${err.headers.get(key)}`);
                    //             console.log(headers);
                    //         },
                    //         () => {}
                    //         );
                }
                // Google calendar
                if (that.getGoogle && that.goforGoogleLoading) {
                    try { // doesn't work first time because the login button has to be clicked...
                        gapi.client.load('calendar', 'v3', () => {
                            console.log('ziet hier se');
                            // let request = gapi.client.calendar.calendarList.list();
                            let request = gapi.client.calendar.events.list({
                                calendarId: this.BUSOCCalendarMain,
                                timeMin: evt.loadStart.toISOString(),
                                timeMax: evt.loadStop.toISOString(),
                                showDeleted: false,
                                singleEvents: true,
                                maxResults: 500,
                                orderBy: 'startTime'
                            });
                            request.execute((resp) => {
                                resp.items.forEach((item) => { // cast to an event model
                                    item.title = item.summary;
                                    if ('dateTime' in item.start) {
                                        item.start = new Date(item.start.dateTime);
                                    } else {
                                        item.start = new Date(item.start);
                                    }
                                    if ('dateTime' in item.end) {
                                        item.stop = new Date(item.end.dateTime);
                                    } else {
                                        item.stop = new Date(item.end);
                                    }
                                });
                                that.bands[that.getGoogle].events = resp.items;
                                that.t.setData(that.bands); // pas doen wnr alles geladen, ander flikkert ie meerdere keren enzo. fijn maar dan duurt het soms super lang als eene niet mee wil
                            });
                        });
                    } catch (e) { console.log(e); };

                }
                //console.log(hourglassQueries);
                // get hourglass data and put the response in the bands table
                let temp: any;
                let responseData: any = [];
                let mxgsEvents: any = [];
                if (hourglassQueries[0]) {
                    that.subscribeHourglass = that._apiService.getHourglassData(hourglassQueries)
                        .subscribe(
                            (resp) => {
                                // the response array of a forkjoin is in an array of an array...
                                //console.log(resp.getAllResponseHeaders);
                                let temp: any = [];
                                temp.push(resp);
                                responseData = temp[0];
                                let i = 0;
                                let j = 0;
                                temp = [];
                                //console.log(hourglassQueries);
                                hourglassQueries.forEach((query) => {
                                    query.queries.forEach((url) => {
                                        if (query.type === 'mxgs submode planned') { // why...?
                                            console.log(responseData[j]);
                                            if (responseData[j]) {
                                                responseData[j].forEach((item) => {
                                                    // mxgsEvents.push(item);
                                                    temp.push(item);
                                                });
                                            } else {
                                                // temp.push(responseData[j]);
                                            }
                                        }
                                        else {
                                            temp = responseData[j];
                                            // query.events = responseData[j];
                                            // i++;
                                        }
                                        // if (query.what )
                                        j++;
                                    });
                                    query.events = temp;
                                    temp = [];
                                    i++;
                                });
                                //console.log(hourglassQueries);
                                },
                            (err) => { console.log(err); },
                            () => {
                                let i = 0;
                                // console.log(that.bands);
                                // console.log(hourglassQueries);
                                hourglassQueries.forEach((query) => {
                                    that.bands[query.bandIndex].events = query.events; // default case...
                                    if (that.bands[query.bandIndex].what === 'Day/Night') { // still a minor bug, sometimes long night created
                                        that.bands[query.bandIndex].events =  that.bands[query.bandIndex].events.concat(this._TimelineService.generateDaysAndNights(query, evt.loadStart, evt.loadStop));
                                    }
                                    if (that.bands[query.bandIndex].what === 'ASIMDayNight') { // still a minor bug, sometimes long night created
                                        that.bands[query.bandIndex].events =  that.bands[query.bandIndex].events.concat(this._TimelineService.generateDaysAndNights(query, evt.loadStart, evt.loadStop));
                                    }
                                    if (that.bands[query.bandIndex].what === 'MXGS submode planned') {
                                        that.bands[query.bandIndex].events =  this._TimelineService.generatePlannedMXGSSubmodes(query, evt.loadStart, evt.loadStop);
                                    }
                                    if (that.bands[query.bandIndex].what === 'MMIA submode planned') {
                                        that.bands[query.bandIndex].events =  this._TimelineService.generatePlanneMMIASubmodes(query, evt.loadStart, evt.loadStop);
                                    }
                                    if (that.bands[query.bandIndex].what === 'Tagged events') { // creates 'AND' function to filter out events if more categories selected - flagged to nico. And also switches to executed times. AND also greys it out if activity completed..
                                        that.bands[query.bandIndex].events =  this._TimelineService.filterTaggedEvents(query, evt.loadStart, evt.loadStop, that.bands[query.bandIndex]);
                                    }
                                    if (that.bands[query.bandIndex].what.includes('OPTIMIS') && 'optimisFilter' in that.bands[query.bandIndex]) {
                                        that.bands[query.bandIndex].events =  this._TimelineService.filterOPTIMISActivities(query, evt.loadStart, evt.loadStop, that.bands[query.bandIndex].optimisFilter);
                                    }
                                });
                                that.t.setData(that.bands);
                            }
                        );
                }
                if (yamcsEventsQueries[0]) { // events archive
                    that._apiService.getYamcsEvents(yamcsEventsQueries)
                        .subscribe(
                            (resp) => {
                                that.yamcsUnreachable = false;

                                let temp: any = [];
                                temp.push(resp);
                                responseData = temp[0];
                                let i = 0;
                                let j = 0;
                                temp = [];
                                yamcsEventsQueries.forEach((query) => {
                                    query.queries.forEach((url) => {
                                        responseData[j].forEach((item) => {
                                            temp.push(item);
                                        });
                                        j++;
                                    });
                                    query.events = temp;
                                    temp = [];
                                    i++;
                                });
                            },
                            (err) => { console.log(err); that.yamcsUnreachable = true; console.log('Yamcs API unreachable.')},
                            () => {
                                let i = 0;
                                yamcsEventsQueries.forEach((query) => {
                                    that.bands[query.bandIndex].events = query.events;
                                });
                                that.t.setData(that.bands);
                            }
                        );
                }
                if (yamcsCmdQueries[0]) { // command archive
                    that._apiService.getYamcsCmds(yamcsCmdQueries)
                        .subscribe(
                            (resp) => {
                                that.yamcsUnreachable = false;

                                let temp: any = [];
                                temp.push(resp);
                                responseData = temp[0];
                                let i = 0;
                                let j = 0;
                                temp = [];
                                yamcsCmdQueries.forEach((query) => {
                                    query.queries.forEach((url) => {
                                        if (responseData[j].entry) {
                                            console.log(responseData[j]);
                                            responseData[j].entry.forEach((item) => {
                                                temp.push(item);
                                            });
                                        }
                                        j++;
                                    });
                                    query.events = temp;
                                    temp = [];
                                    i++;
                                });
                            },
                            (err) => { console.log(err); that.yamcsUnreachable = true; console.log('Yamcs API unreachable.')},
                            () => {
                                let i = 0;
                                yamcsCmdQueries.forEach((query) => {
                                    that.bands[query.bandIndex].events = query.events;
                                });
                                that.t.setData(that.bands);
                            }
                        );
                }
                if (yamcsTMQueries[0]) { // yamcs TM archive
                    that.subscribeYamcsTM = that._apiService.getYamcsTM(yamcsTMQueries)
                        .subscribe(
                            (resp) => {
                                that.yamcsUnreachable = false;
                                let temp: any = [];
                                temp.push(resp);
                                responseData = temp[0];
                                let i = 0;
                                let j = 0;
                                temp = [];
                                yamcsTMQueries.forEach((query) => {
                                    query.queries.forEach((url) => {
                                        responseData[j].forEach((item) => {
                                            temp.push(item);
                                        });
                                        j++;
                                    });
                                    query.events = temp;
                                    temp = [];
                                    i++;
                                });
                                },
                            (err) => { console.log(err); },
                            () => {
                                yamcsTMQueries.forEach((query) => {
                                    switch (that.bands[query.bandIndex].what) { // what if query.events is empty?
                                        case 'ASIM_Meas_SAAStatus_HK': {
                                            that.bands[query.bandIndex].events = this._TimelineService.ASIM_Meas_SAAStatus_HK_Conversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'ASIM_Meas_SUNStatus_HK': {
                                            that.bands[query.bandIndex].events = this._TimelineService.ASIM_Meas_SUNStatus_HK_Conversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'MXGS mode as run': {
                                            that.bands[query.bandIndex].events = this._TimelineService.MXGSModeAsRunConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'MXGS modes': {
                                            that.bands[query.bandIndex].events = this._TimelineService.sortMXGSModes(query, evt.loadStart, evt.loadStop, that.bands[query.bandIndex].description);
                                            break;
                                        }
                                        case 'MMIA mode as run': {
                                            that.bands[query.bandIndex].events = this._TimelineService.MMIAModeAsRunConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'MMIA modes': {
                                            that.bands[query.bandIndex].events = this._TimelineService.sortMMIAModes(query, evt.loadStart, evt.loadStop, that.bands[query.bandIndex].description);
                                            break;
                                        }
                                        case 'MMIA submode as run': {
                                            that.bands[query.bandIndex].events = this._TimelineService.MMIASubmodeAsRunConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'MMIA submodes': {
                                            that.bands[query.bandIndex].events = this._TimelineService.sortMMIASubmodes(query, evt.loadStart, evt.loadStop, that.bands[query.bandIndex].description);
                                            break;
                                        }
                                        case 'MXGS submode as run': {
                                            that.bands[query.bandIndex].events = this._TimelineService.MXGSSubmodeAsRunConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'MXGS submodes': {
                                            that.bands[query.bandIndex].events = this._TimelineService.sortMXGSSubmodes(query, evt.loadStart, evt.loadStop, that.bands[query.bandIndex].description);
                                            break;
                                        }
                                        case 'DHPU mode as run': {
                                            that.bands[query.bandIndex].events = this._TimelineService.DHPUModeAsRunConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'FSL Mode': {
                                            that.bands[query.bandIndex].events = this._TimelineService.FSLModeConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'VMU REC Mode': {
                                            that.bands[query.bandIndex].events = this._TimelineService.FSLRecModeConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'FSL HRDL': {
                                            that.bands[query.bandIndex].events = this._TimelineService.FSLHRDLConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        case 'FSL VMU REC': {
                                            that.bands[query.bandIndex].events = this._TimelineService.FSLVMURECConversion(query, evt.loadStart, evt.loadStop);
                                            break;
                                        }
                                        default: {
                                            that.bands[query.bandIndex].events = query.events;
                                            break;
                                        }
                                    }
                                    if (that.bands[query.bandIndex].hideTitle) {
                                        that.bands[query.bandIndex].events.forEach((event) => {
                                            event.title = ' ';
                                        });
                                    }
                                });
                                that.t.setData(that.bands);
                                console.log(that.bands);
                            }
                        );
                }
                that.t.setData(that.bands);
            });
            that.t.render();
    }

    @HostListener('document:click', ['$event']) private clickedOutside($event) {
        setTimeout (() => { // delay to make sure that the clickedonevent is first set
            if (!this.clickedOnEvent) {
                this.showEventMenu = false;
            } else {
            }
            this.clickedOnEvent = false;
        }, 20);
    }

    private queryEvents(query) {
        query.type = 'events';
        this._ApplicationService.queryData(query);
    }

    private unsubscribeEverything() {
        if (this.subscribeHourglass) {
            this.subscribeHourglass.unsubscribe();
        }
        if (this.subscribeYamcsTM) {
            this.subscribeYamcsTM.unsubscribe();
        }
    }

    private editEvent(event, newItem: boolean) {
        if (newItem) { // create your new event in the event parameter given to the function and leave out this line...
            event = new Event(this.t.visibleCenter, this.t.visibleCenter, this.t.visibleCenter, this.t.visibleCenter, 'scheduled', [this._ApplicationService.getPayload()]);
        }
        this.ItemDetailsAnchor.clear();
        let dialogComponentFactory = this.resolver.resolveComponentFactory(ItemDetails);
        let dialogComponentRef = this.ItemDetailsAnchor.createComponent(dialogComponentFactory);
        dialogComponentRef.instance.categories = this.categories;
        console.log(event);
        dialogComponentRef.instance.itemType = 'events';
        dialogComponentRef.instance.event = event;
        dialogComponentRef.instance.item_id = event.uid;
        dialogComponentRef.instance.newItem = newItem;
        dialogComponentRef.instance.close.subscribe((event) => {
            dialogComponentRef.destroy();
            if (event.changed) { // vindt hier maar iets op
                // this.t.reveal();
                // this.getTimelineData(this.t.visibleStart, this.t.visibleStop, true);
                console.log(event);

                // change the events in that band only, not load everything!!
                this.t.reveal(this.t.visibleCenter);
            }
        });
    }

    private duplicateEvent(eventtoduplicate) {
        if (!eventtoduplicate.source) {
            let duplicate: any = Object.assign({}, eventtoduplicate);
            this._apiService.createAPIData('events', duplicate)
            .subscribe(
                (response) => { console.log(response); this._notificationService.addAlert('success', 'event duplicated');},
                (err) => { console.log(err); this._notificationService.addAlert('error', err, true); },
                () => { this.t.reveal(this.t.visibleCenter); }
            );
        } else {
            this._notificationService.addAlert('warn', 'These type of events are not editable.');
        }
    }

    showInfo() {
         this.messageService.add({severity:'info', summary: 'Info Message', detail:'PrimeNG rocks'});
        //this.messageService.add({key: 'c', sticky: true, severity:'warn', summary:'Are you sure?', detail:'Confirm to proceed'});
    }

    private markEventComplete(event) {
        if (!event.source) {
            event.status = 'completed';
            this._apiService.updateAPIData('events', event.uid, event)
            .subscribe(
                (response) => { console.log(response); this._notificationService.addAlert('success', 'marked complete'); },
                (err) => { console.log(err); this._notificationService.addAlert('error', err, true); },
                () => { this.t.reveal(this.t.visibleCenter); }
            );
        } else {
            this._notificationService.addAlert('warn', 'These type of events are not editable.');
        }

    }

    private deleteEvent(event) {
        if (!event.source) {
            if (confirm('Are you sure you want to delete the event?')) {
                this._apiService.deleteAPIData('events', event.uid)
                .subscribe(
                    (data) => { console.log(data); this._notificationService.addAlert('success', 'event deleted');},
                    (err) => { console.log(err); this._notificationService.addAlert('error', err, true); },
                    () => { this.t.reveal(this.t.visibleCenter); }
                );
            } else { }
        } else {
            this._notificationService.addAlert('warn', 'These type of events are not editable.');
        }
    }

    private appendEvent(previousevent) {
        let newEvent = new Event(previousevent.dtend, previousevent.dtend, previousevent.dtend, previousevent.dtend, 'scheduled', previousevent.categories);
        this.editEvent(newEvent, false); // it is a new item though... so error when fetching details of the event. but when true -> new event made in editItem function
    }

    private prependEvent(nextevent) {
        let duration = Math.floor(((nextevent.dtend - nextevent.dtstart) / 1000) / 60);
        let newEvent = new Event(Moment(nextevent.dtstart).subtract(duration, 'minutes').toDate(), nextevent.dtstart, Moment(nextevent.dtstart).subtract(duration, 'minutes').toDate(), nextevent.dtstart, 'scheduled', nextevent.categories);
        this.editEvent(newEvent, false);
    }

    private now() {
        this.t.reveal(new Date());
    }

    private nextDay() {
        let newCenter = addDays(this.t.visibleCenter, 1);
        this.t.reveal(newCenter);
    }

    private previousDay() {
        let newCenter = addDays(this.t.visibleCenter, -1);
        this.t.reveal(newCenter);
    }

    private zoomIn () {
        this.t.zoomIn();
    }

    private zoomOut () {
        this.t.zoomOut();
    }

    private DoRelocate() {
        let newDate = this.relocate_date;
        if (newDate) {
            // ('#relocate-modal').modal('hide');
            this.t.reveal(newDate);
        }
    }

    private saveBandSettings() { // change name...
        // save this.timelines to settings db and also save new selectedtimeline
        let allSettings: Settings = new Settings();
        allSettings = this._ApplicationService.getSettings();
        let newSettings: any;
        if (allSettings.timelines) {
            newSettings = allSettings;
            newSettings.timelines = this.timelines;
        } else {
            newSettings = {
                timelines: this.timelines
            };
            Object.assign(newSettings, allSettings);
        }
        newSettings.timelines.forEach((timeline) => {
            timeline.value.bands.forEach((band) => {
                band.events = [];
            });
        });
        // save locally
        try { localStorage.setItem('gpt settings', JSON.stringify(newSettings));
        } catch (e) {console.log(e); }
        // save to hourglass
        this._ApplicationService.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, newSettings ); // { settings: { timelineBands: bandsCopy }});
        let temp = {
            value: {
                name: this.selectedTimelineLabel // this.newTimelineLabel // this made the timeline jump to an other one when changes where saved
            }
        };
        this.changeTimeline(temp);
        this.t.setData(this.bands, true);
    }

    private deleteBand(band) {
        let bandindex = this.bands.indexOf(band);
        this.bands.splice(bandindex, 1);
        this.saveTimelineSettings(this.bands);
        this.bands = [...this.bands]; // triggered change detection for the table settings table
        this.t.setData(this.bands, true);
    }

    private moveBandUp(band) {
        let bandindex = this.bands.indexOf(band);
        if (!(bandindex < 1)) {
            this.swapArray(this.bands, bandindex, bandindex - 1);
            this.saveTimelineSettings(this.bands);
            this.bands = [...this.bands];
            this.t.setData(this.bands, true);
        }
    }

    private moveBandDown(band) {
        let bandindex = this.bands.indexOf(band);
        if (!(bandindex >= this.bands.length - 1)) {
            this.swapArray(this.bands, bandindex, bandindex + 1);
            this.saveTimelineSettings(this.bands);
            this.bands = [...this.bands];
            this.t.setData(this.bands, true);
        }
    }

    private addBand() { // maak band model
        let newBand: any;
        newBand = this.bandToAdd;
        if (newBand.value) {
            newBand = this.bandToAdd.value;
        }
        if (newBand.saaData) {
            newBand.type = 'SaaBand';
        }
        if (newBand.label === 'Tagged events') {
            newBand.label = newBand.filterCategories;
        }
        // ASIM specific
        switch (newBand.what) {
            case 'MMIA modes':
            let MMIAModeOperational: any = {
                label: 'MMIA Operational',
                description: 'Operational',
                type: 'EventBand',
                interactive: true,
                what: 'MMIA modes',
                events: [],
                style: {
                    gutterBackgroundColor: '#f0f0f0',
                    backgroundColor: '#5bc0de',
                    textColor: '5bc0de',
                    borderColor: '#5bc0de',
                    bandBackgroundColor: '#ffffff'
                },
                yamcsInstance: newBand.yamcsInstance,
            };
            let MMIAModeConfiguration: any = {
                label: 'MMIA Configuration',
                description: 'Configuration',
                type: 'EventBand',
                interactive: true,
                what: 'MMIA modes',
                events: [],
                style: {
                    gutterBackgroundColor: '#f0f0f0',
                    backgroundColor: '#5bc0de',
                    textColor: '5bc0de',
                    borderColor: '#5bc0de',
                    bandBackgroundColor: '#ffffff'
                },
                yamcsInstance: newBand.yamcsInstance,
            };
            let MMIAModeBoot: any = {
                label: 'MMIA Boot',
                description: 'Boot',
                type: 'EventBand',
                interactive: true,
                what: 'MMIA modes',
                events: [],
                style: {
                    gutterBackgroundColor: '#f0f0f0',
                    backgroundColor: '#5bc0de',
                    textColor: '5bc0de',
                    borderColor: '#5bc0de',
                    bandBackgroundColor: '#ffffff'
                },
                yamcsInstance: newBand.yamcsInstance,
            };
            this.bands.push(MMIAModeBoot);
            this.bands.push(MMIAModeConfiguration);
            this.bands.push(MMIAModeOperational);
            break;
            case 'MMIA submodes':
                let MMIASubmodeDataProcessing: any = {
                    label: 'MMIA Data_Processing',
                    description: 'Data_Processing',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MMIA submodes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                let MMIASubmodeTriggered: any = {
                    label: 'MMIA Triggered',
                    description: 'Triggered',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MMIA submodes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                let MMIASubmodeTimed: any = {
                    label: 'MMIA Timed',
                    description: 'Timed',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MMIA submodes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                this.bands.push(MMIASubmodeDataProcessing);
                this.bands.push(MMIASubmodeTimed);
                this.bands.push(MMIASubmodeTriggered);
                break;
            case 'MXGS modes':
                let MXGSModeOperational: any = {
                    label: 'MXGS Operational',
                    description: 'Operational',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MXGS modes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    interactiveSidebar: true,
                    yamcsInstance: newBand.yamcsInstance,
                };
                let MXGSModeConfiguration: any = {
                    label: 'MXGS Configuration',
                    description: 'Configuration',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MXGS modes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                let MXGSModeBoot: any = {
                    label: 'MXGS Boot',
                    description: 'Boot',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MXGS modes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                this.bands.push(MXGSModeBoot);
                this.bands.push(MXGSModeConfiguration);
                this.bands.push(MXGSModeOperational);
                break;
            case 'MXGS submodes':
                let MXGSSubmodeHighBackground: any = {
                    label: 'MXGS High_Background',
                    description: 'High_Background',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MXGS submodes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                let MXGSSubmodeTGFSearch: any = {
                    label: 'MXGS TGF_Search',
                    description: 'TGF_Search',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MXGS submodes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                let MXGSSubmodeAuroralCapture: any = {
                    label: 'MXGS Auroral Capture',
                    description: 'Auroral_Capture',
                    type: 'EventBand',
                    interactive: true,
                    what: 'MXGS submodes',
                    events: [],
                    style: {
                        gutterBackgroundColor: '#f0f0f0',
                        backgroundColor: '#5bc0de',
                        textColor: '5bc0de',
                        borderColor: '#5bc0de',
                        bandBackgroundColor: '#ffffff'
                    },
                    yamcsInstance: newBand.yamcsInstance,
                };
                this.bands.push(MXGSSubmodeHighBackground);
                this.bands.push(MXGSSubmodeTGFSearch);
                this.bands.push(MXGSSubmodeAuroralCapture);
                break;
            default:
                this.bands.push(newBand);
        }
        // if (newBand.what === 'MXGS submodes') { // work with case when more added..
        //     let MXGSSubmodeHighBackground: any = {
        //         label: 'MXGS High_Background',
        //         description: 'High_Background',
        //         type: 'EventBand',
        //         interactive: true,
        //         what: 'MXGS submodes',
        //         events: [],
        //         style: {
        //             gutterBackgroundColor: '#f0f0f0',
        //             backgroundColor: '#5bc0de',
        //             textColor: '5bc0de',
        //             borderColor: '#5bc0de',
        //             bandBackgroundColor: '#ffffff'
        //         },
        //         yamcsInstance: newBand.yamcsInstance,
        //     };
        //     let MXGSSubmodeTGFSearch: any = {
        //         label: 'MXGS TGF_Search',
        //         description: 'TGF_Search',
        //         type: 'EventBand',
        //         interactive: true,
        //         what: 'MXGS submodes',
        //         events: [],
        //         style: {
        //             gutterBackgroundColor: '#f0f0f0',
        //             backgroundColor: '#5bc0de',
        //             textColor: '5bc0de',
        //             borderColor: '#5bc0de',
        //             bandBackgroundColor: '#ffffff'
        //         },
        //         yamcsInstance: newBand.yamcsInstance,
        //     };
        //     let MXGSSubmodeAuroralCapture: any = {
        //         label: 'MXGS Auroral Capture',
        //         description: 'Auroral_Capture',
        //         type: 'EventBand',
        //         interactive: true,
        //         what: 'MXGS submodes',
        //         events: [],
        //         style: {
        //             gutterBackgroundColor: '#f0f0f0',
        //             backgroundColor: '#5bc0de',
        //             textColor: '5bc0de',
        //             borderColor: '#5bc0de',
        //             bandBackgroundColor: '#ffffff'
        //         },
        //         yamcsInstance: newBand.yamcsInstance,
        //     };
        //     this.bands.push(MXGSSubmodeHighBackground);
        //     this.bands.push(MXGSSubmodeTGFSearch);
        //     this.bands.push(MXGSSubmodeAuroralCapture);
        // } else {
        //     this.bands.push(newBand);
        // }
        // if (this.bandToAdd.yamcsParameter) {
        //     this.bandToAdd.yamcsParameter = this.bandToAdd.yamcsParameter.qualifiedName;
        // }
        // console.log(this.bandToAdd);
        //console.log(this.bandToAdd);
        // this.bands.push(newBand);
        this.saveTimelineSettings(this.bands);
        //this.bands = [...this.bands];
        // this.t.reveal(this.t.visibleCenter); // should be some way to only fetch data for that specific band :)
        // // this.t.setData(this.bands, true);
    }

    private swapArray(Array: any, Swap1: number, Swap2: number): any {
        let temp = Array[Swap1];
        Array[Swap1] = Array[Swap2];
        Array[Swap2] = temp;
        return Array;
    }

    private addEvent() {
    }

//   getRequestedStart() {
//       let hashString, parts;
//       if (window.location.hash) {
//           hashString = window.location.hash.substring(1);
//           parts = hashString.split(',');
//           if (parts.length > 0) {
//               return parts[0];
//           }
//       }
//     }

//     getRequestedZoom() {
//       let hashString, parts;
//       if (window.location.hash) {
//           hashString = window.location.hash.substring(1);
//           parts = hashString.split(',');
//           if (parts.length > 1) {
//               return Number(parts[1]);
//           }
//       }
//     }

    private getTimelineSettings() { // ni nodig he 
        if (localStorage.getItem('gpt settings')) {
            try {
                let temp  = JSON.parse(localStorage.getItem('gpt settings'));
                // console.log(temp);
                if (temp.timelineBands) {
                    return temp.timelineBands;
                } else { // in case of first time
                    return [];
                }
                // return temp.timeline;
            } catch (e) { console.log(e); }
        } else {
            return [];
        }
    }

    private saveTimelineSettings(bands: any[]) {
        if (typeof(bands) === 'string') { // for textual thing...
            bands = eval(bands);
        }
        let bandsCopy = this._ApplicationService.deepCopy(bands);
        bandsCopy.forEach((band) => {
            band.events = [];
        });
        let allSettings: Settings = new Settings();
        allSettings = this._ApplicationService.getSettings();
        let obj = this.timelines.find((x) => x.value.index === this.selectedTimeline.value.index);
        let index = this.timelines.indexOf(obj);
        this.timelines.fill(obj.value.bands = bandsCopy, index, index++);
        let newSettings: any;
        if (allSettings.timelines) {
            newSettings = allSettings;
            newSettings.timelines = this.timelines;
        } else {
            newSettings = {
                timelines: this.timelines
            };
            Object.assign(newSettings, allSettings);
        }
        // save locally
        try { localStorage.setItem('gpt settings', JSON.stringify(newSettings));
        } catch (e) {console.log(e); }
        // save to hourglass
        this._ApplicationService.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, newSettings ); // { settings: { timelineBands: bandsCopy }});
        this.bands = this.selectedTimeline.value.bands;
        this.t.setData(this.bands, true);
        this.bands = [...this.bands];
        this.t.reveal(this.t.visibleCenter);
    }

    private calculateWOY(start: Date, end: Date) {
        let temp2;
        let WOY = [];
        let WOYDate = Moment('2017-01-01T00:00:00');
        if (WOYDate.day() <= 6) { // to shift to the next Monday
            if (WOYDate.day() === 0 || WOYDate.day() === 1) {
                temp2 = WOYDate.day(1);
            } else {
            temp2 = WOYDate.day(8);
            }
        } else {
            temp2 = WOYDate.day(1);
        }
        for (let i = 1; i < 53; i++) {
        WOY.push({ title: temp2.format('ww'), start: temp2.toDate(), stop: temp2.add(1, 'weeks').toDate() });
        }
        WOYDate = Moment('2018-01-01T00:00:00');
        if (WOYDate.day() <= 6) { // to shift to the next Monday
            if (WOYDate.day() === 0 || WOYDate.day() === 1) {
                temp2 = WOYDate.day(1);
            } else {
            temp2 = WOYDate.day(8);
            }
        } else {
            temp2 = WOYDate.day(1);
        }
        for (let i = 1; i < 53; i++) {
        WOY.push({ title: temp2.format('ww'), start: temp2.toDate(), stop: temp2.add(1, 'weeks').toDate() });
        }
    }

    private calculateDOY(start: Date, end: Date) { // fijn tune want werkt niet echt meet start stop...
        let DOY = [];
        let DOYDate = Moment('2017-01-01T00:00:00');
        for (let i = 1; i < 366; i++) {
        DOY.push({ title: DOYDate.format('DDDD'), start: DOYDate.toDate(), stop: DOYDate.add(1, 'days').toDate() });
        }
        DOYDate = Moment('2018-01-01T00:00:00');
        for (let i = 1; i < 366; i++) {
            DOY.push({ title: DOYDate.format('DDDD'), start: DOYDate.toDate(), stop: DOYDate.add(1, 'days').toDate() });
        }
        return DOY;
    }

    private subscribeWebsocket() {
        this.ws = new $WebSocket('ws://busocops:K2,iv!T9@192.168.67.150:8090/' + this.bandToAdd.yamcsInstance + '/_websocket'); // moet maar eenmaal, daarna kan je zoveel parameter subscriben
        this.ws.onMessage(
            (msg: MessageEvent) => {
                let data = JSON.parse(msg.data);
                console.log(data);
                if (data[1] === 4) {
                    // console.log(data[3].data.parameter[0].engValue.floatValue);
                    if (data[3].data.parameter[0].engValue.floatValue) {
                        this.tmValue = data[3].data.parameter[0].engValue.floatValue.toString();
                    } else if (data[3].data.parameter[0].engValue.stringValue) {
                        this.tmValue = data[3].data.parameter[0].engValue.stringValue.toString();
                    }
                }
            },
            {autoApply: false}
        );
        let message = [ 1, 1, 3, {
        parameter: 'subscribe',
        data: {
            list:
            [
                { name: this.selectedTM.qualifiedName },
                { namespace: 'MDB:OPS Name', name: this.selectedTM.name }
            ]
        }
        } ];
        this.ws.send(message).subscribe(
        (msg) => {
            console.log(msg);
        },
        (error) => {
            console.log(error);
        },
        () => {}
        )
    }

    private unsubscribeWebsocket() { // make ticket in github that unsubscribeAll only works if you did subscribeAll. needs to be a way to just disconnect and unscribefromall
        let message = [ 1, 1, 3, {
        parameter: 'subscribe',
        data: {
            list:
            [
                { name: this.selectedTM.qualifiedName },
                { namespace: 'MDB:OPS Name', name: this.selectedTM.name }
            ]
        }
        } ];
        this.ws.send(message).subscribe(
        (msg) => {
            console.log(msg);
        },
        (error) => {
            console.log(error);
        },
        () => {}
        );
        // let message = [ 1, 1, 4, { parameter: 'unsubscribe',      data: {
        //       list:
        //       [
        //           { name: '/APM/FSL_AAA_Fan_Speed' },
        //           { namespace: 'MDB:OPS Name', name: 'FSL_AAA_Fan_Speed' }
        //       ]
        //   } } ];
        // this.ws.send(message).subscribe(
        //   (msg) => {
        //     console.log(msg);
        //   },
        //   (error) => {
        //     console.log(error);
        //   },
        //   () => {}
        // )
    }

    private getInstanceMDB(instance) {
        this._apiService.getYamcsInstanceMDB(instance)
        .subscribe(
            (resp) => {
                    // to show all the headers:
                    const keys = resp.headers.keys();
                    let headers = keys.map(key =>
                    `${key}: ${resp.headers.get(key)}`);
                    console.log(headers);

                    this.instanceTelemetry = [];
                    resp.body.parameter.forEach((tm) => { // zou in api service moeten gebeuren...
                        this.instanceTelemetry.push({ label: tm.qualifiedName, value: tm } );
                    });
                    this.instanceTelemetry = [...this.instanceTelemetry];
                },
            (err) => { console.log(err); },
            () => { }
        );
    }

    private timelineSnapshot() {
        html2canvas(document.getElementById('timeline'), {allowTaint: true}).then(function(canvas) {
            document.body.appendChild(canvas);
            // let img = canvas.toDataURL("image/png");
            // let doc = new jsPDF({orientation: 'portrait'});
            // img.addImage(img, 'PNG', 7, 5);
            // doc.save('BUSOC-ISS-DOR-ASIM-' + this.dorDate.getFullYear().toString() + '_' + Moment(this.dorDate).format('DDDD').toString() + '.pdf');
            // img.save('BUSOC-ISS-DOR-ASIM-2018_GMT.pdf');
        });
    }

    private handleAuthClick(event) {
        gapi.auth.authorize({client_id: this.clientID, scope: this.scopes, immediate: false}, this.handleAuthResult);
        return false;
    }

    private getYamcsParameters(event) {
        console.log(this.bandToAdd.yamcsInstance);
        this.getInstanceMDB(this.bandToAdd.yamcsInstance);
    }

    private onTabChange(event) {
        if (event.index === 1) {
            let bandsCopy = this._ApplicationService.deepCopy(this.selectedTimeline.value.bands);
            bandsCopy.forEach((band) => {
                band.events = [];
            });
            this.timelineSettings = JSON.stringify(bandsCopy, null, 2);
            // this.timelineSettings = JSON.stringify(this._ApplicationService.getSettings().timelineBands, null, 2);
        }
    }

    private timelineLabelChange(event) {
        let obj = this.timelines.find((x) => x.value.index === this.selectedTimeline.value.index);
        let index = this.timelines.indexOf(obj);
        this.timelines.fill(obj.label = event, index, index++);
        this.timelines.fill(obj.value.name = event, index, index++);
        this.newTimelineLabel = event;
        // this.selectedTimeline = this.timelines.find((o) => o.label === mytimeline);
        // console.log(this.selectedTimeline);
        // this.bands = this.selectedTimeline.value.bands;

        // update selectedtimeline name and save to settings --> call changeTimeline?
        // let temp = {
        //     value: {
        //         name: event
        //     }
        // }
        // this.changeTimeline(temp);
    }

    private changeTimeline(event) { // save selectedtimeline
        let allSettings: Settings = new Settings();
        allSettings = this._ApplicationService.getSettings();
        let newSettings: any;
        if (allSettings.selectedTimeline) {
            newSettings = allSettings;
            newSettings.selectedTimeline = event.value.name;
        } else {
            newSettings = {
                selectedTimeline: event.value.name
            };
            Object.assign(newSettings, allSettings);
        }
        this.selectedTimelineLabel = event.value.name;
        // save locally
        try { localStorage.setItem('gpt settings', JSON.stringify(newSettings));
        } catch (e) {console.log(e); }
        // save to hourglass
        this._ApplicationService.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, newSettings ); // { settings: { timelineBands: bandsCopy }});
        this.selectedTimelineLabel = event.value.name;
        this.selectedTimeline = this.timelines.find((o) => o.label === this.selectedTimelineLabel);
        console.log(this.selectedTimeline);
        this.bands = this.selectedTimeline.value.bands;
        this.t.reveal(this.t.visibleCenter);
    }

    private handleAuthResult(authResult, start: Date, end: Date) {
        // console.log(authResult);
        // let authorizeButton = document.getElementById('authorize-button');
        if (!start) { start = new Date(); end = new Date(); }
        if (authResult && !authResult.error) {
            this.goforGoogleLoading = true;
            // authorizeButton.style.visibility = 'hidden';
            gapi.client.load('calendar', 'v3', () => {
                // let request = gapi.client.calendar.calendarList.list();
                let request = gapi.client.calendar.events.list({
                    calendarId: this.BUSOCCalendarMain,
                    timeMin: start.toISOString(), // .toISOString(),
                    timeMax: end.toISOString(),
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
            // authorizeButton.style.visibility = '';
            // authorizeButton.onclick = this.handleAuthClick;
        }
    }

    private convertSequence () {
        this.selectedSequence.start = Moment.utc().toDate();
        for (let i = 0; i < this.selectedSequence.sequence.length; i++) {
            let template: any = {};
            let temp: any = {};
            temp = this.asimActivityTemplates.find((o) => o.label === this.selectedSequence.sequence[i].template);
            // forsome reason if not deepcoy:  you are changing the asimactivitytemplates variable
            template = this._ApplicationService.deepCopy(temp.value);
            template.template = this.selectedSequence.sequence[i].template;
            template.dtstart = Moment(this.selectedSequence.start).add(this.selectedSequence.sequence[i].offset, 'minutes').toDate();
            template.dtend = Moment(this.selectedSequence.start).add(this.selectedSequence.sequence[i].offset + template.duration, 'minutes').toDate();
            template.offset = this.selectedSequence.sequence[i].offset;
            this.selectedSequence.sequence[i] = template;
        };
    }

//   private deleteSequenceData() {
//       this.selectedSequence = null;
//       this.asimActivityTemplates = settingsFile.ASIMEventTemplates; // settingsFile is fucked up...
//   }

    private recalculateSequenceTemplates () {
        for (let i = 0; i < this.selectedSequence.sequence.length; i++) {
            this.selectedSequence.sequence[i].dtstart = Moment(this.selectedSequence.start).add(this.selectedSequence.sequence[i].offset, 'minutes').toDate();
            this.selectedSequence.sequence[i].dtend = Moment(this.selectedSequence.start).add(this.selectedSequence.sequence[i].offset + this.selectedSequence.sequence[i].duration, 'minutes').toDate();
        };
    }

    // private addSequence () {
    //     // forkjoin!!!
    //     this.selectedSequence.sequence.forEach((activity) => {
    //         this._apiService.createAPIData('events', activity)
    //         .subscribe(
    //             (response) => { $('#sequence-modal').modal('hide'); console.log(response); },
    //             (err) => { console.log(err); this._apiService.returnCodes(err); },
    //             () => { this.t.reveal(this.t.visibleCenter); } // with forjoin this is only executed when all are put in hg
    //         );
    //     });
    // }

    private showCountdownPopUp() {
        window.open('#/countdown', '_blank');
    }

    private closeEventMenu() {
        this.showEventMenu = false;
    }

    private Countdown(band) {
        window.open('#/countdown', '_blank');
    }

}
