import { Route } from "@angular/router";
import { AppComponent } from "./app.component";
import { ProviderDetailComponent } from "./components/provider-detail/provider-detail.component";
import { ProvidersGridComponent } from "./components/providers-grid/providers-grid.component";

export const appRoutes: Route[] = [
  {
    path: "",
    component: AppComponent,
    children: [
      { path: "", loadComponent: () => ProvidersGridComponent },
      { path: "detalle/:id", loadComponent: () => ProviderDetailComponent },
    ],
  },
];
