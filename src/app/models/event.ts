import { Todo } from '../models/todo';

export class Event {

  constructor (
  public dtstart?: Date,
  public dtend?: Date,
  public rtstart?: Date,
  public rtend?: Date,
  public status?: string,
  public categories?: string[],
  public summary?: string,
  public comment?: string,
  public metadata?: {
      link: string, // fill out right names he
  },
  public description?: string,
  public uid?: number,
  public file?: number,
  public lastmod?: string,
  public todos?: Todo[],
  public history?: Event[],
  public attendees?: string[],
  public source?: string,
  public checked?: boolean,
  public user?: string,
  public raw?: string, // temparory he!!!!!!
  // for timeline:
  public start?: Date,
  public stop?: Date,
  public title?: string,
  public tooltip?: string,
  public Ku?: boolean,
  public S?: boolean,
  public backgroundColor?: string,
  public textColor?: string,
  // for calendar:
  public end?: Date,
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

