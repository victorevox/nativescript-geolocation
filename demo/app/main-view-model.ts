import { Observable } from 'tns-core-modules/data/observable';
import { Geolocation } from 'nativescript-geolocation';

export class HelloWorldModel extends Observable {
  public message: string;
  private geolocation: Geolocation;

  constructor() {
    super();

    this.geolocation = new Geolocation();
    this.message = this.geolocation.message;
  }
}