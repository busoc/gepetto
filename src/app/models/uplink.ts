export class Uplink {
  constructor (
    public event: any,
    public file: any,
    public slot: any,

    public lastmod?: Date,
    public status?: string,
    public user?: string,

    public label?: string,
    public uid?: number,
  ) {}
}
