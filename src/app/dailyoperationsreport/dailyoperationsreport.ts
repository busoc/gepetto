import { Component, OnInit, EventEmitter , ComponentFactoryResolver , ViewChild, ViewContainerRef, ElementRef, Renderer2 } from '@angular/core';
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
import { Query } from '../query';
import { DOR } from '../models/daily_operations_summary';

import { Observable, Subscription } from 'rxjs';
import 'rxjs/add/observable/forkJoin';

import 'rxjs/add/operator/map';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ApplicationService } from '../services/application.service';
import { TimelineService } from '../services/timeline.service';

import { MenuItem, SelectItem, CheckboxModule, InputTextareaModule } from 'primeng/primeng';

import * as settingsFile from 'assets/settings/app-settings.json';
//import temparchiveFile from '../raw_data_archive_statistics.csv';
import timelineStuff from '@cdc/timeline-stuff';
import * as Moment from 'moment';
import * as jsPDF from 'jspdf';
import * as html2canvas from 'html2canvas';
import { POINT_CONVERSION_COMPRESSED } from 'constants';
import { endianness } from 'os';

// import * as pdfMake from 'pdfmake/build/pdfmake';
// import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Component({
  selector: 'dailyoperationsreport',
  entryComponents: [ ItemDetails, CountdownComponent ],
  templateUrl: './dailyoperationsreport.html',
})

export class DailyOperationsReport implements OnInit {

    public EPMessages: any[] = [];
    public HRDArchive: any[] = [];
    public HRDGroundData: any[] = [];
    public EPMessagesTableLoading: boolean = false;
    public HRDArchiveLoading: boolean = false;
    public showEPMessagesTable: boolean = false;
    public showHRDArchiveTable: boolean = true;
    public yamcsInstance: String = "fsl-ops";

    private author: string;
    private dorStartDate: Date;
    private dorDates: Date[] = [];
    private dorEndDate: Date;
    private dorSummary: String;
    private swVersion: String;
    private dorAnomalies: String;
    private dorActivitiesTable: any[] = [];
    private url: string;
    private events: Event[] = [];
    private MXGSCommAnomalies: any[] = [];
    private MMIACommAnomalies: any[] = [];
    private rubiColumns: boolean = true;
    private smdColumns: boolean = false; 

    constructor(
        public router: Router,
        public http: HttpClient,
        private _apiService: ApiService,
        private _notificationService: NotificationService,
        private _ApplicationService: ApplicationService,
        )
    {
        // pdfMake.vfs = pdfFonts.pdfMake.vfs;
        // let dd = { content: [
        //     {
        //         image: 'data:image/png;base64,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'
        //     }
        // ] };
        // pdfMake.createPdf(dd).download();
    }
    ngOnInit() {
        let jwt = localStorage.getItem('gpt_token');
        let decodedJwt = jwt && (<any> window).jwt_decode(jwt);
        this.author = decodedJwt.payload.firstname.charAt(0).toUpperCase() + decodedJwt.payload.firstname.slice(1) + ' ' + decodedJwt.payload.lastname.charAt(0).toUpperCase() + decodedJwt.payload.lastname.slice(1);
        this.dorStartDate = Moment().toDate();
        this.dorEndDate = Moment(this.dorStartDate).add(1, 'hours').toDate(); // add 1 hours to fix gmt offset...
        this.dorDates = [this.dorStartDate, this.dorEndDate];
        
        // asim only...
        this.swVersion = '3.7';
        
        // this.getDORSummary();
        if (this._ApplicationService.getPayload() === 'fsl') {
            this.HRDArchiveLoading = true;
            this.getHRDgroundStatus();
        }

        this._ApplicationService.itemsUpdated
        .subscribe( (data) => {
          switch (data.type) {
            case 'events': this.events = data.data;
                this.events.forEach((event) => {
                    event.checked = true;
                    event.description = event.description.replace(/<\/?[^>]+>/gi, ''); // get rid of html tags
                });
                this._ApplicationService.sortObj(this.events, 'dtstart');
                break;
            case 'dors':
                console.log(data);
                break;
            default:
          }
          });

          this._ApplicationService.payloadChange
          .subscribe( (data) => {
              if (this._ApplicationService.getPayload() === 'fsl') {
                  this.HRDArchiveLoading = true;
                  this.getHRDgroundStatus();
              }
          });

    }

    private csvJSON(csv) {
        let lines = csv.split('\n');
        let result = [];
        let headers = lines[0].split(',');
        lines.map(function(line, indexLine){
          if (indexLine < 1) return // Jump header line
          let obj = {};
          let currentline = line.split(',');
          headers.map(function(header, indexHeader){
            obj[header] = currentline[indexHeader];
          });
          result.push(obj);
        });
        result.pop(); // remove the last item because undefined values
        return result; // JavaScript object
      }

    private addRow() {
        this.dorActivitiesTable.push({
            start: '',
            activities: '',
            successfull: '',
            comments: ''
        });
    }


    private readUrl(event:any) {
        if (event.target.files && event.target.files[0]) {
          let reader = new FileReader();
          reader.onload = (event:any) => {
            this.url = event.target.result;
          }
          reader.readAsDataURL(event.target.files[0]);
        }
    }

    private changeDate() {
        if (this.dorDates[0] && this.dorDates[1]) {
            console.log(this.dorDates);
            this.dorStartDate = this.dorDates[0];
            this.dorEndDate = Moment(this.dorDates[1]).add(1, 'days').toDate();
            // fix to compensate for difference with utc!! hourglass should be fixed
            if (this._ApplicationService.getPayload() === 'asim') {
                this._ApplicationService.queryData({ type: 'events', categories: ['asim'], start: Moment(this.dorStartDate).add(1, 'hours').toDate(), end: Moment(this.dorEndDate).add(1, 'hours').toDate() });
            
                // 2 hours have to be added because the calendar input can only deal with local times!!!!!!!!! amnd not UTC/GMT :(
                // still to be solved...   
                this.getASIMCommsAnomalies(Moment(this.dorStartDate).add(1, 'hours').toDate(), Moment(this.dorEndDate).add(1, 'hours').toDate() )
            }
            if (this._ApplicationService.getPayload() === 'fsl') {
                this.getFSLEPMessages(Moment(this.dorStartDate).add(1, 'hours').toDate(), Moment(this.dorEndDate).add(1, 'hours').toDate() )
            }
        }

    }

    private downloadPdfDOR() {
        // canvas gives error but works:
        html2canvas(document.getElementById('dor')).then(function(canvas) {
            let img = canvas.toDataURL("image/png");
            let doc = new jsPDF({orientation: 'portrait'});
            doc.addImage(img, 'PNG', 7, 5);
            // doc.save('BUSOC-ISS-DOR-ASIM-' + this.dorDate.getFullYear().toString() + '_' + Moment(this.dorDate).format('DDDD').toString() + '.pdf');
            doc.save('BUSOC-ISS-DOR-ASIM-2018_GMT.pdf');
        });

        // html2canvas(document.getElementById('table')).then(function(canvas) {
        //     let self = this;
        //     let doc = new jsPDF();
        //     // doc.text(0,0,'page 1');
        //     let img = canvas.toDataURL("image/png");
        //     doc.addImage(img, 'png', 10, 10);
        //     doc.save('test.pdf');
        // });

        // let doc = new jsPDF('p','pt','a4');
        // doc.addHTML($("#table").get(0), function() {
        //     doc.save('Test.pdf');
        // });
        
    }

    private updateDORSummary() {
        let dor: any = {
            summary: this.dorSummary,
            status: 'scheduled',
            dtstamp: this.dorStartDate,
            categories: ['asim', 'operations'],
            metadata: {
            }
        };
        console.log(dor);
        this._apiService.createAPIData('dors', dor)
            .subscribe(
                (resp) => {
                    console.log(resp);
                    },
                (err) => { console.log(err); },
                () => {  }
            );
    }

    private getDORSummary() {
        let dor: any = {
            summary: this.dorSummary,
            status: 'scheduled',
            dtstamp: this.dorStartDate,
            categories: ['asim', 'operations'],
            metadata: {
            }
        };
        console.log(dor);
        this._apiService.getAPIData('dors', '', '1')
            .subscribe(
                (resp) => {
                    console.log(resp);
                    },
                (err) => { console.log(err); },
                () => {  }
            );
    }

    private getHRDgroundStatus() {
        // this.HRDGroundData = []; // define the object with an interface!!
        let HRDRAWData: any;
        let HR1RelayOPSimagesData = [];
        let HR1RelayOPSsciencesData = [];
        let HR1RelaySIMimagesData = [];
        let HR1RelaySIM1sciencesData = [];        
        let HRDArchive = [];
        this._apiService.getOPSRAWArchiveStatus()
        .subscribe(
            (data) => {
                HRDRAWData = this.csvJSON(data);
                },
            (err) => { console.log(err); },
            () => {
                this._apiService.getSIM1RAWArchiveStatus()
                .subscribe(
                    (data) => {
                        HRDRAWData = HRDRAWData.concat(this.csvJSON(data));
                        },
                    (err) => { console.log(err); },
                    () => {
                        this._apiService.getHR1relayStatus()
                                .subscribe(
                                    (resp) => {
                                            HR1RelayOPSimagesData = resp[0];
                                            HR1RelayOPSsciencesData = resp[1];
                                            HR1RelaySIMimagesData  = resp[2];
                                            HR1RelaySIM1sciencesData = resp[3];                                                                
                                        },
                                    (err) => { console.log(err); },
                                    () => {
                                        this._apiService.getVMUArchiveStatus()
                                        .subscribe(
                                            (data) => {
                                                HRDArchive = this.csvJSON(data);
                                            },
                                            (err) => {},
                                            () => {
                                                this.mergeHRDArrays(HRDArchive, HRDRAWData, HR1RelayOPSimagesData, HR1RelayOPSsciencesData, HR1RelaySIMimagesData, HR1RelaySIM1sciencesData)
                                                
                                            });
                                    }
                                );                        
                    });

                }
        );
    }

    private mergeHRDArrays(vmu, raw, opsimages, opssciences, sim1images, sim1sciences) {
        vmu.forEach((vmurecord) => {
            // define all 0's in case nothing is found on RAW/HR1
            // vmurecord[" source id 37"] = 0;
            // vmurecord[" source id 38"] = 0;
            // vmurecord[" source id 39"] = 0;
            // vmurecord[" source id 40"] = 0;
            // vmurecord[" source id 41"] = 0;
            // vmurecord[" source id 51"] = 0;
            vmurecord["imageschannels"] = {
                source33: { uniq: 0 },
                source34: { uniq: 0 },
                source37: { uniq: 0 },
                source38: { uniq: 0 },
            };
            vmurecord["scienceschannels"] = {
                source35: { uniq: 0 },
                source36: { uniq: 0 },
                source39: { uniq: 0 },
                source40: { uniq: 0 },
                source41: { uniq: 0 },
                source51: { uniq: 0 },
            };

            // add raw + hr1 relay OPS data:
            raw.forEach((rawrecord) => {
                if (vmurecord.recordname == rawrecord.recordname) {
                    vmurecord = Object.assign(vmurecord, rawrecord);
                    opsimages.forEach((imagesrecord) => {
                        if (vmurecord.recordname == imagesrecord.recordname) {
                            vmurecord = Object.assign(vmurecord, imagesrecord);
                            opssciences.forEach((sciencesrecord) => {
                                if (vmurecord.recordname == sciencesrecord.recordname) {
                                    vmurecord = Object.assign(vmurecord, sciencesrecord);
                                }
                            });
                        }
                    });
                }
            });
            // add hr1-relay SIM1 data:
            sim1images.forEach((imagesrecord) => {
                if (vmurecord.recordname == imagesrecord.recordname) {
                    vmurecord = Object.assign(vmurecord, imagesrecord);
                    sim1sciences.forEach((sciencesrecord) => {
                        if (vmurecord.recordname == sciencesrecord.recordname) {
                            vmurecord = Object.assign(vmurecord, sciencesrecord);
                        }
                    });
                }
            });
        });
        this.HRDArchive = vmu;
        this.HRDArchiveLoading = false;
        console.log(vmu);
    }

    private getFSLEPMessages (start, stop) {
        this.EPMessages = [];
        // this.CompgranTable = [];
        this.EPMessagesTableLoading = true;
        let queries = [
            {
                queries: []
            }
        ];
        queries[0].queries.push(this.yamcsInstance + '/parameters/FSL_EVENTS/Message' + '?&start=' + start.toISOString() + '&stop=' + stop.toISOString() + '&order=asc&limit=20000');
        this._apiService.getYamcsTM(queries)
            .subscribe(
                (resp) => {
                    let temp: any = [];
                    temp.push(resp);
                    this.EPMessages = temp[0][0];
                    this._ApplicationService.sortObj(this.EPMessages, 'generationTime');
                    this.CompgranDOR(this.EPMessages);
                    },
                (err) => { console.log(err); },
                () => { this.EPMessagesTableLoading = false; }
            );
    }

    private CompgranDOR(messages) {
        let run: any = { };
        let runstart: boolean = false;
        let runend: boolean = false;
        let playbacks: any[] = [];
        let playback: any = {};
        let playbackstart: boolean = false;
        let playbackend: boolean = false;
        let runs: any[] = [];
        if (messages[0]) {
            for (let i = 0; i < messages.length; i++) {
                // runs:
                if (messages[i].engValue.stringValue.includes('executing: DoAcqSeq')) {
                    runstart = true;
                    run = {
                        expseqid: messages[i].engValue.stringValue.split(' ')[2],
                        start: messages[i].generationTimeUTC,
                        runstart: Moment(messages[i].generationTimeUTC).subtract(2, 'hours').format('DDDD').toString() + '/' + messages[i].generationTimeUTC.substring(11, 16),
                        playback: {
                            fromrun: ''
                        },
                    };
                }
                if (messages[i].engValue.stringValue.includes('PF Piston Position: ') && runstart) {
                    run.piston = messages[i].engValue.stringValue.substring(21);
                }
                if (messages[i].engValue.stringValue.includes('Stop Record') && runstart) {
                    run.successfull = 'yes';
                    run.end = messages[i].generationTimeUTC;
                    runend = true;
                }
                if (runstart && runend) {
                    runs.push(run);
                    let match = false;
                    // put results in the compgrantable:
                    this.CompgranTable.forEach((record) => {
                        if (record.expseqid) {
                            if (record.expseqid.includes('-')) {
                                if (record.expseqid.split('-')[record.expseqid.split('-').length - 1] === run.expseqid) {
                                    if (match) {
                                        record.playback.fromrun = 'expseqID duplicate from other run! Verify Run Start date.';
                                    }
                                    match = true;
                                    record.start = run.start;
                                    record.runstart = run.runstart;
                                    // record.playback.ocvmu37 = playback.ocvmu37;
                                    // record.playback.lcvmu38 = playback.lcvmu38;
                                    // record.playback.corr1vmu39 = playback.corr1vmu39;
                                    // record.playback.corr2vmu40 = playback.corr2vmu40;
                                    // record.playback.synchvmu41 = playback.synchvmu41;
                                    // record.playback.mmavmu51 = playback.mmavmu51;
                                    record.piston = run.piston;
                                    record.successfull = run.successfull;
                                    // record.playback.duration = playback.duration;
                                }
                            }
                        }
                    });
                    if (!match) { // add to table if no match found from archive
                        this.CompgranTable.push(run);
                    }
                    run = {};
                    runstart = false;
                    runend = false;
                }
                // playbacks:
                if (messages[i].engValue.stringValue.includes('executing: Send_ExpDataToGND')) {
                    playbackstart = true;
                    run = {
                        expseqid: messages[i].engValue.stringValue.split(' ')[2],
                        start: '',
                        runstart: '',
                        playback: {
                            expseqid: messages[i].engValue.stringValue.split(' ')[2],
                            start: messages[i].generationTimeUTC,
                            playbackstart: Moment(messages[i].generationTimeUTC).subtract(2, 'hours').format('DDDD').toString() + '/' + messages[i].generationTimeUTC.substring(11, 16),
                            filesize: 0,
                            ocvmu37: '',
                            lcvmu38: '',
                            corr1vmu39: '',
                            corr2vmu40: '',
                            synchvmu41: '',
                            mmavmu51: '',
                            ochr137: '',
                            lchr138: '',
                            corr1hr139: '',
                            corr2hr140: '',
                            synchhr141: '',
                            mmahr151: '',
                            fromrun: ''
                        },
                    }
                }
                if (messages[i].engValue.stringValue.includes('Ch Info: ifid=61') && playbackstart) {
                    let temp = messages[i].engValue.stringValue.split('=');
                    run.playback.ocvmu37 = temp[temp.length - 1];
                }
                if (messages[i].engValue.stringValue.includes('Ch Info: ifid=62') && playbackstart) {
                    let temp = messages[i].engValue.stringValue.split('=');
                    run.playback.lcvmu38 = temp[temp.length - 1];
                }
                if (messages[i].engValue.stringValue.includes('Ch Info: ifid=63') && playbackstart) {
                    let temp = messages[i].engValue.stringValue.split('=');
                    run.playback.corr1vmu39 = temp[temp.length - 1];
                }
                if (messages[i].engValue.stringValue.includes('Ch Info: ifid=64') && playbackstart) {
                    let temp = messages[i].engValue.stringValue.split('=');
                    run.playback.corr2vmu40 = temp[temp.length - 1];
                }
                if (messages[i].engValue.stringValue.includes('Ch Info: ifid=65') && playbackstart) {
                    let temp = messages[i].engValue.stringValue.split('=');
                    run.playback.synchvmu41 = temp[temp.length - 1];
                }
                if (messages[i].engValue.stringValue.includes('Ch Info: ifid=66') && playbackstart) {
                    let temp = messages[i].engValue.stringValue.split('=');
                    run.playback.mmavmu51 = temp[temp.length - 1];
                }
                if (messages[i].engValue.stringValue.includes('Send_FileToGND OK') && playbackstart) {
                    run.playback.duration = Math.round(parseFloat(messages[i].engValue.stringValue.split(' ')[5]));
                    playbackend = true;
                }
                if (playbackstart && playbackend) {
                    //console.log(playback);
                    playbacks.push(run);
                    let match = false;
                    this.CompgranTable.forEach((record) => {
                        if (record.expseqid) {
                            if (record.expseqid.includes('-')) {
                                if (record.expseqid.split('-')[record.expseqid.split('-').length - 1] === run.playback.expseqid) {
                                    if (match) {
                                        record.playback.fromrun = 'expseqID duplicate from other run! Verify Playback Start date.';
                                    }
                                    match = true;
                                    // record.start = run.start;
                                    // record.runstart = run.runstart;
                                    record.playback.ocvmu37 = run.playback.ocvmu37;
                                    record.playback.lcvmu38 = run.playback.lcvmu38;
                                    record.playback.corr1vmu39 = run.playback.corr1vmu39;
                                    record.playback.corr2vmu40 = run.playback.corr2vmu40;
                                    record.playback.synchvmu41 = run.playback.synchvmu41;
                                    record.playback.mmavmu51 = run.playback.mmavmu51;
                                    // record.piston = run.piston;
                                    // record.successfull = run.successfull;
                                    record.playback.playbackstart = run.playback.playbackstart;
                                    record.playback.duration = run.playback.duration;
                                }
                            }
                        }
                    });
                    if (!match) { // add to table if no match found from archive
                        this.CompgranTable.push(run);
                    }
                    playback = {};
                    playbackstart = false;
                    playbackend = false;
                }
            };
            console.log(playbacks);
            
            // let hr1relaystatus: any[] = [];
            // this._apiService.getHR1relayStatus()
            //         .subscribe(
            //             (resp) => {
            //                 hr1relaystatus = resp;
            //                 console.log(hr1relaystatus);
            //                 },
            //             (err) => { console.log(err); },
            //             () => {
            //                 this.CompgranTable.forEach((run) => {
            //                     let queries = [
            //                         {
            //                             queries: []
            //                         }
            //                     ];
            //                     playbacks.forEach((playback) => {
            //                         if (playback.expseqid === run.expseqid) {
            //                             playback.filesize = 0;
            //                             playback.fromrun = '';
            //                             let tempfromrun1 = '';
            //                             let tempfromrun2 = '';
            //                             hr1relaystatus.forEach((status) => {
            //                                 if (playback.expseqid === status.upi.split('-')[status.upi.split('-').length - 1]) {
            //                                     if (tempfromrun1) {
            //                                         if (tempfromrun1 === status.upi.split('-')[0].split('/')[1]) {
            //                                         } else {
            //                                             tempfromrun2 = status.upi.split('-')[0].split('/')[1];
            //                                             playback.fromrun = tempfromrun1 + '/' + tempfromrun2;
            //                                         }
            //                                     } else {
            //                                         tempfromrun1 = status.upi.split('-')[0].split('/')[1];
            //                                     }
            //                                     console.log(status);
            //                                     // todo: display alles van raw and hadock. dan pas TM op mappen en duplicates highlighten?
            //                                     switch (status.upi.substring(0, 2)) {
            //                                         case '37':
            //                                             playback.ochr137 = status.uniq;
            //                                             break;
            //                                         case '38':
            //                                             playback.lchr138 = status.uniq;
            //                                             break;
            //                                         case '39':
            //                                             playback.corr1hr139 = status.uniq;
            //                                             break;
            //                                         case '40':
            //                                             playback.corr2hr140 = status.uniq;
            //                                             break;
            //                                         case '41':
            //                                             playback.synchhr141 = status.uniq;
            //                                             break;
            //                                         case '51':
            //                                             playback.mmahr151 = status.uniq;
            //                                             break;
            //                                         default:
            //                                     };
            //                                     playback.filesize = playback.filesize + Number(status.size);
            //                                 }
            //                             });
            //                             playback.filesize = Math.round(playback.filesize / 1000000);
            //                             run.playback = playback;
            //                         }
            //                     });
            //                 });
            //             }
            //         );
            // console.log(this.CompgranTable);

            // this.CompgranTable.forEach((run) => {
            //     playbacks.forEach((playback) => {
            //         if (playback.run === run.expseqid) {
            //             run.playback = playback;
            //         }
            //     });
            //     let queries = [
            //         {
            //             queries: []
            //         }
            //     ];
            //     queries[0].queries.push('fsl-ops' + '/parameters/APM/FSL_VMU_Rec_Mem_Free_LSW' + '?&start=' + run.end + '&stop=' + Moment(run.end).add(1, 'seconds').toDate().toISOString() + '&order=asc&limit=3');
            //     this._apiService.getYamcsTM(queries)
            //         .subscribe(
            //             (resp) => {
            //                 run.vmumem = resp[0][0].rawValue.uint32Value;
            //                 },
            //             (err) => { console.log(err); },
            //             () => {  }
            //         );
            // });
        }
    }

    private generateASIMCmdStack(start, stop) {
        // let dif = Moment.utc("Jan 1 00:00:00", "MMM DD hh:mm:ss").toDate();
        let cmds: any[] = [];
        let difStart;
        let difEnd;
        console.log(Moment().isDST());
        this.events.forEach( (event) => {
            if (Moment().isDST()) {
                difStart = (Moment(event.dtstart).diff(Moment('2018-01-01T00:00:00.000')) / 1000) + 18 - 3600; // summertime = -1 compaired to utc... 
                difEnd = (Moment(event.dtend).diff(Moment('2018-01-01T00:00:00.000')) / 1000) + 18 - 3600;
            } else {
                difStart = (Moment(event.dtstart).diff(Moment('2018-01-01T00:00:00.000')) / 1000) + 18; 
                difEnd = (Moment(event.dtend).diff(Moment('2018-01-01T00:00:00.000')) / 1000) + 18;
            }

            if (event.summary === 'CZT ROC enable' && event.checked) {
                cmds.push({
                    summary: 'ROC_ON',
                    time: event.dtstart,
                    commands: [
                        'ASIM_Cmd_Abort_Schedule(PCTS_CMD_LEN  : 3)',
                        'ASIM_Cmd_Load_Schedule(PCTS_CMD_LEN       : 7, PCTS_NAME_SCHEDULE :  "ROC_ON")',
                        'ASIM_Cmd_Start_Schedule(PCTS_CMD_LEN     :7, PCTS_SEC_OF_YEAR : ' + difStart + ',\nPCTS_YEAR        :2018,\nPCTS_MSEC        :0)'
                    ]
                });
                cmds.push({
                    summary: 'ROC_OFF',
                    time: event.dtend,
                    commands: [
                        'ASIM_Cmd_Abort_Schedule(PCTS_CMD_LEN  : 3)',
                        'ASIM_Cmd_Load_Schedule(PCTS_CMD_LEN       : 8, PCTS_NAME_SCHEDULE :  "ROC_OFF")',
                        'ASIM_Cmd_Start_Schedule(PCTS_CMD_LEN     :7, PCTS_SEC_OF_YEAR : ' + difEnd + ',\nPCTS_YEAR        :2018,\nPCTS_MSEC        :0)'
                    ]
                });
            }
            if (event.summary === 'MMIA - Cosmic Event Rejection Disabled' && event.checked) {
                cmds.push({
                    summary: 'CER_OFF',
                    time: event.dtstart,
                    commands: [
                        'ASIM_Cmd_Abort_Schedule(PCTS_CMD_LEN  : 3)',
                        'ASIM_Cmd_Load_Schedule(PCTS_CMD_LEN       : 8, PCTS_NAME_SCHEDULE :  "CER_OFF")',
                        'ASIM_Cmd_Start_Schedule(PCTS_CMD_LEN     :7, PCTS_SEC_OF_YEAR : ' + difStart + ',\nPCTS_YEAR        :2018,\nPCTS_MSEC        :0)'
                    ]
                });
            }
            if (event.summary === 'MMIA - Cosmic Event Rejection Enabled' && event.checked) {
                cmds.push({
                    summary: 'CER_ON',
                    time: event.dtend,
                    commands: [
                        'ASIM_Cmd_Abort_Schedule(PCTS_CMD_LEN  : 3)',
                        'ASIM_Cmd_Load_Schedule(PCTS_CMD_LEN       : 7, PCTS_NAME_SCHEDULE :  "CER_ON")',
                        'ASIM_Cmd_Start_Schedule(PCTS_CMD_LEN     :7, PCTS_SEC_OF_YEAR : ' + difStart + ',\nPCTS_YEAR        :2018,\nPCTS_MSEC        :0)'
                    ]
                });
            }
        });
        cmds = this._ApplicationService.sortObj(cmds, 'time');
        // console.log(cmds);
        let fileContent = '';
        cmds.forEach((item) => {
            item.commands.forEach((command) => {
                fileContent = fileContent + 'issue_tc (ITEM : ' + command + ');\n';
            });
        });
        // console.log(fileContent);
        let FileSaver = require('file-saver');
        let blob = new Blob([fileContent], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'DOY' + Moment(this.dorStartDate).format('DDDD').toString() + '_' + this._ApplicationService.getPayload().toUpperCase() + '_ROC_CER.ms');
    }

    private getASIMCommsAnomalies (start, stop) {
        let queries = [
            {
                queries: []
            }
        ];
        queries[0].queries.push('asim-fm' + '/events?start=' + start.toISOString() + '&stop=' + stop.toISOString() + '&order=desc&limit=10000&source=DHPU_ASW');

        this._apiService.getYamcsEvents(queries)
        .subscribe(
            (resp) => {
                this.MXGSCommAnomalies = [];
                this.MMIACommAnomalies = [];
                let anomalies = resp[0];
                this._ApplicationService.sortObj(anomalies, 'seqNumber');
                // get rid of it once yamcs can filter also out these type parameters etc.
                for (let i = anomalies.length - 1; i >= 0; i--) {
                    if (anomalies[i].type !== 'SS_MXGS') {
                        if (anomalies[i].type !== 'SS_MMIA') {
                            anomalies.splice(i, 1);
                        }
                    }
                }
                for (let i = 0; i < anomalies.length; i++) {
                    if (anomalies[i].message.includes('COMM_ANOMALY')) {
                        let anomaly = anomalies[i];
                        anomaly.time = 'GMT' + Moment(anomalies[i].generationTimeUTC).format('DDDD').toString() + '/' + anomalies[i].generationTimeUTC.slice(11);
                        if (anomalies[i].type === 'SS_MXGS') {
                            if (anomalies[i + 1].message.includes('SS_ALIVE_COUNT_ERR')) {
                                anomaly.message = anomaly.message.concat(', ' + anomalies[i + 1].message);
                                anomaly.discarded = '';
                                this.MXGSCommAnomalies.push(anomaly);
                            }
                            else if (anomalies[i + 1].message.includes('SS_HK_MON_ERR')) {
                                anomaly.message = anomaly.message.concat(', ' + anomalies[i + 1].message).concat(', ' + anomalies[i + 2].message).concat(', ' + anomalies[i + 3].message);
                                anomaly.discarded = '+1';
                                this.MXGSCommAnomalies.push(anomaly);
                            } else {
                                console.log('euhm, you missed one');
                                console.log(anomalies[i+1]);
                            }
                        }
                        else if (anomalies[i].type === 'SS_MMIA') {
                            if (anomalies[i + 1].message.includes('SS_ALIVE_COUNT_ERR')) {
                                anomaly.message = anomaly.message.concat(', ' + anomalies[i + 1].message);
                                anomaly.discarded = '';
                                this.MMIACommAnomalies.push(anomaly);
                            }
                            if (anomalies[i + 1].message.includes('SS_HK_MON_ERR')) {
                                anomaly.message = anomaly.message.concat(', ' + anomalies[i + 1].message).concat(', ' + anomalies[i + 2].message).concat(', ' + anomalies[i + 3].message);
                                anomaly.discarded = '+1';
                                this.MMIACommAnomalies.push(anomaly);
                            } else {
                                console.log('euhm, you also missed one');
                            }
                        } else {
                            console.log(anomalies[i+1]);
                        }
                    }
                }
                this._ApplicationService.sortObj(this.MXGSCommAnomalies, 'generationTime');
                this._ApplicationService.sortObj(this.MMIACommAnomalies, 'generationTime');
                console.log(this.MMIACommAnomalies);
            },
            (err) => { console.log(err); },
            () => {
            }
        );
    }
}
