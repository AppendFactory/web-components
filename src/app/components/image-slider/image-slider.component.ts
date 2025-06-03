import { Component, effect, Input, signal } from '@angular/core';

@Component({
  selector: 'awc-image-slider',
  imports: [],
  templateUrl: './image-slider.component.html',
  styleUrl: './image-slider.component.scss' 
})
export class ImageSliderComponent 
{
  @Input() images: string[] = [];
  @Input() autoSlide = false;
  @Input() interval = 3000; // ms

  current = signal(0);
  fullscreen = signal(false);

  next(event?: Event) {
    event?.stopPropagation();
    this.current.update(i => (i + 1) % this.images.length);
  }

  prev(event?: Event) {
    event?.stopPropagation();
    this.current.update(i => (i - 1 + this.images.length) % this.images.length);
  }

  goTo(index: number, event?: Event) {
    event?.stopPropagation();
    this.current.set(index);
  }

  toggleFullscreen(event?: Event) {
    event?.stopPropagation();
    this.fullscreen.update(f => !f);
  }

  constructor() {
  effect(() => {
    if (this.autoSlide && this.images.length > 1) {
      const id = setInterval(() => this.next(), this.interval);
      return () => clearInterval(id);
    }

    // 🔁 En caso de que no entre al if, retorná una función vacía
    return () => {};
  });
}
}
