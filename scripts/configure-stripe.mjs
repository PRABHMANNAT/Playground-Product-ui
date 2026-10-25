// Run manually after placing a restricted Stripe key in ignored .env.local.
// Registers a webhook and saves its signing secret without printing credentials.
import {readFileSync,writeFileSync,existsSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
const target=resolve('.env.local');
if(existsSync(target)&&lstatSync(target).isSymbolicLink())throw new Error('Refusing a symlink environment file.');
let text=existsSync(target)?readFileSync(target,'utf8'):'';
const values={...process.env};for(const line of text.split(/\r?\n/)){const m=line.match(/^([A-Z_]+)\s*=\s*(.*)$/);if(m)values[m[1]]=m[2].trim().replace(/^["']|["']$/g,'');}
const key=values.STRIPE_SECRET_KEY;if(!key)throw new Error('Set STRIPE_SECRET_KEY in ignored .env.local first. Use a restricted key with Checkout and webhook endpoint permissions.');
const origin=values.SITE_URL;if(!origin||!origin.startsWith('https://'))throw new Error('Set SITE_URL to the HTTPS origin of your public pilot site. Stripe cannot deliver webhooks through owner-only sign-in.');
const parsed=new URL(origin);if(parsed.pathname!=='/'||parsed.search||parsed.hash||parsed.username||parsed.password)throw new Error('SITE_URL must be an HTTPS origin without a path.');
const endpoint=parsed.origin+'/api/stripe/webhook';
const headers={Authorization:`Bearer ${key}`,'Stripe-Version':'2026-08-26.dahlia'};
const list=await fetch('https://api.stripe.com/v1/webhook_endpoints?limit=100',{headers});if(!list.ok)throw new Error(`Stripe rejected webhook inspection (${list.status}). Check key permissions.`);
const existing=(await list.json()).data.find(e=>e.url===endpoint&&e.status==='enabled');
if(existing){if(values.STRIPE_WEBHOOK_SECRET){console.log('The webhook endpoint and local signing secret are already configured.');process.exit(0);}throw new Error('An endpoint already exists. Stripe only reveals its signing secret at creation; copy that endpoint’s secret into .env.local. No duplicate endpoint was created.');}
const form=new URLSearchParams({url:endpoint,'enabled_events[0]':'checkout.session.completed','enabled_events[1]':'checkout.session.async_payment_succeeded',description:'Playground paid pilot fulfillment'});
const response=await fetch('https://api.stripe.com/v1/webhook_endpoints',{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:form});if(!response.ok)throw new Error(`Stripe could not register the endpoint (${response.status}).`);
const created=await response.json();if(!created.secret)throw new Error('No signing secret returned. Inspect the created endpoint in Stripe.');
const line=`STRIPE_WEBHOOK_SECRET="${created.secret}"`;text=/^STRIPE_WEBHOOK_SECRET=.*$/m.test(text)?text.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m,line):text.trimEnd()+'\n'+line+'\n';writeFileSync(target,text,{mode:0o600});
console.log(JSON.stringify({configured:true,endpoint,endpointId:created.id,secretSavedTo:'.env.local',next:'Apply STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to hosted runtime settings, set SALES_ENABLED=true after confirming the offers, then redeploy. No code changes are needed.'}));
