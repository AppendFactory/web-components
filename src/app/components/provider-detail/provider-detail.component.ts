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
import {
  DomSanitizer,
  SafeHtml,
  SafeResourceUrl,
} from "@angular/platform-browser";

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
  mapaUrl = signal<SafeResourceUrl | null>(null);
  dias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  private readonly service = inject(ProviderService);
  private sanitizer = inject(DomSanitizer);
  detalle = signal<Proveedor | null>(null);

  ngOnInit() {
    if (this.provider?.id) {
      this.isLoading.set(true);
      this.service.getProviderById(this.provider.id).subscribe((data) => {
        this.detalle.set(data);

        if (data.lat && data.lng) {
          const url = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBGX45DwEtcg6I31Qu7KQR99QlLFoTzpew&q=${data.lat},${data.lng}`;
          this.mapaUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        }

        this.isLoading.set(false);
      });
    }
  }

  closeDetail() {
    this.close.emit();
  }

  getSanitizedContent(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
