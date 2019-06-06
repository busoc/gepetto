export class DOR {
  constructor (
  public dtstamp?: Date,
  public status?: string,
  public categories?: string[],
  public summary?: string,
  public metadata?: {
      any;
  },
  public uid?: number,
  public lastmod?: string,
  public user?: string,
  ) {}
}