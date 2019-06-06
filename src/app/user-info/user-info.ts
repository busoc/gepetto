import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// import { contentHeaders } from '../common/headers';
import { ApiService } from '../services/api.service';
import { ApplicationService } from '../services/application.service';
import { PasswordModule } from 'primeng/password';
import { NotificationService } from '../services/notification.service';
import * as settingsFile from 'assets/settings/app-settings.json';
import { User } from '../models/user';

const template = require('./user-info.html');

@Component({
  selector: 'user-info',
  template: template,
})
export class UserInfo implements OnInit {
  public logoPath : string = '';
  private jwt: string;
  private decodedJwt: User;
  private settings: string;
  private bandSettings: string;
  private oldpswd: string;
  private newpswd: string;

  constructor(public router: Router, private _apiService: ApiService, private _ApplicationService: ApplicationService, public http: HttpClient, private notificationService: NotificationService) {}

  ngOnInit(){
    this.jwt = localStorage.getItem('gpt_token');
    this.decodedJwt = this.jwt && (<any> window).jwt_decode(this.jwt);
    this.logoPath = settingsFile.ControlCenterSpecs.logo;
    this.settings = localStorage.getItem('gpt settings');
    // this.bandSettings = localStorage.getItem('timeline settings');
  }

  private deleteSettings() {
    let allSettings = null;
    // localStorage.removeItem('gpt settings');
    // also remove it from the database...
    this._ApplicationService.setUserSetting(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id, allSettings );
    // this.
  }

  private updatePassword () {
    let passwords: any = {
      old: this.oldpswd,
      new: this.newpswd
    };
    this._apiService.updateUserPswd('users/' + this.decodedJwt.payload.id + '/passwd', this.decodedJwt.payload.id , passwords)
    .subscribe(
      (response) => {
        if (response.ok) {
          this.notificationService.addAlert('success', 'password updated');
        }
      },
      (err) => { console.log(err); this.notificationService.addAlert('error', 'Is the old password correct? --- ' + err), true },
      () => { }
    );
  }
}
