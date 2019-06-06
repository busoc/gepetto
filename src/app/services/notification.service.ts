import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute } from '@angular/router';

import { MessageService } from 'primeng/api';

@Injectable()

export class NotificationService {

    constructor(
        public router: Router,
        private messageService: MessageService
    ) {
    }

    public addAlert(alertType: string, alertMessage: string, keep?: boolean) {
        this.messageService.add({severity: alertType, summary: alertMessage, detail:'', sticky: keep});
    }
}
