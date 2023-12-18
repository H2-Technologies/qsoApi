import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import { QsoData } from './types/QsoData';
import { XMLParser } from 'fast-xml-parser';
import { supabase } from './lib/supabaseClient';
import { LicenseData } from './types/LicenseData';

const app = express();
global.QRZ_KEY = "";
dotenv.config();

app.use(express.json());

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
    licenseData.city = json.addr2;
    licenseData.country = json.country;
    licenseData.email = json.email == null ? 'null@null.com' : json.email;
    licenseData.first_name = json.fname;
    licenseData.last_fetched = new Date().getTime();
    licenseData.last_name = json.name;
    licenseData.qsl_mgr = json.qslmgr == null ? 'QRZ' : json.qslmgr;
    licenseData.state = json.state == null ? 'N/A' : json.state;

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

app.post('/qso/:callsign', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  let json: QsoData = new QsoData();
  json.band = req.body.band;
  json.callsign = req.params.callsign;
  json.exchange = req.body.exchange;
  json.frequency = req.body.frequency;
  json.mode = req.body.mode;
  json.operator = req.params.callsign;
  const { error } = await supabase.from('qsoData').insert(json);
  if (error) {
    console.error(error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
    return;
  }
  res.sendStatus(200);
})

//set the options request on all routes to /qso *,  whether post or get, to allow any origin to access the api
app.options('/qso/:callsign', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.sendStatus(200);
})

app.get('/qso/:callsign', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  const { data, error } = await supabase.from('qsoData').select('*').eq('operator', req.params.callsign);
  if (error) {
    console.error(error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
    return;
  }
  res.status(200).send(data);
});

app.listen(4500, () => {
  console.log('Server is running on port 4500');
})
