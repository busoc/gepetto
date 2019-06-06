 export class Slot {
   constructor (
     public name?: string,
     public uid?: number,
     // public sid?: number,
     public attachment?: string,
     public lastmod?: Date,
     public category?: string,
     public selectedFile?: string,
     public user?: string,
     public file?: string,
     public status?: string,
     // public label?: string,
   ) {}
 }