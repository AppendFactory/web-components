import { Route } from '@angular/router';
import { AppComponent } from './app.component';
import { DetalleComponent } from './detalle/detalle.component';

export const appRoutes: Route[] = [
    { path: '', component: AppComponent },
    { path: 'detalle/:id', component: DetalleComponent },
];
