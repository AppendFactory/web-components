import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'awc-detalle',
  imports: [],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss'
})
export class DetalleComponent {

  item = signal<any>(null);
  apiUrl: string = 'http://localhost/Prueba1/wp-json/miapi/v1/listados';

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // this.http.get<any[]>(this.apiUrl).subscribe(data => {
    //   console.log(data)
    //   this.item.set(data.find(i => i.id == id))
    // });

    this.http.get<any>(`${this.apiUrl}/${id}`).subscribe(data => {
      this.item.set(data);
    });
  }

}
