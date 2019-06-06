// Service to define the possible bands the user can select from and where band-specific calculations are performed

import { Injectable, Output } from '@angular/core';
import { TimelineBand } from '../models/timelineband';
import Moment from 'moment';
import { ApplicationService } from '../services/application.service';
import { exec } from 'child_process';

@Injectable()

export class TimelineService {

    constructor(private _ApplicationService: ApplicationService) {
    }

    public incrementTimingBand(tempstartdate: Date, tempenddate: Date) {
        let incrementStart = Moment(tempstartdate);
        let incrementEnd = Moment(tempenddate)
        let temp;
        temp = Moment(tempstartdate).day(1);
        let incrementTiming = [
            {stop: incrementStart.toDate(), start: incrementStart.toDate(), title: 'Increment Start'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-1'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-2'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-3'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-4'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-5'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-6'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-7'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-8'},
            {stop: incrementStart.toDate(), start: incrementStart.subtract(1, 'months').toDate(), title: 'I-9'},
            {start: tempstartdate, stop: temp.add(1, 'weeks').toDate(), title: 'wk1'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk2'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk3'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk4'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk5'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk6'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk7'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk8'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk9'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk10'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk11'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk12'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk13'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk14'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 15'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 16'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 17'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 18'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 19'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 20'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 21'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 22'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 23'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 24'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 25'},
            {start: temp.toDate(), stop: temp.add(1, 'weeks').toDate(), title: 'wk 26'},
        ];
        this._ApplicationService.sortObj(incrementTiming, 'start');
        let i = 0;
        for (i = incrementTiming.length - 1; i >= 0; i--) {
            if (incrementTiming[i].start > tempenddate) {
                incrementTiming.splice(i, 1); // remove wk xx if over increment end date
            }
        }
        return incrementTiming;
    }

    public ASIM_Meas_SAAStatus_HK_Conversion(query, loadStart, loadStop) {
        let convertedSaaData = [];
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'IN' && query.events.indexOf(event) !== 0) {
                convertedSaaData.push({
                    start: event.start,
                });
                j++;
            }
            if (event.engValue.stringValue === 'OUT' && query.events.indexOf(event) !== 0) {
                convertedSaaData[j - 1].stop = event.start;
            }
        });
        return convertedSaaData;
    }

    public ASIM_Meas_SUNStatus_HK_Conversion(query, loadStart, loadStop) {
        let convertedSunData = [];
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'DAY') {
                if (convertedSunData[j - 1]) {
                    convertedSunData[j - 1].stop = event.start;
                }
                convertedSunData.push({
                    start: event.start,
                    stop: event.stop,
                    day: true
                });
                j++;
            }
            if (event.engValue.stringValue === 'NIGHT' && query.events.indexOf(event) !== 0) {
                convertedSunData[j - 1].stop = event.start;
                convertedSunData.push({
                    start: event.start,
                    stop: event.stop,
                    day: false
                });
                j++;
            }
        });
        return convertedSunData;
    }

    public MXGSModeAsRunConversion(query, loadStart, loadStop) {
        let convertedMXGSmodes = [];
        convertedMXGSmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            backgroundColor: '#3333ff',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'Boot') {
                event.backgroundColor = '#66ffff';
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Configuration') {
                if (query.bandInfo.hideTitle) {
                    event.backgroundColor = '#ffffff';
                } else {
                    event.backgroundColor = '#66a3ff';
                }
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Operational') {
                event.backgroundColor = '#00b300';
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.backgroundColor = '#cc0000';
                event.engValue.stringValue = 'OFF';
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                event.backgroundColor = '#00b300';
                event.title = 'OFF';
                event.summary = 'OFF';
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMXGSmodes[convertedMXGSmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMXGSmodes, 'numberedDate');
        // remove entries with Undefinied and OFF
        // loop backwards through array to delete items. otherwise you mess up the indices
        for (i = convertedMXGSmodes.length - 1; i >= 0; i--) {
            if (convertedMXGSmodes[i].engValue.stringValue === 'OFF') {
                convertedMXGSmodes.splice(i, 1);
            }
        }
        return convertedMXGSmodes;
    }

    public sortMXGSModes(query, loadStart, loadStop, mode) {
        let convertedMXGSmodes = [];
        convertedMXGSmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'Boot') {
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Configuration') {
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Operational') {
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.engValue.stringValue = 'OFF';
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                event.title = 'OFF';
                event.summary = 'OFF';
                convertedMXGSmodes[i - 1].stop = event.start;
                convertedMXGSmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMXGSmodes[convertedMXGSmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMXGSmodes, 'numberedDate');
        // remove entries with Undefinied and OFF
        // loop backwards through array to delete items. otherwise you mess up the indices
        for (i = convertedMXGSmodes.length - 1; i >= 0; i--) {
            if (convertedMXGSmodes[i].engValue.stringValue === 'OFF') {
                convertedMXGSmodes.splice(i, 1);
            }
        }
        let finalEvents = [];
        convertedMXGSmodes.forEach((event) => {
            if (event.engValue.stringValue === mode) {
                event.title = ' ';
                finalEvents.push(event);
            }
        });
        return finalEvents;
    }

    public MMIAModeAsRunConversion(query, loadStart, loadStop) {
        let convertedMMIAmodes = [];
        convertedMMIAmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            backgroundColor: '#3333ff',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'Boot') {
                event.backgroundColor = '#66ffff';
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Configuration') {
                if (query.bandInfo.hideTitle) {
                    event.backgroundColor = '#ffffff';
                } else {
                    event.backgroundColor = '#66a3ff';
                }
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Operational') {
                event.backgroundColor = '#00b300';
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.backgroundColor = '#cc0000';
                event.engValue.stringValue = 'SHUTDOWN';
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                event.backgroundColor = '#00b300';
                event.title = 'OFF';
                event.summary = 'OFF';
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMMIAmodes[convertedMMIAmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMMIAmodes, 'numberedDate');
        // remove entries with Undefinied and OFF
        // loop backwards through array to delete items. otherwise you mess up the indices
        for (i = convertedMMIAmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAmodes[i].engValue.stringValue === 'SHUTDOWN') {
                convertedMMIAmodes[i].stop = Moment(convertedMMIAmodes[i].start).add(70, 'seconds').toDate().toISOString();
                if (convertedMMIAmodes[i + 1]) { // otherwise error if latest
                    if (convertedMMIAmodes[i + 1].start < convertedMMIAmodes[i].stop) {
                        convertedMMIAmodes[i + 1].stop = convertedMMIAmodes[i].stop;
                    }
                }
            }
        }
        // error with || so a bit silly to go through it twice...
        for (i = convertedMMIAmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAmodes[i].engValue.stringValue === 'OFF') {
                convertedMMIAmodes.splice(i, 1);
            }
        }
        for (i = convertedMMIAmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAmodes[i].engValue.stringValue === 'SHUTDOWN') {
                convertedMMIAmodes.splice(i, 1);
            }
        }
        return convertedMMIAmodes;
    }

    public sortMMIAModes(query, loadStart, loadStop, mode) {
        let convertedMMIAmodes = [];
        convertedMMIAmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            //console.log(event);
            if (event.engValue.stringValue === 'Boot') {
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Configuration') {
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Operational') {
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.engValue.stringValue = 'SHUTDOWN';
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                event.title = 'OFF';
                event.summary = 'OFF';
                convertedMMIAmodes[i - 1].stop = event.start;
                convertedMMIAmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMMIAmodes[convertedMMIAmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMMIAmodes, 'numberedDate');
        // // remove entries with Undefinied and OFF
        // // loop backwards through array to delete items. otherwise you mess up the indices
        for (i = convertedMMIAmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAmodes[i].engValue.stringValue === 'SHUTDOWN') {
                convertedMMIAmodes[i].stop = Moment(convertedMMIAmodes[i].start).add(70, 'seconds').toDate().toISOString();
                if (convertedMMIAmodes[i + 1]) { // otherwise error if latest
                    if (convertedMMIAmodes[i + 1].start < convertedMMIAmodes[i].stop) {
                        convertedMMIAmodes[i + 1].stop = convertedMMIAmodes[i].stop;
                    }
                }
            }
        }
        // error with || so a bit silly to go through it twice...
        for (i = convertedMMIAmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAmodes[i].engValue.stringValue === 'OFF') {
                convertedMMIAmodes.splice(i, 1);
            }
        }
        for (i = convertedMMIAmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAmodes[i].engValue.stringValue === 'SHUTDOWN') {
                convertedMMIAmodes.splice(i, 1);
            }
        }
        let finalEvents = [];
        convertedMMIAmodes.forEach((event) => {
            if (event.engValue.stringValue === mode) {
                event.title = ' ';
                finalEvents.push(event);
            }
        });
        console.log(finalEvents);
        return finalEvents;
    }

    public MMIASubmodeAsRunConversion(query, loadStart, loadStop) {
        let convertedMMIAsubmodes = [];
        convertedMMIAsubmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            backgroundColor: '#3333ff',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'Data_Processing') {
                if (query.bandInfo.hideTitle) {
                    event.backgroundColor = '#ffffff';
                } else {
                    event.backgroundColor = '#009933';
                }
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Undefined') {
                    event.title = 'Undefined';
                    event.backgroundColor = '#ff6600';
                    convertedMMIAsubmodes[i - 1].stop = event.start;
                    convertedMMIAsubmodes.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                event.title = 'OFF';
                event.backgroundColor = '#ff6600';
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.backgroundColor = '#cc0000';
                event.engValue.stringValue = 'SHUTDOWN';
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Triggered') {
                event.backgroundColor = '#ff6600';
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Timed') {
                event.backgroundColor = '#ff66cc';
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMMIAsubmodes[convertedMMIAsubmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMMIAsubmodes, 'numberedDate');
        for (i = convertedMMIAsubmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAsubmodes[i].engValue.stringValue === 'SHUTDOWN') {
                convertedMMIAsubmodes[i].stop = Moment(convertedMMIAsubmodes[i].start).add(70, 'seconds').toDate().toISOString();
                if (convertedMMIAsubmodes[i + 1]) { // otherwise error if latest
                    if (convertedMMIAsubmodes[i + 1].start < convertedMMIAsubmodes[i].stop) {
                        convertedMMIAsubmodes[i + 1].stop = convertedMMIAsubmodes[i].stop;
                    }
                }
            }
        }
        // error with || so a bit silly to go through it twice...
        for (i = convertedMMIAsubmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAsubmodes[i].engValue.stringValue === 'OFF') {
                    convertedMMIAsubmodes.splice(i, 1);
            }
        }
        for (i = convertedMMIAsubmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAsubmodes[i].engValue.stringValue === 'SHUTDOWN') {
                    convertedMMIAsubmodes.splice(i, 1);
            }
        }
        console.log(convertedMMIAsubmodes);
        return convertedMMIAsubmodes;
    }

    public sortMMIASubmodes(query, loadStart, loadStop, mode) {
        let convertedMMIAsubmodes = [];
        convertedMMIAsubmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'Data_Processing') {
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Undefined') {
                    event.title = 'Undefined';
                    convertedMMIAsubmodes[i - 1].stop = event.start;
                    convertedMMIAsubmodes.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                event.title = 'OFF';
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.engValue.stringValue = 'SHUTDOWN';
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Triggered') {
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Timed') {
                convertedMMIAsubmodes[i - 1].stop = event.start;
                convertedMMIAsubmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMMIAsubmodes[convertedMMIAsubmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMMIAsubmodes, 'numberedDate');
        for (i = convertedMMIAsubmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAsubmodes[i].engValue.stringValue === 'SHUTDOWN') {
                convertedMMIAsubmodes[i].stop = Moment(convertedMMIAsubmodes[i].start).add(70, 'seconds').toDate().toISOString();
                if (convertedMMIAsubmodes[i + 1]) { // otherwise error if latest
                    if (convertedMMIAsubmodes[i + 1].start < convertedMMIAsubmodes[i].stop) {
                        convertedMMIAsubmodes[i + 1].stop = convertedMMIAsubmodes[i].stop;
                    }
                }
            }
        }
        // error with || so a bit silly to go through it twice...
        for (i = convertedMMIAsubmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAsubmodes[i].engValue.stringValue === 'OFF') {
                    convertedMMIAsubmodes.splice(i, 1);
            }
        }
        for (i = convertedMMIAsubmodes.length - 1; i >= 0; i--) {
            if (convertedMMIAsubmodes[i].engValue.stringValue === 'SHUTDOWN') {
                    convertedMMIAsubmodes.splice(i, 1);
            }
        }
        let finalEvents = [];
        convertedMMIAsubmodes.forEach((event) => {
            if (event.engValue.stringValue === mode) {
                event.title = ' ';
                finalEvents.push(event);
            }
        });
        return finalEvents;
    }

    public MXGSSubmodeAsRunConversion(query, loadStart, loadStop) {
        let convertedMXGSsubmodes = [];
        convertedMXGSsubmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            backgroundColor: '#3333ff',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'High_Background') {
                event.backgroundColor = '#cc3300';
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Undefined') {
                    event.title = 'Undefined';
                    if (query.bandInfo.hideTitle) {
                        event.backgroundColor = '#ffffff';
                    } else {
                        event.backgroundColor = '#ff6600';
                    }
                    convertedMXGSsubmodes[i - 1].stop = event.start;
                    convertedMXGSsubmodes.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                event.title = 'OFF';
                event.backgroundColor = '#ff6600';
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.backgroundColor = '#cc0000';
                event.engValue.stringValue = 'OFF';
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'TGF_Search') {
                event.backgroundColor = '#33cc33';
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Auroral_Capture') {
                event.backgroundColor = '#ff3399';
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMXGSsubmodes[convertedMXGSsubmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMXGSsubmodes, 'numberedDate');
        for (i = convertedMXGSsubmodes.length - 1; i >= 0; i--) {
            if (convertedMXGSsubmodes[i].engValue.stringValue === 'OFF') {
                convertedMXGSsubmodes.splice(i, 1);
            }
        }
        return convertedMXGSsubmodes;
    }

    public sortMXGSSubmodes(query, loadStart, loadStop, mode) {
        let convertedMXGSsubmodes = [];
        convertedMXGSsubmodes[0] = {
            start: loadStart.toISOString(),
            stop: loadStop.toISOString(),
            engValue: {
                stringValue: 'OFF'
            },
            title: 'OFF',
            tooltip: 'OFF',
            summary: 'OFF',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'High_Background') {
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Undefined') {
                    convertedMXGSsubmodes[i - 1].stop = event.start;
                    convertedMXGSsubmodes.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'OFF') {
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.engValue.stringValue = 'OFF';
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'TGF_Search') {
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Auroral_Capture') {
                convertedMXGSsubmodes[i - 1].stop = event.start;
                convertedMXGSsubmodes.push(event);
                i++;
            }
            j++;
        });
        convertedMXGSsubmodes[convertedMXGSsubmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedMXGSsubmodes, 'numberedDate');
        for (i = convertedMXGSsubmodes.length - 1; i >= 0; i--) {
            if (convertedMXGSsubmodes[i].engValue.stringValue === 'OFF') {
                convertedMXGSsubmodes.splice(i, 1);
            }
        }
        let finalEvents = [];
        convertedMXGSsubmodes.forEach((event) => {
            if (event.engValue.stringValue === mode) {
                event.title = ' ';
                finalEvents.push(event);
            }
        });
        return finalEvents;
    }

    public DHPUModeAsRunConversion(query, loadStart, loadStop) {
        let convertedDHPUmodes = [];
        convertedDHPUmodes[0] = {
            start: loadStart.toISOString(),
            stop:  loadStop.toISOString(),
            engValue: {
                stringValue: 'SHUTDOWN'
            },
            title: 'SHUTDOWN',
            tooltip: 'SHUTDOWN',
            summary: 'SHUTDOWN',
            backgroundColor: '#cc0000',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'CONFIGURATION') {
                event.backgroundColor = '#0066ff';
                convertedDHPUmodes[i - 1].stop = event.start;
                convertedDHPUmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'OPERATIONAL') {
                    event.title = 'OPERATIONAL';
                    event.backgroundColor = '#00b300';
                    convertedDHPUmodes[i - 1].stop = event.start;
                    convertedDHPUmodes.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.backgroundColor = '#cc0000';
                convertedDHPUmodes[i - 1].stop = event.start;
                convertedDHPUmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'PATCHING') {
                event.backgroundColor = '#ff66cc';
                convertedDHPUmodes[i - 1].stop = event.start;
                convertedDHPUmodes.push(event);
                i++;
            }
            j++;
        });
        convertedDHPUmodes[convertedDHPUmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedDHPUmodes, 'numberedDate');
        // shorten shutdown modes to 70 seconds: solved in next yamcs server
        convertedDHPUmodes.forEach((event) => {
            if (event.engValue.stringValue === 'SHUTDOWN') {
                event.stop = Moment(event.start).add(70, 'seconds').toDate().toISOString();
            }
        });
        return convertedDHPUmodes;
    }

    public FSLRecModeConversion(query, loadStart, loadStop) {
        let convertedFSLRecmodes = [];
        convertedFSLRecmodes[0] = {
            start: loadStart.toISOString(),
            stop:  loadStop.toISOString(),
            engValue: {
                stringValue: 'Off'
            },
            title: 'Off',
            tooltip: 'Off',
            summary: 'Off',
            backgroundColor: '#000000',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'Off') {
                event.backgroundColor = '#000000';
                convertedFSLRecmodes[i - 1].stop = event.start;
                convertedFSLRecmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'Playback') {
                    event.title = 'Playback';
                    event.backgroundColor = '#00b300';
                    convertedFSLRecmodes[i - 1].stop = event.start;
                    convertedFSLRecmodes.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'Record') {
                event.title = 'Record';
                event.backgroundColor = '#cc0000';
                convertedFSLRecmodes[i - 1].stop = event.start;
                convertedFSLRecmodes.push(event);
                i++;
            }
            if (event.engValue.stringValue === 'Processing') {
                event.title = 'Processing';
                event.backgroundColor = '#8DD3E8';
                convertedFSLRecmodes[i - 1].stop = event.start;
                convertedFSLRecmodes.push(event);
                i++;
            }
            event.title = ''; // otherwise too hectic timeline
            j++;
        });
        convertedFSLRecmodes[convertedFSLRecmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedFSLRecmodes, 'numberedDate');
        return convertedFSLRecmodes;
    }

    public FSLModeConversion(query, loadStart, loadStop) {
        let convertedFSLmodes = [];
        convertedFSLmodes[0] = {
            start: loadStart.toISOString(),
            stop:  loadStop.toISOString(),
            engValue: {
                stringValue: 'STANDBY'
            },
            title: 'STANDBY',
            tooltip: 'STANDBY',
            summary: 'STANDBY',
            backgroundColor: '#cc0000',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'C&C') {
                event.backgroundColor = '#0066ff';
                convertedFSLmodes[i - 1].stop = event.start;
                convertedFSLmodes.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'NOMINAL') {
                    event.title = 'NOMINAL';
                    event.backgroundColor = '#00b300';
                    convertedFSLmodes[i - 1].stop = event.start;
                    convertedFSLmodes.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'STANDBY') {
                event.backgroundColor = '#cc0000';
                convertedFSLmodes[i - 1].stop = event.start;
                convertedFSLmodes.push(event);
                i++;
            }
            j++;
        });
        convertedFSLmodes[convertedFSLmodes.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedFSLmodes, 'numberedDate');
        // temp: remove standby mode if it is longer then 15 minutes
        for (i = convertedFSLmodes.length - 1; i >= 0; i--) {
            let duration = 0;
            convertedFSLmodes[i].start = new Date(convertedFSLmodes[i].start);
            convertedFSLmodes[i].stop = new Date(convertedFSLmodes[i].stop);
            duration = Math.floor(((convertedFSLmodes[i].stop - convertedFSLmodes[i].start) / 1000) / 60);
            if (convertedFSLmodes[i].engValue.stringValue === 'STANDBY' && duration > 180) {
                convertedFSLmodes[i].stop = Moment(convertedFSLmodes[i].start).add(5, 'minutes').toDate();
            }
        }
        return convertedFSLmodes;
    }

    public FSLVMURECConversion(query, loadStart, loadStop) {
        let convertedFSLVMUREC = [];
        convertedFSLVMUREC[0] = {
            start: loadStart.toISOString(),
            stop:  loadStop.toISOString(),
            engValue: {
                stringValue: 'Stop'
            },
            title: 'Stop',
            tooltip: 'Stop',
            summary: 'Stop',
            backgroundColor: '#cc0000',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        let MSB = 0;
        let startLSW = 0;
        let stopLSW = 0;
        let counter = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'Running') {
                    event.title = 'Running';
                    event.backgroundColor = '#00b300';
                    convertedFSLVMUREC[i - 1].stop = event.start;
                    convertedFSLVMUREC.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'Stop') {
                event.backgroundColor = '#cc0000';
                convertedFSLVMUREC[i - 1].stop = event.start;
                convertedFSLVMUREC.push(event);
                i++;
            }
            j++;
        });
        convertedFSLVMUREC[convertedFSLVMUREC.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedFSLVMUREC, 'numberedDate');
        for (i = convertedFSLVMUREC.length - 1; i >= 0; i--) {
            if (convertedFSLVMUREC[i].engValue.stringValue === 'Stop') {
                convertedFSLVMUREC.splice(i, 1);
            }
        }
        for (i = convertedFSLVMUREC.length - 1; i >= 0; i--) {
            if (convertedFSLVMUREC[i].engValue.stringValue === 'Running') {
                let done = false;
                let memorySizes = [];
                query.events.forEach((event) => {
                    if (event.id.name === 'FSL_VMU_Rec_Mem_Free_LSW' && event.start < convertedFSLVMUREC[i].stop && event.start > convertedFSLVMUREC[i].start) {
                        memorySizes.push(event);
                    }
                });
                this._ApplicationService.sortObj(memorySizes, 'start');
                let startsize = 0;
                let stopsize = 0;
                if (memorySizes[0] && !memorySizes[1]) {
                    startsize = (memorySizes[0].engValue.uint32Value / 10);
                    stopsize = startsize;
                }
                if (memorySizes[1]) {
                    startsize = (memorySizes[0].engValue.uint32Value / 10);
                    stopsize = (memorySizes[memorySizes.length - 1].engValue.uint32Value / 10);
                }
                let recSize = startsize - stopsize;
                if (recSize) {
                    convertedFSLVMUREC[i].title = 'Rec.: ' + recSize.toFixed(1) + ' GB';
                }
            }
        }
        for (i = convertedFSLVMUREC.length - 1; i >= 0; i--) {
            if (convertedFSLVMUREC[i].title === 'Running') {
                convertedFSLVMUREC.splice(i, 1);
            }
        }
        return convertedFSLVMUREC;
    }

    public FSLHRDLConversion(query, loadStart, loadStop) {
        let convertedFSLHRDL = [];
        convertedFSLHRDL[0] = {
            start: loadStart.toISOString(),
            stop:  loadStop.toISOString(),
            engValue: {
                stringValue: 'STOP'
            },
            title: 'STOP',
            tooltip: 'STOP',
            summary: 'STOP',
            backgroundColor: '#cc0000',
            numberedDate:  new Date (loadStart).getTime()
        };
        this._ApplicationService.sortObj(query.events, 'numberedDate');
        let i = 1;
        let j = 0;
        let MSB = 0;
        let LSB = 0;
        let counter = 0;
        query.events.forEach((event) => {
            if (event.engValue.stringValue === 'ERROR') {
                event.backgroundColor = '#0066ff';
                convertedFSLHRDL[i - 1].stop = event.start;
                convertedFSLHRDL.push(event);
                i++;
            } else
            if (event.engValue.stringValue === 'TRANSMISSION') {
                    event.title = 'TRANSMISSION';
                    event.backgroundColor = '#00b300';
                    convertedFSLHRDL[i - 1].stop = event.start;
                    convertedFSLHRDL.push(event);
                    i++;
            } else
            if (event.engValue.stringValue === 'STOP') {
                event.backgroundColor = '#cc0000';
                convertedFSLHRDL[i - 1].stop = event.start;
                convertedFSLHRDL.push(event);
                i++;
            }
            j++;
        });
        convertedFSLHRDL[convertedFSLHRDL.length - 1].stop = Date.now();
        this._ApplicationService.sortObj(convertedFSLHRDL, 'numberedDate');
        for (i = convertedFSLHRDL.length - 1; i >= 0; i--) {
            if (convertedFSLHRDL[i].engValue.stringValue === 'STOP') {
                convertedFSLHRDL.splice(i, 1);
            }
        }
        for (i = convertedFSLHRDL.length - 1; i >= 0; i--) {
            if (convertedFSLHRDL[i].engValue.stringValue === 'TRANSMISSION') {
                
                query.events.forEach((event) => {
                    if (event.id.name === 'FSL_VMU_HRDL_RATE_MSB' && event.generationTimeUTC === convertedFSLHRDL[i].generationTimeUTC) {
                        MSB = event.engValue.uint32Value;
                    }
                    if (event.id.name === 'FSL_VMU_HRDL_RATE_LSB' && event.generationTimeUTC === convertedFSLHRDL[i].generationTimeUTC) {
                        LSB = event.engValue.uint32Value;
                    }
                });
                let kbps = (MSB * Math.pow(2, 8) + LSB).toString();
                convertedFSLHRDL[i].title = 'Transmitting - ' + kbps + ' kbps';
            }
        }
        return convertedFSLHRDL;
    }

    public generateDaysAndNights(query, loadStart?, loadStop?) {
        let firstTime = true;
        let DayAndNights = [];
        let previousEnd;
        let previousStart;
        if (query.events[1]) { // changed to [1] because with long eclipse -> only one 'day' event present...
            this._ApplicationService.sortObj(query.events, 'start');
            if (!loadStart && !loadStop) {
                loadStart = Moment(query.events[0].dtstart).subtract(1, 'days').toDate();
                loadStop = Moment(query.events[query.events.length - 1].dtend).add(1, 'days').toDate();
            }
            query.events.forEach((event) => {
                if (!firstTime) {
                    let day = {
                        start: previousEnd,
                        stop: event.dtstart,
                        day: false,
                        uid: event.uid,
                        tooltip: ' ISS NIGHT - ' + Moment(previousEnd).utc().format('DD-MM-YYYY HH:mm') + ' - ' +  Moment(event.dtstart).utc().format('DD-MM-YYYY HH:mm')
                    };
                    DayAndNights.push(day);
                    previousEnd = event.dtend;
                    previousStart = event.dtstart;
                } else {
                    previousStart = event.dtstart;
                    previousEnd = event.dtend;
                    firstTime = false;
                }
            });
            DayAndNights.unshift({
                day: true,
                start: loadStart,
                stop: DayAndNights[0].stop
            });
            DayAndNights.push({
                day: true,
                start: DayAndNights[DayAndNights.length - 1].stop,
                stop: loadStop,
                tooltip: ' ISS Day - ' + Moment(DayAndNights[DayAndNights.length - 1].stop).utc().format('DD-MM-YYYY HH:mm') + ' - ' +  Moment(loadStop).utc().format('DD-MM-YYYY HH:mm')
            });
        } else {
            let day = {
                start: loadStart,
                stop: loadStop,
                day: true,
                tooltip: ' ISS Day - ' + Moment(loadStart).utc().format('DD-MM-YYYY HH:mm') + ' - ' +  Moment(loadStop).utc().format('DD-MM-YYYY HH:mm')
            };
            DayAndNights.push(day);
        }
        return DayAndNights;
    }

    public generatePlannedMXGSSubmodes(query, loadStart, loadStop) {
        let firstTime = true;
        let inverse: any = [];
        let index = 0;
        let overwriteEvent: any = '';
        let previousEnd;
        let previousStart;
        if (query.events) {
            this._ApplicationService.sortObj(query.events, 'start');
            query.events.forEach((event) => {
                if (event.categories.indexOf('MXGS mode') > -1) {
                    overwriteEvent = event;
                } else {
                    event.title = 'HB';
                    event.tooltip = 'High_Background' + '-' + previousEnd + ' - ' + event.dtstart;
                    event.summary = 'High_Background';
                    event.backgroundColor = '#de5b7b';
                }
                if (!firstTime) {
                    let day = {
                        start: previousEnd,
                        stop: event.dtstart,
                        day: false,
                        categories: ['SAA'],
                        uid: event.uid,
                        title: 'TGF',
                        tooltip: 'TGF_Search' + '-' + previousEnd + ' - ' + event.dtstart,
                        summary: 'TGF_Search',
                        backgroundColor: '#5bde8f',
                    };
                    inverse.push(day);
                    previousEnd = event.dtend;
                    previousStart = event.dtstart;
                } else {
                    previousStart = event.dtstart;
                    previousEnd = event.dtend;
                    firstTime = false;
                }
                index++;
            });
            return query.events.concat(inverse);
        }
    }

    public generatePlanneMMIASubmodes(query, loadStart, loadStop) {
        let firstTime = true;
        let inverse: any = [];
        let previousEnd;
        let previousStart;
        if (query.events) {
            this._ApplicationService.sortObj(query.events, 'start');
            query.events.forEach((event) => {
                event.title = 'Data_processing';
                event.title = 'Data_processing';
                event.tooltip = 'Data_processing' + '-' + previousEnd + ' - ' + event.dtstart;
                event.summary = 'Data_processing';
                event.backgroundColor = '#de5b7b';
                if (!firstTime) {
                    let day = {
                        start: previousEnd,
                        stop: event.dtstart,
                        day: false,
                        uid: event.uid,
                        title: 'Triggered',
                        tooltip: 'Triggered' + '-' + previousEnd + ' - ' + event.dtstart,
                        summary: 'Triggered',
                        backgroundColor: '#5bde8f'
                    };
                    inverse.push(day);
                    previousEnd = event.dtend;
                    previousStart = event.dtstart;
                } else {
                    previousStart = event.dtstart;
                    previousEnd = event.dtend;
                    firstTime = false;
                }
            });
            return query.events.concat(inverse);
        }
    }

    public filterTaggedEvents(query, loadStart, loadStop, band) {
        let newArray: any = [];
        let inArray: any = [];
        if (query.events) {
            query.events.forEach((event) => {
                if ('showExecutedTimes' in band) {
                    if (band.showExecutedTimes) {
                        event.start = event.rtstart;
                        event.stop = event.rtend;
                    }
                }
                if (event.status === 'completed') {
                    event.backgroundColor = '#a6a6a6';
                    event.textColor = '#ff6666';
                }
                if (event.status === 'canceled') {
                    event.backgroundColor = '#cc00cc';
                    event.textColor = '#ff6666';
                }
                if (event.summary.includes('FAILED')) {
                    event.backgroundColor = '#ff471a';
                }
                inArray = [];
                for (let i = 0; i < query.filterCategories.length; i++) {
                    if (event.categories.indexOf(query.filterCategories[i]) > -1) {
                        inArray.push(true);
                    } else {
                        inArray.push(false);
                    }
                };
                if (inArray.includes(false)) {
                } else {
                    newArray.push(event);
                }
            });
            query.events = newArray;
            return query.events;
        }
    }

    public filterOPTIMISActivities(query, loadStart, loadStop, filter) {
        let filterArray: string[] = [];
        filterArray = filter.split(',');
        if (query.events) {
            let keep: boolean = false;
            let i = 0;
            for (i = query.events.length - 1; i >= 0; i--) {
                // find and show Mbps in the FSL HRD activity on the timeline
                if (query.events[i].summary == "COMMS-FSL HRD-DL") {
                    let str =  query.events[i].description.substring(query.events[i].description.indexOf(":") + 1);
                    str = str.split(" ");
                    query.events[i].title = query.events[i].title + ' (' + str[1] + ' ' + str[2] + ')';
                }
                keep = false;
                if (filter) {
                    filterArray.forEach((filterWord) => {
                        if (query.events[i].summary.includes(filterWord)) {
                            keep = true;
                        } else {
                        }
                    });
                    if (!keep) {
                        query.events.splice(i, 1);
                        keep = false;
                    }
                } 
            }
        }
        return query.events;
    }

}
