import { LicenseData } from "../types/LicenseData";

export default async function parseCsv(data: Blob) {
  let csv = await data.text()
  let lines: String[] = csv.toString().split('\n');
  for (let i = 0; i < lines.length; i++) {
    let license: LicenseData = new LicenseData();
    let columns = lines[i].toString().split(/,||\\r?\\n|\\r/g);
    license.callsign = columns[4];
    license.first_name = columns[8];
    license.last_name = columns[10];
    console.log(license.first_name);
    console.log(license.last_name);
  }
}
