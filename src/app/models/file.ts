 export class File {
   constructor (
     public name?: string,
     public uid?: number,
     public location?: string,
     public comment?: string,
     public lastmod?: string,
     public description?: string,
     public person?: string,
     public raw?: string,
     public metadata?: {
       onboardLocation?: string,
       groundLocation?: string,
       crc?: string
     },
     // public bytes?: string,
     public mmu?: boolean,
     public payload?: boolean,
     public sum?: string,
     public history?: File[],
     public dummy?: boolean,
     public length?: number,
     public categories?: string[],
   ) {}
 }