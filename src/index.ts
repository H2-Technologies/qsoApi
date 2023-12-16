import dotenv from 'dotenv';
import express from 'express';
import parseCsv  from './helpers/parseCsv'
import { XMLParser } from 'fast-xml-parser';
import { supabase } from './lib/supabaseClient';
import { LicenseData } from './types/LicenseData';

const app = express();
global.QRZ_KEY = "";
dotenv.config();

let req: Response;
async function start() {
  req = await fetch(`https://xmldata.qrz.com/xml/current/?username=${process.env.QRZ_USER};password=${process.env.QRZ_PASS}`);
  let res: string = await req.text();
  let json = new XMLParser().parse(res);
  global.QRZ_KEY = json.QRZDatabase.Session.Key;
}
start();

app.get('/', (req, res) => {
  res.send('Hello World');
})

app.get('/callsigns/:callsign', async (req, res) => {
  const { data, error } = await supabase.from("callsigns").select('*').eq("callsign", req.params.callsign);
  if (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
    return;
  }
  if (data.length == 0 || data[0].last_fetched > 604800000) {
    let request: Response = await fetch(`https://xmldata.qrz.com/xml/current/?s=${global.QRZ_KEY};callsign=${req.params.callsign}`);
    let response: string = await request.text();
    let json = new XMLParser().parse(response).QRZDatabase.Callsign;
    let licenseData: LicenseData = new LicenseData();
    licenseData.callsign = json.call;
    licenseData.county = json.county;
    licenseData.email = json.email;
    licenseData.first_name = json.fname;
    licenseData.last_fetched = new Date().getTime();
    licenseData.last_name = json.name;
    licenseData.qsl_mgr = json.qslmgr;
    licenseData.state = json.state;

    const { data, error } = await supabase.from('callsigns').upsert(licenseData).select();
    if (error) {
      console.error(error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }

    res.status(200).send(data[0]);
    return;
  }
  res.status(200).send(data[0]);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
})