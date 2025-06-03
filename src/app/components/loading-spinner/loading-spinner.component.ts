import { Component } from '@angular/core';

@Component({
  selector: 'awc-loading-spinner',
  imports: [],
  template: `
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
  `,
  styleUrl: './loading-spinner.component.scss' 
})
export class LoadingSpinnerComponent {

}
