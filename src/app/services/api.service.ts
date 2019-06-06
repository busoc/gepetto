import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { contentHeaders } from '../common/headers';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
// import { ApplicationService } from 'application.service';

// import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import 'rxjs/add/observable/forkJoin';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import * as settingsFile from 'assets/settings/app-settings.json';

import * as Moment from 'moment';
import { forEach } from '@angular/router/src/utils/collection';
import { ResponseContentType, RequestOptions } from '@angular/http';
import { settings } from 'cluster';

// import { $WebSocket, WebSocketSendMode } from 'angular2-websocket/angular2-websocket';

@Injectable()

export class ApiService {

    //private HOURGLASS_URL: string = 'http://virtualtest.busoc.be/wip'; // work in progress
    // private HOURGLASS_URL: string = 'http://virtualtest.busoc.be/api'; // development server
    // private HOURGLASS_URL: string = 'http://virtualtest2.busoc.be/wip'; // work in progress
    
    // development version BUSOC (no specific development version for ICMCC...):
    private HOURGLASS_URL: string = 'http://virtualtest2.busoc.be/api'; // operational
    
    // works for production version ICMCC and BUSOC:
    // private HOURGLASS_URL: string = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/api';

    private ALFRESCO_API: string = 'http://cms.busoc.be:8080/alfresco/api/-default-/public/alfresco/versions/1/sites/';
    //private YAMCS_ARCHIVE: string = 'http://virtualtest2.busoc.be/yamcs/archive/'; // 'http://192.168.67.150:8090/api/archive/'
    //private YAMCS_INSTANCES: string = 'http://virtualtest2.busoc.be/yamcs/instances'; // 'http://192.168.67.150:8090/api/instances'
    //private YAMCS_MDB: string = 'http://virtualtest2.busoc.be/yamcs/mdb/';
    private YAMCS_WEBSOCKET: string = 'ws://192.168.127.150:8090/asim-gm/_websocket';
    private ShiftPlannerURL: string = 'https://shifts.busoc.be/usoc/tyna/getShift.php?'; // https://shifts.busoc.be/usoc/tyna/getShift.php?startdatetime=2018-04-14+05:00:00&enddatetime=2018-05-15+12:00:00

    private HR1_relay = "http://hr1-relay.busoc.be/upi/api/"; // OPS/images/playback/files/
    private tempdata: any;

    private YamcsMDBItems: YamcsMDBItems;

    constructor(
        public router: Router,
        private http: HttpClient,
        public notificationService: NotificationService,
        // public _aplicationService: ApplicationService // geeft vreemde error...
    ) {
    }

    subscribeWebsocket() {
        // let ws = new $WebSocket(this.YAMCS_WEBSOCKET);

        // let socket = [ 1, 1, 789, {
        //     parameter: 'subscribe',
        //     data: {
        //         list:
        //         [
        //             { name: '/APM/FSL_AAA_Fan_Speed' },
        //             { namespace: 'MDB:OPS Name', name: 'FSL_AAA_Fan_Speed' }
        //         ]
        //     }
        // } ];

        // let headers = new Headers();
        // headers.append('Content-Type', 'application/json');
        // headers.append('Authorization', 'Basic YnVzb2NvcHM6SzIsaXYhVDk=');
        // return this.http
        //     .get(this.YAMCS_WEBSOCKET, { headers })
        //     .map((response: Response) => {
        //         return response.json();
        //     });
    }

    unsubscribeWebsocket () {
        let socket = [ 1, 1, 790, { parameter: 'unsubscribe' } ];

        let headers = new HttpHeaders();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication);
        return this.http
            .get(this.YAMCS_WEBSOCKET, { headers })
            .map((response: Response) => {
                return response;//.json();
            });
    }

    // getASIMTM() { // used..?
    //     let headers = new Headers();
    //     headers.append('Content-Type', 'application/json');
    //     headers.append('Authorization', 'Basic YnVzb2NvcHM6SzIsaXYhVDk=');
    //     return this.http
    //         .get(this.SOLAR_temp, { headers })
    //         .map((response: Response) => {
    //             return response.json();
    //         });
    // }

    getAlfrescoData() {
        let headers = new HttpHeaders();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', 'Basic a3N0cnV5dmVuOlJvY2tzdGFyMDE=');
        return this.http
            .get(this.ALFRESCO_API, { headers })
            .map((response: Response) => {
            });
    }

    getShiftPlannerData(queries): Observable<HttpResponse<ShiftData>> {
        //let headers = new HttpHeaders();
        // headers.append('Content-Type', 'application/json');
        //headers.append('Authorization', 'Basic S1M6ZlM3ZXhNc3E=');
        return this.http.get<ShiftData>(this.ShiftPlannerURL + queries[0].queries[0], { observe: 'response' });
            // .pipe(
            //     map((response: Response) => {
            //         console.log(response);
            //         return response.json();
            //     }),
            //     catchError(this.handleError)
            // );
            // .map((response: Response) => {
            //     console.log(response);
            //     console.log(response.status)
            //     return response;
            // });
    }

    getHourglassData(queries) { // met 'queries' als input. geen observable dus geen access tot headers ....
        let urls: any = [];
        let headers: HttpHeaders;
        headers = this.addHourglassHeader();
        console.log(queries);
        queries.forEach((query) => {
            // console.log(query);
            query.queries.forEach((url) => {
                console.log(url);
                urls.push(this.http.get(settingsFile.ControlCenterSpecs.HourglassServerLocation + url, { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) }).map((res: Response) => res)); // .json() ));
            });
        });
        return Observable.forkJoin(urls)
            .pipe(
                map((data) => {
                    //console.log(data);//response.headers.get('authorization').substring(7));
                    // need to be able to retrieve header for the new token...
                    data.forEach((d) => { // run through queries and then put the response in the correct query.events...
                        // this.extractHourglassData(d, 'events');
                        if (d) {
                            this.extractHourglassData(d, 'events');
                        } else {
                            let temp: any = [];
                            data[data.indexOf(d)] = temp;
                        }
                    });
                    return data;
                }),
                catchError(this.handleError)
            );
            // .map((data) => {
            //     console.log('kiekeboe');
            //     console.log(data);
            //     data.forEach((d) => { // run through queries and then put the response in the correct query.events...
            //         // this.extractHourglassData(d, 'events');
            //         if (d) {
            //             this.extractHourglassData(d, 'events');
            //         } else {
            //             let temp: any = [];
            //             data[data.indexOf(d)] = temp;
            //         }
            //     });
            //     return data;
            // });
    }

    getYamcsCmds(queries) {
        let urls: any = [];
        let headers: HttpHeaders;
        headers = this.addYamcsHeader();
        queries.forEach((query) => {
            urls.push(this.http.get(settingsFile.ControlCenterSpecs.YamcsServer.location + /archive/ + query.queries, { headers: new HttpHeaders().set('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication) }).map((res: Response) => res));//.json() ));
        });
        return Observable.forkJoin(urls)
            .map((data) => {
                data.forEach((d: any) => {
                    console.log(d);
                    if (d.entry) {
                        this.extractYamcsCmds(d.entry);
                    } else {
                        let temp: any = [];
                        data[data.indexOf(d)] = temp;
                    }
                });
                return data;
            });
    }

    getHR1relayStatus() {
        let urls: any = [];
        let headers: HttpHeaders;
        urls.push(this.http.get(this.HR1_relay + 'OPS/images/playback/files/', { headers: new HttpHeaders().set('Accept', 'application/json') }).map((res: Response) => res));
        urls.push(this.http.get(this.HR1_relay + 'OPS/sciences/playback/files/', { headers: new HttpHeaders().set('Accept', 'application/json') }).map((res: Response) => res));
        urls.push(this.http.get(this.HR1_relay + 'SIM1/images/playback/files/', { headers: new HttpHeaders().set('Accept', 'application/json') }).map((res: Response) => res));
        urls.push(this.http.get(this.HR1_relay + 'SIM1/sciences/playback/files/', { headers: new HttpHeaders().set('Accept', 'application/json') }).map((res: Response) => res));
        return Observable.forkJoin(urls)
        .pipe(
            map((data) => { // group of objects returned by upifinder API...
                // let images = Object.keys(data[0]).map((key) => data[0][key]);
                // let sciences = Object.keys(data[1]).map((key) => data[1][key]);
                // let result = images.concat(sciences);
                let OPSimages = data[0];
                let OPSsciences = data[1];
                let SIM1images = data[2];
                let SIM1sciences = data[3];

                let OPSimagesList = {};
                for (let key in OPSimages) {
                    if (OPSimages.hasOwnProperty(key)) {
                        let parts = key.split('/');
                        let channel = 'source' + parts[0];
                        let upi = parts[1];
                        if (!(upi in OPSimagesList)) {
                            OPSimagesList[upi] = {};
                        }
                        OPSimagesList[upi][channel] = OPSimages[key];
                    }
                }
                let OPSimagesArray = [];
                for (var key in OPSimagesList) {
                    let entry = { 
                        'recordname' : key,
                        'imageschannels': OPSimagesList[key]
                    }
                    // silly workaround to have 0's in the empty sources:
                    if (!entry.imageschannels) {
                        entry.imageschannels = {};
                    }
                    if (!entry.imageschannels.source33) {
                        entry.imageschannels.source33 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.imageschannels.source34) {
                        entry.imageschannels.source34 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.imageschannels.source37) {
                        entry.imageschannels.source37 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.imageschannels.source38) {
                        entry.imageschannels.source38 = {
                            'uniq': 0
                        };
                    }
                    OPSimagesArray.push(entry);
                }
                let SIM1imagesList = {};
                for (let key in SIM1images) {
                    if (SIM1images.hasOwnProperty(key)) {
                        let parts = key.split('/');
                        let channel = 'source' + parts[0];
                        let upi = parts[1];
                        if (!(upi in SIM1imagesList)) {
                            SIM1imagesList[upi] = {};
                        }
                        SIM1imagesList[upi][channel] = SIM1images[key];
                    }
                }
                let SIM1imagesArray = [];
                for (var key in SIM1imagesList) {
                    let entry = { 
                        'recordname' : key,
                        'imageschannels': SIM1imagesList[key]
                    }
                    // silly workaround to have 0's in the empty sources:
                    if (!entry.imageschannels) {
                        entry.imageschannels = {};
                    }
                    if (!entry.imageschannels.source33) {
                        entry.imageschannels.source33 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.imageschannels.source34) {
                        entry.imageschannels.source34 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.imageschannels.source37) {
                        entry.imageschannels.source37 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.imageschannels.source38) {
                        entry.imageschannels.source38 = {
                            'uniq': 0
                        };
                    }
                    SIM1imagesArray.push(entry);
                }

                let OPSsciencesList = {};
                for (let key in OPSsciences) {
                    if (OPSsciences.hasOwnProperty(key)) {
                        let parts = key.split('/');
                        let channel = 'source' + parts[0];
                        let upi = parts[1];
                        if (!(upi in OPSsciencesList)) {
                            OPSsciencesList[upi] = {};
                        }
                        OPSsciencesList[upi][channel] = OPSsciences[key];
                    }
                }  
                let OPSsciencesArray = [];
                for (var key in OPSsciencesList) {
                    let entry = { 
                        'recordname' : key,
                        'scienceschannels': OPSsciencesList[key]
                    }
                    // silly workaround to have 0's in the empty sources:
                    if (!entry.scienceschannels) {
                        entry.scienceschannels = {};
                    }
                    if (!entry.scienceschannels.source35) {
                        entry.scienceschannels.source35 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source36) {
                        entry.scienceschannels.source36 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source39) {
                        entry.scienceschannels.source39 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source40) {
                        entry.scienceschannels.source40 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source41) {
                        entry.scienceschannels.source41 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source51) {
                        entry.scienceschannels.source51 = {
                            'uniq': 0
                        };
                    }
                    OPSsciencesArray.push(entry);
                }
                let SIM1sciencesList = {};
                for (let key in SIM1sciences) {
                    if (SIM1sciences.hasOwnProperty(key)) {
                        let parts = key.split('/');
                        let channel = 'source' + parts[0];
                        let upi = parts[1];
                        if (!(upi in SIM1sciencesList)) {
                            SIM1sciencesList[upi] = {};
                        }
                        SIM1sciencesList[upi][channel] = SIM1sciences[key];
                    }
                }  
                let SIM1sciencesArray = [];
                for (var key in SIM1sciencesList) {
                    let entry = { 
                        'recordname' : key,
                        'scienceschannels': SIM1sciencesList[key]
                    }
                    // silly workaround to have 0's in the empty sources:
                    if (!entry.scienceschannels) {
                        entry.scienceschannels = {};
                    }
                    if (!entry.scienceschannels.source35) {
                        entry.scienceschannels.source35 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source36) {
                        entry.scienceschannels.source36 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source39) {
                        entry.scienceschannels.source39 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source40) {
                        entry.scienceschannels.source40 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source41) {
                        entry.scienceschannels.source41 = {
                            'uniq': 0
                        };
                    }
                    if (!entry.scienceschannels.source51) {
                        entry.scienceschannels.source51 = {
                            'uniq': 0
                        };
                    }
                    SIM1sciencesArray.push(entry);
                }

                return [OPSimagesArray, OPSsciencesArray, SIM1imagesArray, SIM1sciencesArray];
            }),
            catchError(this.handleError)
        );
    }

    getOPSRAWArchiveStatus() {
        return this.http.get('http://hr1-relay.busoc.be/raw_data_archive_statistics.csv', { responseType : 'text' });
    }

    getSIM1RAWArchiveStatus() {
        return this.http.get('http://hr1-relay.busoc.be/raw_data_archive_statistics_rubi_em.csv', { responseType : 'text' });
    }

    getVMUArchiveStatus() {
        // let archiveHeaders = new HttpHeaders();
        // archiveHeaders.append('responseType', 'text');
        // archiveHeaders.append('Cache-Control',  'no-cache');
        // archiveHeaders.append('Cache-control', 'no-store');
        return this.http.get("http://virtualtest2.busoc.be/HRD_Archive.csv", { responseType : 'text' }); // corse issue on localhost.. \\\\192.168.127.150\\dropbox\\ops\\01. FSL\\HRD_Archive.csv 
        //return this.http.get("../assets/HRD_Archive.csv", { responseType : 'text' }); //  \\\\192.168.127.150\\dropbox\\ops\\01. FSL\\HRD_Archive.csv
        
    }

    getYamcsEvents(queries) {
        let urls: any = [];
        let headers: HttpHeaders;
        headers = this.addYamcsHeader();
        console.log(queries);
        queries.forEach((query) => {
            urls.push(this.http.get(settingsFile.ControlCenterSpecs.YamcsServer.location + /archive/ + query.queries, { headers: new HttpHeaders().set('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication) }).map((res: Response) => res.event)); //.event ));
        });
        return Observable.forkJoin(urls)
        .pipe(
            map((data) => {
                data.forEach((d) => {
                    if (d) {
                        this.extractYamcsEvents(d);
                    } else {
                        let temp: any = [];
                        data[data.indexOf(d)] = temp;
                    }
                });
                return data;
            }),
            catchError(this.handleError)
        );
    }

    // "http://hr1-relay.busoc.be/upi/api/"; // OPS/images/playback/files/

    getYamcsTM(queries) {
        let urls: any = [];
        let headers: HttpHeaders;
        headers = this.addYamcsHeader();
        queries.forEach((query) => {
            query.queries.forEach((url) => { // maak een const interface van een TM item van yamcs en dan mappen op dat?? dan heb je deze error mss niet. werkt hoor maar niet netjes
               urls.push(this.http.get(settingsFile.ControlCenterSpecs.YamcsServer.location + /archive/ + url, { headers: new HttpHeaders().set('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication) }).map((res: Response) => res.parameter));//.json() )); //.parameter
            });
        });
        return Observable.forkJoin(urls)
        .pipe(
            map((data) => {
                //console.log(data);
                data.forEach((d) => {
                    if (d) {
                        this.extractYamcsTM(d);
                    } else {
                        let temp: any = [];
                        data[data.indexOf(d)] = temp;
                    }
                });
                return data;
            }),
            catchError(this.handleError)
        );

    }

    getYamcsInstances() {
        let headers: HttpHeaders;
        headers = this.addYamcsHeader();
        return this.http
            .get(settingsFile.ControlCenterSpecs.YamcsServer.location + /instances/, { headers: new HttpHeaders().set('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication) })
            .pipe(
                map((response: Response) => {
                    // console.log(response);
                    return response;//.json();//.instance;
                }),
                catchError(this.handleError)
            );
    }

    testYamcsAvailibility(): Observable<HttpResponse<YamcsMDBItems>> {
        let headers: HttpHeaders;
        headers = this.addYamcsHeader();
        return this.http
            .get<YamcsMDBItems>(settingsFile.ControlCenterSpecs.YamcsServer.location + /instances/, { headers: new HttpHeaders().set('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication), observe: 'response' })
            .pipe(
                catchError(this.handleError)
            );
    }

    getYamcsInstanceMDB(instance): Observable<HttpResponse<YamcsMDBItems>> {
        let headers: HttpHeaders;
        headers = this.addYamcsHeader();
        let url = settingsFile.ControlCenterSpecs.YamcsServer.location + /mdb/ + instance + '/parameters';
        return this.http
            .get<YamcsMDBItems>(url, { headers: new HttpHeaders().set('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication), observe: 'response' })
            .pipe(
                catchError(this.handleError)
            );
    }

    public getTokenFromAPI(logindata) {
        let body = logindata;
        let query = '/auth';
        return this.http
            .post(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, body, ); //{ headers: contentHeaders }
    }

    addYamcsHeader(): HttpHeaders {
        let yamcsHeaders = new HttpHeaders();
        yamcsHeaders.append('Content-Type', 'application/json');
        yamcsHeaders.append('Authorization', settingsFile.ControlCenterSpecs.YamcsServer.authentication);
        return yamcsHeaders;
    }

    addHourglassHeader(): HttpHeaders {
        let hourglassHeaders = new HttpHeaders();
        if (!this.checkLocalTokenValidity()) {
            console.log('kicked out');
            this.router.navigate(['login']);
        }
        // hourglassHeaders.set('Content-Type', 'application/json');
        hourglassHeaders.set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token'));
        // console.log(hourglassHeaders);
        return hourglassHeaders;
    }

    getAPIData(type: string, params = '', id = '') { // zonder 'queries' als input
        let headers = this.addHourglassHeader();
        let query = '/' + type + '/' + id + params;
        return this.http
            .get(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) })
            .pipe(
                map((response: Response) => {
                    // console.log(response);
                    return this.extractHourglassData(response, type);
                }),
                catchError(this.handleError)
            );
    }

    getHR1relayRAWstatus() {
        return this.http.get('http://www.virtualtest2.busoc.be/raw_data_archive_statistics.csv');
    }


    extractYamcsCmds(data) {
        data.forEach((d) => {
            d.start = new Date(d.commandId.generationTime);
            d.stop = new Date(d.commandId.generationTime);
            d.title = d.attr.find(function (obj) { return obj.name === 'source'; }).value.stringValue; // search specific key in the array of objects
            d.summary = d.title;
            d.tooltip = new Date(d.commandId.generationTime) + ' - ' + d.summary;
        });
        //console.log(data);
        return data;
    }

    extractYamcsEvents(data) {
        data.forEach((d) => {
            d.start = d.receptionTimeUTC; // generationTimeUTC
            d.stop = d.receptionTimeUTC;
            d.title = d.message;
            d.summary = d.message;
            d.tooltip = d.receptionTimeUTC + ' - ' + d.message;
        });
    }

    extractYamcsTM(data) {
        // console.log(data);
            data.forEach((d) => {
                d.generationTimeUTC = d.generationTimeUTC + 'Z';
                d.start = d.generationTimeUTC; // generationTimeUTC
                d.stop = d.generationTimeUTC; // no toDate??
                d.title = d.engValue.stringValue;
                d.tooltip = d.generationTimeUTC + ' - ' + d.engValue.stringValue;
                d.numberedDate = new Date (d.start).getTime();
            });
        return data;
    }

    extractHourglassData(data, type) {
        // let data = response.json();
        // console.log(data);
        // console.log(type);
        if (data) {
            if (!Array.isArray(data)) { // put singletons in an array
                let tempArray = [];
                tempArray.push(data);
                data = tempArray;
            };
            switch (type) {
                case 'events':
                        data.forEach((d) => {
                            d.dtstart = new Date( d.dtstart);
                            // console.log(d.dtstart);
                            d.dtend = new Date( d.dtend);
                            d.rtstart = new Date( d.rtstart);
                            //console.log(d.dtstart.getTimezoneOffset()); 
                            d.rtend = new Date( d.rtend);
                            d.lastmod = new Date( d.lastmod);
                            // for timeline and calendar:
                            d.start = d.dtstart;
                            d.stop = d.dtend;
                            d.end = d.dtend;
                            d.title = d.summary;
                            // let options: {'year': 'numeric', 'month': '2-digit', 'day': '2-digit', 'hour': '2-digit', 'minute': '2-digit', 'timeZoneName': 'short'};
                            d.tooltip = d.summary + ' - GMT' + Moment(d.dtstart).utc().format('DDDD')  + '/' + Moment(d.dtstart).utc().format('HH:mm') + ' (' + Moment(d.dtstart).utc().format('DD-MM-YYYY') + ') - GMT' + Moment(d.dtend).utc().format('DDDD')  + '/' + Moment(d.dtend).utc().format('HH:mm') + ' (' + Moment(d.dtend).utc().format('DD-MM-YYYY') + ')';
                            // for selectItem: (shouldnt be necessary anymore...)
                            d.label = d.summary + ' - GMT' + Moment(d.start).utc().format('DDD/HH:mm') + ' (' + Moment(d.start).utc().format('DD-MM-YYYY') + ')';
                            d.value = { uid: d.uid, summary: d.label, categories: d.categories, dtstart: d.dtstart, dtend: d.dtend }; // meer toegevoegd!! zie of er niets anders crashed
                            if ('todos' in d) {
                                if (d.todos) {
                                    d.todos.forEach((t) => {
                                        t.due = new Date(t.due);
                                        t.lastmod = new Date(t.lastmod);
                                    });
                                }
                            }
                            if ('history' in  d) {
                                if (d.history) {
                                d.history.forEach((h) => {
                                    h.dtstart = new Date(h.dtstart);
                                    h.dtend = new Date(h.dtend);
                                    h.rtstart = new Date(h.rtstart);
                                    h.rtend = new Date(h.rtend);
                                    h.lastmod = new Date(h.lastmod);
                                });
                                d.history.push({
                                    'dtstart': d.dtstart,
                                    'dtend': d.dtend,
                                    'summary': d.summary,
                                    'status': d.status,
                                    'lastmod': d.lastmod,
                                    'user': d.user,
                                });
                                }
                            } else {
                                d.history = [{
                                    dtstart: d.dtstart,
                                    dtend: d.dtend,
                                    lastmod: d.lastmod,
                                    user: d.user,
                                    summary: d.summary
                                }]
                            }
                            if ('generationTimeUTC' in  d) { // = to filter out yamcs events. is thisfield unique to events...?
                                d.start = d.generationTimeUTC;
                                d.stop = d.generationTimeUTC;
                                d.title = d.message;
                                d.tooltip = d.generationTimeUTC + ' - ' + d.message;
                                console.log(d);
                            }
                            // TDRS
                            if (d.categories.indexOf('ALL_KU_AVAIL') > -1) {
                                d.Ku = true;
                                d.S = false;
                            } else if (d.categories.indexOf('ALL_S_AVAIL') > -1) {
                                d.S = true;
                                d.Ku = false;
                            }
                            // DAYNIGHT
                            if (d.categories.indexOf('DayNight') > -1) {
                                d.day = true;
                                d.tooltip = 'ISS DAY - ' + Moment(d.dtstart).utc().format('DD-MM-YYYY HH:mm') + ' - ' +  Moment(d.dtend).utc().format('DD-MM-YYYY HH:mm');
                            }
                            // ATTITUDE
                            if (d.categories.indexOf('ATTITUDE') > -1) {
                                d.attitude = d.summary;
                            }
                            // SAA
                            if (d.categories.indexOf('SAA') > -1) {
                                d.tooltip = 'SAA - ' + Moment(d.dtstart).utc().format('DD-MM-YYYY HH:mm') + ' - ' +  Moment(d.dtend).utc().format('DD-MM-YYYY HH:mm');
                            }
                        });
                    break;
                case 'categories':
                    data.forEach((d) => {
                        d.label = d.name;
                        d.value = d.name; // d.uid;
                        d.lastmod = new Date(d.lastmod);
                    });
                    data.sort((a, b) => a.label.localeCompare(b.label));
                    break;
                case 'users':
                    data.forEach((d) => {
                        d.label = d.firstname + ' ' + d.lastname;
                        d.value = d.initial;
                    });
                    // sort alphabetically
                    data.sort((a, b) => a.label.localeCompare(b.label));
                    break;
                case 'slots':
                    data.forEach((d) => {
                        d.lastmod = new Date(d.lastmod);
                        d.label = d.uid + ' - ' + d.name.toUpperCase(); // + ' - ' + d.file;
                        d.value = { uid: d.uid, category: d.category };
                    });
                    // hack: remove slot 318826011 now until deleted in the hg db
                    let i = 0;
                    for (i = data.length - 1; i >= 0; i--) {
                        if (data[i].uid === 318826011) {
                            console.log(data[i]);
                            data.splice(i, 1);
                        }
                    }
                    console.log(data);
                    break;
                case 'downlinks':
                case 'uplinks':
                    data.forEach((d) => {
                        //console.log(d);
                        d.lastmod = new Date(d.lastmod);
                        // if ('event' in d) { // temp solution to a problem!!!!!!!!!!!!!!!!!!!!!!!!!
                        //     d.event.dtend = new Date(d.event.dtend); // functie om recursief alle key's te vinden en typen?
                        //     d.event.dtstart = new Date(d.event.dtstart);
                        //     d.event.lastmod = new Date(d.event.lastmod);
                        //     d.event.dtend = new Date(d.event.dtend);
                        // }
                        if (d.file) { // otherwise error if file has been deleted
                            d.file.lastmod = new Date(d.file.lastmod);
                        }
                        d.slot.lastmod = new Date(d.slot.lastmod);
                        if (d.event) {
                            d.event.dtend = new Date(d.event.dtend);
                            d.event.dtstart = new Date(d.event.dtstart);
                            d.event.lastmod = new Date(d.event.lastmod);
                            if (d.file) {
                                d.label = d.file.name + ' - ' + d.file.slot.toUpperCase() + ' - GMT' + Moment(d.event.dtstart).utc().format('DDD/HH:mm') + ' (' + Moment(d.event.dtstart).utc().format('DD-MM-YYYY') + ')'; // d.event.summary;
                            }
                        } else {
                            if (d.file) {
                                d.label = d.file.name + ' - ' + d.file.slot.toUpperCase();
                            }
                        }
                        d.value = { uid: d.uid, slot: d.slot };
                        if (d.event) {
                            d.headerName = d.event.summary + ' - GMT' + Moment(d.event.dtstart).utc().format('DDD/HH:mm') + ' (' + Moment(d.event.dtstart).utc().format('DD-MM-YYYY') + ')';
                        } else {
                            d.headerName = 'error';
                        }
                        // copy from applicationservice, cannot import because weird error...
                        let settings: any;
                        if (localStorage.getItem('gpt settings')) {
                            settings = JSON.parse(localStorage.getItem('gpt settings'));
                        }  else {
                            settings = null; // gives trouble!
                        }
                        //console.log(settings);

                        let temp = d.dropbox.slice(-12);
                        // temp fix until fixed on hg side. can be removed on hg side actually...
                        //gs
                        
                        try {
                            if (settings.payload === 'fsl') {
                                d.dropbox = 'S_' + d.slot.uid + '_'  + d.slot.name.slice(0, -4).toUpperCase() + '_File_' + d.file.name.split(".")[0].toUpperCase() + '_' + temp;
                            } else {
                                d.dropbox = 'S_' + d.slot.uid + '_' + settings.payload.toUpperCase() + '_' + d.slot.name.slice(0, -4).toUpperCase() + '_File_' + d.file.name.split(".")[0].toUpperCase() + '_' + temp;
                            }
                        } catch(err) {
                            console.log('There was something wrong with the filename parsing. ' + err);
                            if (settings.payload === 'fsl') {
                                d.dropbox = 'S_' + d.slot.uid + '_' + d.slot.name.slice(0, -4).toUpperCase() + '_File_' + d.slot.name.slice(0, -4).toUpperCase() + '_' + temp;
                            } else {
                                d.dropbox = 'S_' + d.slot.uid + '_' + settings.payload.toUpperCase() + '_' + d.slot.name.slice(0, -4).toUpperCase() + '_File_' + d.slot.name.slice(0, -4).toUpperCase() + '_' + temp;
                            }
                        }
                        //console.log(d.dropbox);
                    });
                    break;
                case 'transfers':
                    data.forEach((d) => {
                        d.lastmod = new Date(d.lastmod);
                        if (d.event) {
                            d.event.dtend = new Date(d.event.dtend);
                            d.event.dtstart = new Date(d.event.dtstart);
                            d.event.lastmod = new Date(d.event.lastmod);
                            // d.event.dtend = new Date(d.event.dtend);
                        }
                        if (d.event) {
                            d.headerName = d.event.summary + ' - GMT' + Moment(d.event.dtstart).utc().format('DDD/HH:mm') + ' (' + Moment(d.event.dtstart).utc().format('DD-MM-YYYY') + ')';
                        } else {
                            d.headerName = 'error';
                        }
                        // d.uplink.lastmod = new Date(d.uplink.lastmod);
                        // d.slot.lastmod = new Date(d.slot.lastmod);
                    });
                    break;
                case 'files':
                    // if (data[0] !== undefined) {
                        //console.log(data);
                    data.forEach((d) => {
                        if ('raw' in d) {
                            d.raw = atob(d.raw);
                        }
                        d.lastmod = new Date(d.lastmod);
                        if (d.slot) {
                            d.mmu = true;
                        } else {
                            d.mmu = false;
                        }
                        if (d.location) {
                            d.payload = true;
                        } else {
                            d.payload = false;
                        }
                        d.label = d.name; // necessary?: + ' - ' + d.metadata.groundLocation + ' - ' + d.metadata.onboardLocation;
                        d.value = { uid: d.uid };
                        // d.history = {
                        //     'lastmod': d.lastmod,
                        //     'name': d.name,
                        // }
                    });

                    // change comment field to description... no need for such a field. description is shared with all items
                    // data.forEach((d) => {
                    //     d.description = d.comment;
                    // });
                    break;
                case 'todos':
                    data.forEach((d) => {
                        d.due = new Date(d.due);
                        d.lastmod = new Date(d.lastmod);
                        d.categories.forEach((i) => {
                            // console.log(i);
                            // d.label = d.name;
                            // d.value = d.name;
                        });
                        if ('todos' in d) {
                            if (d.todos) {
                            d.todos.forEach((t) => {
                                t.due = new Date(t.due);
                                t.lastmod = new Date(t.lastmod);
                            });
                            }
                        }
                    });
                    break;
                case 'dors':
                    console.log(data);
                    break;
                default:
            }
        }
        // console.log(data);
        return data;
    }

    createAPIData(type: string, body) { // change to addHourglassData
        let headers = this.addHourglassHeader();
        let query = '/' + type + '/';
        return this.http
            .post(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, JSON.stringify(body), { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) })
            .pipe(
                map((response: Response) => {
                    //this.returnCodes(response);
                    return response;
                }),
                catchError(this.handleError)
            );
    }

    linkItems(item1: string, id1: number, item2: string, id2: number) {
        let headers = this.addHourglassHeader();
        let query = '/' + item1 + '/' + id1 + '/' + item2 + '/' + id2;
        // console.log(this.API_URL + query);
        return this.http
            .put(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, '', { headers })
            .map((response: Response) => {
                //this.returnCodes(response, 'put');
                return response.json();
            });
    }

    createChild(itemType: string, id: number, child: any) {
        console.log(child);
        let headers = this.addHourglassHeader();
        let query = '/' + itemType + '/' + id;
        return this.http
            .post(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, JSON.stringify(child), { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) })
            .map((response: Response) => {
                //this.returnCodes(response, 'put');
                return response.json();
        });
    }

    unlinkItems(item1: string, id1: number, item2: string, id2: number) {
        let headers = this.addHourglassHeader();
        let query = '/' + item1 + '/' + id1 + '/' + item2 + '/' + id2;
        // console.log(this.API_URL + query);
        return this.http
            .delete(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) })
            .map((response: Response) => {
                console.log(response);
               // this.returnCodes(response, 'put');
                return response.json();
            });
    }

    updateAPIData (type: string, id: number, body): Observable<HttpResponse<any>> { // change to updateHourglassData
        // console.log(body);
        let headers = this.addHourglassHeader();
        let query = '/' + type + '/';
        // console.log(typeof body.dtstart);
        // console.log(JSON.stringify(body));

        // convert dates to isostring (enough to just strignify the object)
        // body.dtstart = body.dtstart.toISOString();
        // body.dtend = body.dtend.toISOString();
        // body.executed.dtstart = body.executed.dtstart.toISOString();
        // body.executed.dtend = body.executed.dtend.toISOString();
        console.log(body);
        return this.http
            .put<any>(settingsFile.ControlCenterSpecs.HourglassServerLocation + query + id, JSON.stringify(body), { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')), observe : 'response' })
            .pipe(
                // map((response: Response) => {
                //     console.log(response);
                //     return response;
                // }),
                catchError(this.handleError)
            );

    }

    updateUserPswd (type: string, id: number, body): Observable<HttpResponse<any>> {
        // console.log(body);
        let headers = this.addHourglassHeader();
        let query = '/' + type; // allready contains id
        return this.http
            .put<any>(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, JSON.stringify(body), { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')), observe : 'response' })
            .pipe(
                // map((response: Response) => {
                //     console.log(response);
                //     return response;
                // }),
                catchError(this.handleError)
            );
    }

    deleteAPIData (type: string, params: number) { // change to hourglass
        let headers = this.addHourglassHeader();
        let query = '/' + type + '/' + params;
        return this.http
            .delete(settingsFile.ControlCenterSpecs.HourglassServerLocation + query, { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) })
            .pipe(
                map((response: Response) => {
                    return response;
                }),
                catchError(this.handleError)
            );
    }

    deleteMultipleHourglassData(queries) {
        let urls: any = [];
        let headers: HttpHeaders;
        headers = this.addHourglassHeader();
        queries.forEach((query) => {
            urls.push(this.http.delete(settingsFile.ControlCenterSpecs.HourglassServerLocation + query.url, { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) }).map((res: Response) => res)); // .json() ));
        });
        return Observable.forkJoin(urls)
            .pipe(
                map((data) => {
                    console.log(data);
                    return data;
                }),
                catchError(this.handleError)
            );
    }

    updateMultipleHourglassData(queries) {
        let urls: any = [];
        let headers: HttpHeaders;
        headers = this.addHourglassHeader();
        queries.forEach((query) => {
            urls.push(this.http.put(settingsFile.ControlCenterSpecs.HourglassServerLocation + query.url, JSON.stringify(query.body), { headers: new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('gpt_token')) }).map((res: Response) => res)); // .json() ));
        });
        return Observable.forkJoin(urls)
            .pipe(
                map((data) => {
                    console.log(data);
                    return data;
                }),
                catchError(this.handleError)
            );
    }

    //update!!!!!!!!!!!!!!! with new format
    returnCodes(response: Response, type = '') { // update with swagger
        console.log(response); // response bevat dus nietmeer .ok en .status enzo...
        if (!response.ok) {
            // // extract data from the body
            // console.log('hallo');
            // let error = response.json();
            // this.notificationService.addAlert('error', error.message);
            // console.log(error);
            // if (response.status === 400) {
            //     console.log('halllooo');
            //     this.notificationService.addAlert('error', error.message);
            // } else if (response.status === 401) {
            //     this.router.navigate(['login']);
            // } else {
            //     this.notificationService.addAlert('error', 'Server error.');
            // }
        } else if (response.ok) { // 200-299  - geef algemene success message ipv onderverdelen
            if (response.status === 200) {
                if (type === 'put') {
                    this.notificationService.addAlert('success', 'Item successfuly updated.');
                }
            }
            if (response.status === 201) {
                this.notificationService.addAlert('success', 'Item successfuly added.');
            }
            if (response.status === 204) { // 204 means no events in uplink table for hourglass...
                // this.notificationService.addAlert('success', 'Item successfuly deleted.', 3000);
            }
            // save received token
            // this.saveToken(response.headers.get('authorization').substring(7)); // does not (again) for the wip
        }
    }

    saveToken(token) {
        // console.log(token && (<any> window).jwt_decode(token.payload));
        localStorage.setItem('gpt_token', token);

    }

    checkLocalTokenValidity() { // returns true if current time < expire time
        let jwt = localStorage.getItem('gpt_token');
        let decodedJwt;
        try {
            decodedJwt = jwt && (<any> window).jwt_decode(jwt);
        } catch (e) {
            console.log(e);
            this.router.navigate(['login']);
        }
        if (decodedJwt) {
            // console.log(Moment().utc());
            // console.log(Moment(decodedJwt.exp).utc());
            // console.log(Moment(decodedJwt.exp).utc().isAfter(Moment.utc()));
            return Moment(decodedJwt.exp).utc().isAfter(Moment.utc());
        } else {
            return false;
        }
    }

    private handleError(error: HttpErrorResponse) {
        console.log(error);
        if (error.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          console.error('An error occurred:', error.error.message);
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          console.error(
            `Backend returned code ${error.status}, ` +
            `body was: ${error.error}`);
        }
        // return an ErrorObservable with a user-facing error message
        return new ErrorObservable(
            error.message + ' - ' + error.error );
          // 'Something bad happened; please try again later.');
      };

}

export interface YamcsMDBItems {
    parameter: [any];
}

export interface ShiftData {
    start_datetime: string;
    end_datetime: string;
    position: string;
    short_name: string;
    name: string;
    phone: string;
    verification_code: string;
    email_address: string;
}
