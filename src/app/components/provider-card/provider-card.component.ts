import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Proveedor } from "../../models/listado.mode";
import { NgClass } from "@angular/common";

@Component({
  selector: "awc-provider-card",
  imports: [NgClass],
  templateUrl: "./provider-card.component.html",
  styleUrl: "./provider-card.component.scss",
})
export class ProviderCardComponent {
  @Input() data!: Proveedor;
  @Input() tab!: "viveros" | "cultivos" | "proveedores";

  @Output() select = new EventEmitter<any>();

  onClick() {
    this.select.emit(this.data);
  }
}
