import {
  Component,
  computed,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
} from "@angular/core";
import { Proveedor } from "../../models/listado.mode";
import { ProviderCardComponent } from "../provider-card/provider-card.component";
import { FormsModule } from "@angular/forms";
import { ProviderService } from "../../services/provider.service";
import { NgClass } from "@angular/common";
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";

@Component({
  selector: "awc-providers-grid",
  imports: [ProviderCardComponent, FormsModule, NgClass, LoadingSpinnerComponent],
  templateUrl: "./providers-grid.component.html",
  styleUrl: "./providers-grid.component.scss",
})
export class ProvidersGridComponent implements OnInit {
  @Output() providerSelected = new EventEmitter<any>();

  private readonly service = inject(ProviderService);

  isLoading = signal(false);
  listados = signal<Proveedor[]>([]);
  tabActiva = signal<"viveros" | "cultivos" | "proveedores">("viveros");
  itemsPerPage = signal(12);
  currentPage = signal(1);
  totalPages = signal(1);

  filtroNombre = signal("");
  filtroTags = signal<string[]>([]);
  filtroCategoria = signal("");
  filtroDestacado = signal(false);

  categorias = [
    "Plantas de Interior",
    "Plantas de Jardín",
    "Mayorista",
    "Accesorios",
    "Insumos",
  ];

  ngOnInit() {
    this.loadPage(1);
  }

  loadPage(page: number) {
    this.isLoading.set(true);

    this.service
      .getListados(
        page,
        this.itemsPerPage(),
        this.filtroNombre(),
        this.filtroTags(),
        this.filtroDestacado(),
        this.filtroCategoria()
      )
      .subscribe((response) => {
        this.listados.set(response.items);
        this.currentPage.set(response.current_page);
        this.totalPages.set(response.pages);
        this.isLoading.set(false);
      });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.loadPage(page);
  }

  tagsDisponibles = computed(() => {
    const allTags = this.listados().flatMap((item) => item.tags);
    return Array.from(new Set(allTags));
  });

  cambiarTab(tab: "viveros" | "cultivos" | "proveedores") {
    this.tabActiva.set(tab);
    this.currentPage.set(1);
  }

  toggleTag(tag: string) {
    const currentTags = this.filtroTags();

    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : currentTags.length < 5
      ? [...currentTags, tag]
      : currentTags;

    this.filtroTags.set(updatedTags);
  }

  aplicarFiltros() {
    this.currentPage.set(1);
    this.loadPage(1);
  }

  select(provider: any) {
    this.providerSelected.emit(provider);
  }
}
