 export class Category {

     constructor(
        public name: string,
        public summary?: string,
        // public activities?: string[],
        public uid?: number,
        // for multiselect:
        public user?: string,
        public value?: string,
        public label?: string
     ) {}
 }
