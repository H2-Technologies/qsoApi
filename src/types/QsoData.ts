export class QsoData {
  band: string;
  callsign: string;
  exchange: string;
  frequency: string;
  id: number;
  mode: string;
  operator: string;
  constructor() {
    this.id = Math.floor(Math.random() * 10000000000000);
  }
}
