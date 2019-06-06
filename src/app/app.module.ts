import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  NgModule,
  ApplicationRef
} from '@angular/core';
import {
  removeNgStyles,
  createNewHosts,
  createInputTransfer
} from '@angularclass/hmr';
import {
  RouterModule,
  PreloadAllModules
} from '@angular/router';
// Google stuff
// import { GoogleApiModule, ClientConfig } from 'ng-gapi';
// import { NG_GAPI_CONFIG } from '../../src/GoogleApiService';
// import { ClientConfig } from '../../lib/config/GoogleApiConfig';

import { Login } from './login';
import { TopNavbar } from './top-navbar';
import { ContainerApp } from './app.container.component';
import { UserInfo } from './user-info';
import { TasksComponent } from './tasks';
import { ItemDetails } from './item-details';
import { EventsComponent } from './events';
import { TimelineViewer } from './timeline';
import { ManagementComponent } from './management';
import { FilesComponent } from './files';
import { TransfersComponent } from './transfers';
import { CountdownComponent } from './countdown';
import { DailyOperationsReport } from './dailyoperationsreport';
import { TimelineReviewsComponent } from './timelinereviews';


/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';
// App is our top level component
import { AppComponent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';

import '../styles/styles.scss';
import '../styles/headings.css';

// PrimeNG
import { DataTableModule, SharedModule, ButtonModule, InputTextModule, DialogModule, ContextMenuModule, MenuModule,
  TabViewModule, AutoCompleteModule, CalendarModule, TreeModule, TreeNode, GrowlModule,
  DropdownModule, MultiSelectModule, PanelModule, ToggleButtonModule, CheckboxModule, EditorModule, ColorPickerModule, GMapModule
  } from 'primeng/primeng'; // moet dit wel hier... enkel als je ze overal gebruiitk?

import { ToastModule } from 'primeng/toast';
import { ScheduleModule } from 'primeng/schedule';

// Froala
import 'froala-editor/js/froala_editor.pkgd.min.js';
import { FroalaEditorModule, FroalaViewModule } from 'angular2-froala-wysiwyg';

import 'file-saver/FileSaver.js';


// Quill
// import 'quill/dist/quill.js';
// import '../../node_modules/quill/dist/quill.js';

// import '@cdc/timeline-stuff';

// import { ColorPickerModule } from 'angular2-color-picker';

// Services
import { ApiService } from './services/api.service';
import { GcalendarService } from './services/gcalendarservice';
import { AuthenticationService } from './services/authenticationservice';
import { AppointmentsService } from './services/appointmentsservice';
import { NotificationService } from './services/notification.service';
import { ApplicationService } from './services/application.service';
import { TimelineService } from './services/timeline.service';

import { MessageService } from 'primeng/api';

// Pipes
import { DOY } from './pipes/dayoffyear.pipe';

// import * as settingsFile from 'assets/settings/app-settings.json';

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

// let gapiClientConfig: ClientConfig = {
//     clientId: "CLIENT_ID",
//     discoveryDocs: ["https://analyticsreporting.googleapis.com/$discovery/rest?version=v4"],
//     scope: [
//         "https://www.googleapis.com/auth/analytics.readonly",
//         "https://www.googleapis.com/auth/analytics"
//     ].join(" ")
// };

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AppComponent,
    Login,
    TopNavbar,
    ContainerApp,
    UserInfo,
    TasksComponent,
    ItemDetails,
    EventsComponent,
    TimelineViewer,
    ManagementComponent,
    FilesComponent,
    TransfersComponent,
    CountdownComponent,
    DailyOperationsReport,
    DOY,
    TimelineReviewsComponent
    // settingsFile
  ],
  /**
   * Import Angular's modules.
   */
  imports: [
    BrowserModule,
    FormsModule, ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(ROUTES, { useHash: true, preloadingStrategy: PreloadAllModules }),
    FroalaEditorModule.forRoot(), FroalaViewModule.forRoot(), // Froala
    // GoogleApiModule.forRoot({
    //     provide: NG_GAPI_CONFIG,
    //     useValue: gapiClientConfig      
    // }),
    DataTableModule, SharedModule, ButtonModule, InputTextModule, DialogModule, ContextMenuModule, MenuModule,
    TabViewModule, AutoCompleteModule, MultiSelectModule, CalendarModule, TreeModule, GrowlModule, DropdownModule,
    PanelModule, ToggleButtonModule, CheckboxModule, EditorModule, ColorPickerModule, GMapModule,
    ScheduleModule, ToastModule // primeng
  ],
  /**
   * Expose our Services and Providers into Angular's dependency injection.
   */
  providers: [
    ApiService,
    AuthenticationService,
    AppointmentsService,
    GcalendarService,
    NotificationService,
    ApplicationService,
    TimelineService,
    ENV_PROVIDERS,
    APP_PROVIDERS,
    MessageService
  ]
})
export class AppModule {

  constructor(
    public appRef: ApplicationRef,
    public appState: AppState
  ) {}

  public hmrOnInit(store: StoreType) {
    if (!store || !store.state) {
      return;
    }
    console.log('HMR store', JSON.stringify(store, null, 2));
    /**
     * Set state
     */
    this.appState._state = store.state;
    /**
     * Set input values
     */
    if ('restoreInputValues' in store) {
      let restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  public hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
    /**
     * Save state
     */
    const state = this.appState._state;
    store.state = state;
    /**
     * Recreate root elements
     */
    store.disposeOldHosts = createNewHosts(cmpLocation);
    /**
     * Save input values
     */
    store.restoreInputValues  = createInputTransfer();
    /**
     * Remove styles
     */
    removeNgStyles();
  }

  public hmrAfterDestroy(store: StoreType) {
    /**
     * Display new elements
     */
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }

}
