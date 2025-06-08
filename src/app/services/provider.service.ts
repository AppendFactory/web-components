import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Proveedor } from "../models/listado.mode";

@Injectable({
  providedIn: "root",
})
export class ProviderService {
  // private apiUrl = "http://localhost/public_html/wp-json/miapi/v1";
  private apiUrl = "https://revistaviveros.com.ar/wp-json/miapi/v1";

  constructor(private http: HttpClient) {}

  getListados(
    page: number = 1,
    perPage: number = 12,
    nombre?: string,
    tags?: string[],
    destacado?: boolean,
    categoria?: string,
    tab?: string
  ) {
    let params = new HttpParams().set("page", page).set("per_page", perPage);

    if (nombre) {
      params = params.set("nombre", nombre);
    }

    if (tags && tags.length > 0) {
      params = params.set("tags", tags.join(","));
    }

    if (destacado) {
      params = params.set("destacado", "1");
    }

    if (categoria) {
      params = params.set("category", categoria);
    }

    if(tab){
      params = params.set("tab", tab);
    }

    return this.http.get<{
      items: any[];
      total: number;
      pages: number;
      current_page: number;
    }>(this.apiUrl + '/listados', { params });
  }

  getProviderById(id: number) {
    return this.http.get<Proveedor>(`${this.apiUrl}/listados/${id}`);
  }

  getCategoriasPorTab(tab: string) {
  return this.http.get<any[]>(`${this.apiUrl}/categorias?parent=${tab}`);
}
}
