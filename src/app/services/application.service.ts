import { Injectable, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';

import { Todo } from '../models/todo';
import { Settings } from '../models/settings';

// import { SelectItem } from 'primeng/primeng';

import { Message } from 'primeng/primeng';

import * as Moment from 'moment';

import * as settingsFile from 'assets/settings/app-settings.json';
import { settings } from 'cluster';
// const myname= data.name;
// console.log(myname); // output 'nadeem'

@Injectable()

export class ApplicationService {

    public payload = 'fsl'; // wut...?
    public display: string;
    public routeData: any;
    public currentRoute: string;
    public menuItem: string;
    public payloadChange = new EventEmitter();
    public timeWindowChange = new EventEmitter();
    public items = [];
    public itemsUpdated = new EventEmitter();
    public alerts: Message[] = [];
    public alert_index: number = 0;
    public Categories: SelectItem[] = [];
    public Users: any[];
    public statusList: SelectItem[];
    public userInfo: any;
    public yamcsInstances: SelectItem[] = [];
    //public optimisBands: SelectItem[] = [];
    public countdownInfo: any;
    public utcOffset: string;
    dateStart: Date;
    dateEnd: Date;

    constructor(
        public router: Router,
        private _apiService: ApiService,
        private _NotificationService: NotificationService,
    ) {
        this.statusList = settingsFile.status;
        this.yamcsInstances = settingsFile.YamcsInstances;
        this.utcOffset = Moment().format('Z');
        //this.optimisBands = settingsFile.selectableOPTIMISbands;
        // default queries when loading the app (does execute on startup of the app but user not yet logged in... :)
        // this.getUserInfo(5);
        //console.log('hallo');
        // this.userInfo = localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id;
        // this.getUserInfo(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id);
        
        // this.setPayload('asim'); // to be removed and fetched -> default one

        try {
            this.payload = this.getSettings().payload;
            if (!this.payload) {
                this.payload = settingsFile.ControlCenterSpecs.Payloads[0].name;
                // this.setPayload('asim');
            }
        } catch (err) {
            this.payload = settingsFile.ControlCenterSpecs.Payloads[0].name;
                // this.setPayload('asim');
        }

        if (this.getRoute()[0].outlets.mainnav === '') { // otherwise it loads this data on the login page
        } else {
            this.queryData( { type: 'categories'} );
            this.queryData( { type: 'users'} );
            this.queryData( { type: 'uplinks', start: Moment.utc().subtract(100, 'days').toDate(), end: Moment.utc().add(200, 'days').toDate(), categories: [this.getPayload()], status: ['completed', 'scheduled'] } );
        }
        this.itemsUpdated
        .subscribe( (data) => {
          switch (data.type) {
            case 'categories':
              this.Categories = [...data.data];
            case 'events':
              console.log(data); //this.Categories = [...data.data];
            default:
          }
          });

          this.getYamcsInstances();
    }

    getYamcsInstances() {
        this._apiService.getYamcsInstances()
        .subscribe(
          (resp) => {
            this.yamcsInstances = [];
            resp.instance.forEach((instance) => {
                this.yamcsInstances.push({
                    label: instance.name,
                    value: instance.name
                });
            });
            console.log(this.yamcsInstances);
          },
          (err) => { console.log(err); this._NotificationService.addAlert('error', 'Yamcs on esa-relay is unavailable. Please annoy a GC.', true);},
          () => {}
        );
    }

    queryData(query: any): void { // create a 'generate hourglass url' function
        console.log(query);
        let start = '';
        let end = '';
        let categories = '';
        let additional = '';
        if ('categories' in query) {
            if (query.categories) {
                query.categories.forEach((category) => {
                    categories = categories + '&category[]=' + category;
                });
            }
        }
        if ('start' in query) {
            start = '&dtstart=' + query.start.toISOString();
            end = '&dtend=' + query.end.toISOString();
        }
        if ('additional' in query) {
            additional = query.additional;
        }
        if ('status' in query) {
            query.status.forEach((stat) => {
                additional = additional + '&status[]=' + stat;
            });
            // additional = '&status[]=' + query.status;
        }
        // console.log(query.type + '?' + categories + start + end);
        if (query.type === 'events' && !query.categories[0]) {
        } else {
            this._apiService.getAPIData(query.type, '?' + categories + start + end + additional)
                .subscribe(
                    (data) => {
                        // console.log(query);
                        // console.log(data);
                        this.items = data;
                        if (query.type === 'categories') {
                            this.Categories = data;
                            // localStorage.removeItem('categories');
                            // localStorage.setItem('categories', JSON.stringify(data));
                        }
                        if (query.type === 'users') {
                            this.Users = data;
                            console.log(this.Users);
                        }
                    },
                    (err) => { console.log(err); },
                    () => {
                        if (this.items) { // wrm doe je dit, als je iets delete en er schiet niets meer over heb je niks
                            this.itemsUpdated.emit({ type: query.type, data: this.items });
                        }
                    }
                );
        }
    }

    setCountdownInfo(info) {
        this.countdownInfo = info;
        // console.log(this.countdownInfo);
    }

    getCountdownInfo() {
        return this.countdownInfo;
    }

    deepCopy(oldObj: any) {
        let newObj = oldObj;
        if (oldObj && typeof oldObj === 'object') {
            newObj = Object.prototype.toString.call(oldObj) === '[object Array]' ? [] : {};
            for (let i in oldObj) {
                newObj[i] = this.deepCopy(oldObj[i]);
            }
        }
        return newObj;
    }

    setPayload(item: string) {
        this.payload = item;
        console.log(this.getPayload());
        let allSettings: Settings = new Settings();
        allSettings = this.getSettings(); // wat als deze niet bestaat... :)
        allSettings.payload = item;
        console.log(allSettings);
        try { localStorage.setItem('gpt settings', JSON.stringify(allSettings));
        } catch (e) {console.log(e); }
        // save to hourglass
        this.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, allSettings);
        this.payloadChange.emit();
    }

    getCategories() {
        // sneller dan eerst van api laden
        //return JSON.parse(localStorage.getItem('categories'));
        return this.Categories;
    }

    getUserInfo(id) {
        return this._apiService.getAPIData('users', '', id);
    }

    setUserSetting(id, allsettings) {
        let userObject = {
            settings: allsettings
        };
        console.log(userObject);
        this._apiService.updateAPIData('users', id, userObject)
        .subscribe(
            (response) => { console.log(response); },
            (err) => {
                console.log(err);
            },
            () => { // trigger an emit for singeltons?
            }
        );
    }

    getUsers() {
        return this.Users;
    }

    // not necessary anymore
    getPayload() {
        // console.log(this.payload);
        return this.payload;
    }

    getStatusList() {
        return this.statusList;
    }

    setSettings(settings) { // localstorage only
        localStorage.removeItem('gpt settings');
        if (!settings) { // first time
            let temp: Settings = new Settings();
            // temp.timeline = { any: 'any' };
            settings = temp;
        }
        // console.log(settings);
        localStorage.setItem('gpt settings', JSON.stringify(settings));
    }

    getSettings() { // localstorage only
        let settings: any;
        if (localStorage.getItem('gpt settings')) {
            settings = JSON.parse(localStorage.getItem('gpt settings'));
        }  else {
            // settings = null; // gives trouble! provide some default settings or something
            settings = {
                route: 'timeline',
                payload: settingsFile.ControlCenterSpecs.Payloads[0].name
            };
        }
        return settings;
    }

    saveRoute(route) {
        let allSettings: Settings = new Settings();
        allSettings = this.getSettings(); // wat als deze niet bestaat... :)
        allSettings.route = route;
        console.log(allSettings);
        try { localStorage.setItem('gpt settings', JSON.stringify(allSettings));
        } catch (e) {console.log(e); }

        // save to hourglass
        this.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, allSettings);
    }

    getRoute() { // only when name should be displayed in menu item - bad method btw!!!
        this.currentRoute = this.router.url;
        let pattern = '/ContainerApp/(mainnav:';
        this.display = this.currentRoute.slice(this.currentRoute.indexOf(pattern) + pattern.length);
        this.display = this.display.slice(0, -1);
        switch (this.display) {
        case 'event-management': this.menuItem = 'Events';
            break;
        case 'file-management': this.menuItem = 'Files';
            break;
        case 'filetransfer-management': this.menuItem = 'File Transfers';
            break;
        case 'todo-management': this.menuItem = 'Tasks';
            break;
        case 'timeline': this.menuItem = 'Timeline';
            break;
        default: this.menuItem = 'no-menu';
        }
        return this.routeData = [ {
                'outlets' : { mainnav : this.display }
                }];
    }

    getMenuItem() {
        return this.menuItem;
    }

    createOnboardDataTree(files) {
        let paths: any = [];
        let document2DArray = [];
        files.forEach((file) => {
          if (file.metadata && file.metadata.onboardLocation && file.metadata.onboardLocation !== '') {
            paths.push(file);
          }
        });
        let nodesByPath = {};
        let root = { children: [] };
        for (let path of paths) {
            let parts = path.metadata.onboardLocation.split('/');
            let node = root;
            for (let i = 0; i < parts.length - 1; i++) {
                let rootedFolderName = parts.slice(0, i + 1).join('/');
                if (rootedFolderName in nodesByPath) {
                    node = nodesByPath[rootedFolderName];
                } else {
                    let newChild = { label: parts[i], children: [], data: 'Documents Folder', expandedIcon: 'fa fa-folder-open', collapsedIcon: 'fa fa-folder', };
                    node['children'].push(newChild);
                    nodesByPath[rootedFolderName] = newChild;
                    node = newChild;
                }
            }
            node['children'].push({ label: parts[parts.length - 1], icon: 'fa fa-file-text-o', data: path });
        }
        let nodes = root['children']; // [0]['children'];
        this.sortObj(nodes, 'label');
        return nodes;
    }

    createGroundDataTree(files) { // can all go in one function he... combined with onboarddatatree
        let paths: any = [];
        let document2DArray = [];
        files.forEach((file) => {
          if (file.metadata && file.metadata.groundLocation && file.metadata.groundLocation !== '') {
            // console.log(file);
            paths.push(file);
          }
        });
        let nodesByPath = {};
        let root = { children: [] };
        for (let path of paths) {
            let parts = path.metadata.groundLocation.split('/');
            let node = root;
            for (let i = 0; i < parts.length - 1; i++) {
                let rootedFolderName = parts.slice(0, i + 1).join('/');
                if (rootedFolderName in nodesByPath) {
                    node = nodesByPath[rootedFolderName];
                } else {
                    let newChild = { label: parts[i], children: [], data: 'Documents Folder', expandedIcon: 'fa fa-folder-open', collapsedIcon: 'fa fa-folder', };
                    node['children'].push(newChild);
                    nodesByPath[rootedFolderName] = newChild;
                    node = newChild;
                }
            }
            node['children'].push({ label: parts[parts.length - 1], icon: 'fa fa-file-text-o', data: path });
        }
        let nodes = root['children']; // [0]['children'];
        console.log(nodes);
        this.sortObj(nodes, 'label');
        return nodes;
    }

    // not necessary anymore
    getTimeWindow () {
        return { start: this.dateStart, end: this.dateEnd };
    }

    // not necessary anymore 
    setTimeWindow (start: Date, end: Date) {
        this.dateStart = start;
        this.dateEnd = end;
        this.dateStart.setHours(0, 0, 0);
        this.dateEnd.setHours(0, 0, 0);
        this.timeWindowChange.emit();
    }

    // can be deleted
    // public addAlert(alertType: string, alertMessage: string, timeout: number = 0) {
    //     this.alerts.push({severity: alertType, summary: '', detail: alertMessage});
    //     if (timeout) {
    //         setTimeout(() => this.closeAlert(this.alerts[this.alert_index]), timeout);
    //     }
    //     this.alert_index = this.alert_index + 1;
    // }

    // can be deleted
    // public closeAlert(alert) {
    //     const index: number = this.alerts.indexOf(alert);
    //     this.alerts.splice(index, 1);
    // }

    public sortObj(list, key) { //.sort() werkt hoor...
        function compare(a, b) {
            a = a[key];
            b = b[key];
            let type = (typeof(a) === 'string' ||
                        typeof(b) === 'string') ? 'string' : 'number';
            let result;
            if (type === 'string') {
            result = a.localeCompare(b);
            } else {
            result = a - b;
            }
            return result;
        }
        return list.sort(compare);
    }
}
