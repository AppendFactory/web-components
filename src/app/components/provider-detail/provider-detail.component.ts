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
import { ImageSliderComponent } from "../image-slider/image-slider.component";
import { ProviderService } from "../../services/provider.service";
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";

@Component({
  selector: "awc-provider-detail",
  imports: [ImageSliderComponent, LoadingSpinnerComponent],
  templateUrl: "./provider-detail.component.html",
  styleUrl: "./provider-detail.component.scss",
})
export class ProviderDetailComponent implements OnInit {
  @Input() provider!: any;
  @Output() close = new EventEmitter<void>();

  isLoading = signal(false);

  apiUrl = "http://localhost/public_html/wp-json/miapi/v1/listados";
  detalle = signal<Proveedor | null>(null);

  private readonly service = inject(ProviderService);

  ngOnInit() {
    if (this.provider?.id) {
      this.isLoading.set(true);
      this.service.getProviderById(this.provider.id).subscribe((data) => {
        console.log(data);
        this.detalle.set(data);
        this.isLoading.set(false);
      });
    }
  }

  closeDetail() {
    this.close.emit();
  }
}
