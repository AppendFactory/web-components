import { Component } from "@angular/core";
import { ProviderDetailComponent } from "./components/provider-detail/provider-detail.component";
import { ProvidersGridComponent } from "./components/providers-grid/providers-grid.component";

@Component({
  selector: "awc-root",
  imports: [ProviderDetailComponent, ProvidersGridComponent],
  standalone: true,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  selectedProvider: any = null;
}
