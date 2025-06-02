import { HttpClient } from "@angular/common/http";
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

@Component({
  selector: "awc-providers-grid",
  imports: [ProviderCardComponent, FormsModule],
  templateUrl: "./providers-grid.component.html",
  styleUrl: "./providers-grid.component.scss",
})
export class ProvidersGridComponent implements OnInit {
  @Output() providerSelected = new EventEmitter<any>();

  select(provider: any) {
    this.providerSelected.emit(provider);
  }

  private http = inject(HttpClient);

  listados = signal<Proveedor[]>([]);
  tabActiva = signal<"viveros" | "cultivos" | "proveedores">("viveros");
  paginaActual = signal(1);
  itemsPorPagina = 12;

  apiUrl = "http://localhost/public_html/wp-json/miapi/v1/listados";

  categorias = [
    "Plantas de Interior",
    "Plantas de Jardín",
    "Mayorista",
    "Accesorios",
    "Insumos",
  ];
  etiquetas = ["Orgánico", "Indoor", "Exterior", "Suculentas", "Acuáticas"];

  filtroCultivos = signal({
    nombre: "",
    categoria: "",
    etiquetas: [] as string[],
  });

  filtroProveedores = signal({
    nombre: "",
    categoria: "",
    etiquetas: [] as string[],
  });

  ngOnInit() {
    this.http.get<Proveedor[]>(this.apiUrl).subscribe((data) => {
      this.listados.set(data);
    });
  }

  listadosFiltrados = computed(() => {
    const tab = this.tabActiva();
    const all = this.listados();

    const filtrados = all.filter((item) => {
      if (tab === "cultivos") {
        const filtro = this.filtroCultivos();
        const nombreOk =
          !filtro.nombre ||
          item.title.toLowerCase().includes(filtro.nombre.toLowerCase());
        const categoriaOk =
          !filtro.categoria || item.category === filtro.categoria;
        const etiquetasOk = filtro.etiquetas.every((et) =>
          item.tags.includes(et)
        );
        return nombreOk && categoriaOk && etiquetasOk;
      }
      if (tab === "proveedores") {
        const filtro = this.filtroProveedores();
        const nombreOk =
          !filtro.nombre ||
          item.title.toLowerCase().includes(filtro.nombre.toLowerCase());
        const categoriaOk =
          !filtro.categoria || item.category === filtro.categoria;
        const etiquetasOk = filtro.etiquetas.every((et) =>
          item.tags.includes(et)
        );
        return nombreOk && categoriaOk && etiquetasOk;
      }
      return true;
    });

    const destacados = filtrados
      .filter((i) => i.type === "Destacado")
      .sort((a, b) => a.title.localeCompare(b.title));

    const normales = filtrados
      .filter((i) => i.type === "Normal")
      .sort((a, b) => a.title.localeCompare(b.title));

    const ordenados = [...destacados, ...normales];
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    return ordenados.slice(inicio, fin);
  });

  cambiarTab(tab: "viveros" | "cultivos" | "proveedores") {
    this.tabActiva.set(tab);
    this.paginaActual.set(1);

    console.log(tab);
  }

  totalPaginas = computed(() => {
    return Math.ceil(this.listadosFiltrados().length / this.itemsPorPagina);
  });

  filtroActivo() {
    return this.tabActiva() === "cultivos"
      ? this.filtroCultivos()
      : this.filtroProveedores();
  }

  onTagCheckboxChange(tag: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.onTagChange(tag, input.checked);
  }

  onTagChange(tag: string, checked: boolean) {
    const isCultivo = this.tabActiva() === "cultivos";
    const current = isCultivo
      ? this.filtroCultivos()
      : this.filtroProveedores();
    const updated = { ...current };

    if (checked) {
      if (updated.etiquetas.length < 5) {
        updated.etiquetas.push(tag);
      }
    } else {
      updated.etiquetas = updated.etiquetas.filter((t) => t !== tag);
    }

    isCultivo
      ? this.filtroCultivos.set(updated)
      : this.filtroProveedores.set(updated);
  }

  aplicarFiltros() {
    this.paginaActual.set(1);
  }
}
