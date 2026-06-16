import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as Sentry from "@sentry/angular";

Sentry.init({
    dsn: "https://00cdb4959d871bb373b0096879bac961@o4511574827401216.ingest.us.sentry.io/4511574830546944",
    // To disable sending user data and HTTP bodies, uncomment the line below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/angular/configuration/options/#dataCollection
    // dataCollection: { userInfo: false, httpBodies: [] }
});


bootstrapApplication(App, appConfig).catch((err) => console.error(err));
