import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Proveedor } from "../../models/listado.mode";
import { NgClass } from "@angular/common";
import { ImageSliderComponent } from "../image-slider/image-slider.component";

@Component({
  selector: "awc-provider-card",
  imports: [NgClass, ImageSliderComponent],
  templateUrl: "./provider-card.component.html",
  styleUrl: "./provider-card.component.scss",
})
export class ProviderCardComponent {
  @Input() data!: Proveedor;
  @Input() tab!: "viveros" | "cultivos" | "proveedores" | "florerias" | "accesorios" | "mayoristas";

  @Output() select = new EventEmitter<any>();

  onClick() {
    this.select.emit(this.data);
  }
}
