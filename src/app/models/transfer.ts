export class Transfer {
  constructor (
    public event: any,
    public uplink: any,
    public location?: string,

    public slot?: any,
    public file?: any,
    public status?: string,
    public lastmod?: Date,
    public uid?: number,
    public user?: string,
   ) {}
 }
