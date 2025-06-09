import {
  AfterViewInit,
  Component,
  computed,
  effect,
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

declare const google: any;

@Component({
  selector: "awc-providers-grid",
  imports: [
    ProviderCardComponent,
    FormsModule,
    NgClass,
    LoadingSpinnerComponent,
  ],
  templateUrl: "./providers-grid.component.html",
  styleUrl: "./providers-grid.component.scss",
})
export class ProvidersGridComponent implements OnInit, AfterViewInit {
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
  filtroUbicacion = signal("");
  categorias = signal<{ id: number; name: string }[]>([]);

  locations = signal<
    { id: number; name: string; children: { id: number; name: string }[] }[]
  >([]);
  selectedParentLocation = signal<number | null>(null);
  childLocations = computed(() => {
    const parent = this.locations().find(
      (l) => l.id === this.selectedParentLocation()
    );
    return parent ? parent.children : [];
  });

  ngOnInit() {
    this.service.getLocations().subscribe((locations) => {
      this.locations.set(locations);
    });
    this.loadPage(1);
  }

  ngAfterViewInit() {
    const input = document.getElementById("ubicacionInput") as HTMLInputElement;
    if (input) {
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["(regions)"],
        componentRestrictions: { country: "AR" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          this.filtroUbicacion.set(place.formatted_address);
        } else if (place.name) {
          this.filtroUbicacion.set(place.name);
        }
      });
    }
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
        this.filtroCategoria(),
        this.tabActiva(),
        this.filtroUbicacion()
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

    this.service.getCategoriasPorTab(tab).subscribe((cats) => {
      this.categorias.set(cats);
    });
    this.cleanFilters();
    this.loadPage(1);
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

  onChildLocationChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filtroUbicacion.set(value);
  }

  selectedParentLocationEffect = effect(() => {
    this.filtroUbicacion.set("");
  });

  cleanFilters() {
    this.filtroNombre.set("");
    this.filtroTags.set([]);
    this.filtroCategoria.set("");
    this.filtroUbicacion.set("");
    this.categorias.set([]);
  }

  limpiarFiltros() {
    this.cleanFilters();
    this.currentPage.set(1);
    this.loadPage(1);
  }
}
