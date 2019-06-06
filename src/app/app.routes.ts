import { Routes } from '@angular/router';

import { Login } from './login';
import { ContainerApp } from './app.container.component';
import { UserInfo } from './user-info';
import { TasksComponent } from './tasks';
import { EventsComponent } from './events';
import { TimelineViewer } from './timeline';
import { ManagementComponent } from './management';
import { FilesComponent } from './files';
import { TransfersComponent } from './transfers';
import { CountdownComponent } from './countdown';
import { DailyOperationsReport } from './dailyoperationsreport';
import { TimelineReviewsComponent } from './timelinereviews';

import { DataResolver } from './app.resolver';

export const ROUTES: Routes = [
  { path: '',      component: Login },
  { path: 'login',  component: Login },
  { path: 'countdown', component: CountdownComponent },
  {
    path: 'ContainerApp',
    component: ContainerApp,
    children:
    [
        {
            path: 'user-info',
            outlet: 'mainnav',
            component: UserInfo
        },
        {
            path: 'tasks',
            outlet: 'mainnav',
            component: TasksComponent
        },
        {
            path: 'events',
            outlet: 'mainnav',
            component: EventsComponent
        },
        {
            path: 'timeline',
            outlet: 'mainnav',
            component: TimelineViewer
        },
        {
            path: 'timelinereviews',
            outlet: 'mainnav',
            component: TimelineReviewsComponent
        },
        {
            path: 'management',
            outlet: 'mainnav',
            component: ManagementComponent
        },
        {
            path: 'files',
            outlet: 'mainnav',
            component: FilesComponent
        },
        {
            path: 'transfers',
            outlet: 'mainnav',
            component: TransfersComponent
        },
        {
        path: 'dailyoperationsreport',
        outlet: 'mainnav',
        component: DailyOperationsReport
        }
    ]
  },
  { path: '**',    component: Login },
];
