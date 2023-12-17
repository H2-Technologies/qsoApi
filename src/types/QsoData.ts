export class QsoData {
  band: string;
  callsign: string;
  exchange: string;
  frequency: string;
  mode: string;
  id: number;
  constructor() {
    this.id = Math.floor(Math.random() * 10000000000000);
  }
}
