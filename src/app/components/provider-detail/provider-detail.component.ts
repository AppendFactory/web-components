import { HttpClient } from "@angular/common/http";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from "@angular/core";
import { Proveedor } from "../../models/listado.mode";

@Component({
  selector: "awc-provider-detail",
  imports: [],
  templateUrl: "./provider-detail.component.html",
  styleUrl: "./provider-detail.component.scss",
})
export class ProviderDetailComponent implements OnInit {
  @Input() provider!: any;
  @Output() close = new EventEmitter<void>();
  
  apiUrl = "http://localhost/public_html/wp-json/miapi/v1/listados";
  detalle = signal<Proveedor | null>(null);

  

  private http = inject(HttpClient);
  

  ngOnInit() {
    if (this.provider?.id) {
      this.http
        .get<Proveedor>(`${this.apiUrl}/${this.provider.id}`)
        .subscribe((data) => {
          console.log(data)
          this.detalle.set(data);
        });
    }
  }

  closeDetail() {
    this.close.emit();
  }
}
