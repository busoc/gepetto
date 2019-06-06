 export class Todo {
   constructor (
    public summary?: string,
    public status?: string,
    public categories?: string[],
    public due?: Date,
    public priority?: string,
    // public dtstart?: Date,
    // public dtend?: Date,
    public description?: string,
    public todos?: Todo[],
    public uid?: number,
    public author?: string,
    public lastmod?: string,
    public assignees?: string[],
    public history?: Todo[],
    public events?: Event[],
    public cancelled?: boolean,
   ) {}
 }
