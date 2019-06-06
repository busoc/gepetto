import { TimelineBand } from './timelineband';

export class Timeline {
  constructor (
    public label: string,
    public value: {
      index: number,
      name: string,
      bands: TimelineBand[]
    }
  ) {}
}
