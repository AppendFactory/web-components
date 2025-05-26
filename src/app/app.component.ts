import { HttpClient } from '@angular/common/http';
import { Component, inject, input, linkedSignal, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'awc-root',
  imports: [RouterLink, RouterOutlet],
  standalone: true,
  templateUrl: "./app.component.html",
  styleUrl:  "./app.component.scss",
})
export class AppComponent implements OnInit{
   private http = inject(HttpClient);
  listados = signal<any[]>([]);
  apiUrl: string = 'http://localhost/Prueba1/wp-json/miapi/v1/listados';  
  ngOnInit() {
    if (this.apiUrl) {
      this.http.get<any[]>(this.apiUrl).subscribe(data => {
        console.log(data)
        this.listados.set(data);
      });
    }
  }
}
