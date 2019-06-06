import { Pipe, PipeTransform } from '@angular/core';
import * as Moment from 'moment';

@Pipe({name: 'DOY'})
export class DOY implements PipeTransform {
  transform(value: Date): String { // is this in UTC???
    let doy: string = '';
    doy = Moment(value).format('DDDD');
    return doy;
  }
}
