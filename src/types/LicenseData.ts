export class LicenseData {
  callsign: string;
  created_at: string;
  first_name: string;
  id: number;
  last_name: string;
  state: string;
  constructor() {
    let date:any = new Date();
    let tz:string = (date.getTimezoneOffset() / 60).toString().padStart(2,"0");
    date = date.toISOString().replace('T', ' ').replace('Z', '').padEnd(23, "0") + `-${tz}`;
    this.created_at = date;
    this.id = Math.floor(Math.random() * 1000000000000000);
  }
}
