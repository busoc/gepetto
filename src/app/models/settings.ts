import { Timeline } from '../models/timeline';

export class Settings {
  constructor (
    public route?: string,
    public payload?: string,
    public timelineBands?: {
      any
    },
    public timelines?: Timeline[],
    public calendarCategories?: string[],
    public timelineView?: {
      zoom: number,
      start: Date,
    },
    public selectedTimeline?: {
      name: string,
      // value: any
    }
  ) {}
}

//   export interface Event {
//    uid: any;
//    summary: string;
//    status: string;
//    comment?: string;
//    source?: string;
//    categories: any[];
//    lastmod: string;
//    history?: any[];
//    dtstart: string;
//    dtend: string;
//  }

