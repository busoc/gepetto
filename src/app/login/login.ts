import { Component, OnInit, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../services/api.service';
import { ApplicationService } from '../services/application.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'login',
  templateUrl: './login.html'
})
export class Login implements OnInit {

  // public loggedIn = new EventEmitter();
  public authDetails: any;

  constructor(
    public router: Router,
    private _apiService: ApiService,
    public http: HttpClient,
    private _ApplicationService : ApplicationService,
    private _NotificationService: NotificationService,
    ) {
  }

  ngOnInit() {
    // trouble when user wants to log out...
    // if (this._apiService.checkLocalTokenValidity()) {
    //   this.router.navigate(['ContainerApp']);
    // }
    // this.loggedIn
    // .subscribe( (data) => { this.router.navigate(['ContainerApp']); });
  }

  private login(event, username, password) {
    event.preventDefault();
    let body = JSON.stringify({ user: username, passwd: password });
    this._apiService.getTokenFromAPI(body)
      .subscribe(
        (response) => { 
          console.log(response);
          this.authDetails = response;
          this._apiService.saveToken(this.authDetails.token);
        },//.json().token)
        (error) => { 
          console.log(error);
          if (error.statusText == 'Unknown Error') {
            alert('Server reply: ' + error.statusText + ('\nVPN active? If not, the Hourglass service is probably unreachable. Annoy Nicolas.'))
          } else {
            alert('Server reply: ' + error.statusText);
          } 
      },
        () => {
          this._ApplicationService.getUserInfo(localStorage.getItem('gpt_token') && (<any> window).jwt_decode(localStorage.getItem('gpt_token')).payload.id)
            .subscribe(
              (resp) => { console.log(resp); this._ApplicationService.setSettings(resp[0].settings); },
              (error) => { console.log(error); },
              () => { this.router.navigate(['ContainerApp']); }
            );
        }
      );
  }
}
