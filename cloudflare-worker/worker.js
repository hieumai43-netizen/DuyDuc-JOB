// JobLead VN V2.0.0 — independent of any old mold-workshop worker.
const VERSION='joblead-v2.7.0';
const HEAD={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const json=(data,status=200)=>new Response(JSON.stringify({service:'JobLead VN',...data}),{status,headers:HEAD});
const norm=s=>String(s||'').normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g,' ').trim();
const clean=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,160);
const QUERIES={
 industrial:['"em cần tìm việc" "công nhân"','"mình đang tìm việc" "khu công nghiệp"','"em muốn xin việc" "công ty"','"cần tìm việc" "ca ngày"'],
 export:['"em muốn đi Nhật" "xin tư vấn"','"em muốn đi xuất khẩu lao động"','"mình muốn đi XKLĐ"','"tìm đơn hàng đi Nhật"'],
 engineer:['"em là kỹ sư" "tìm việc"','"mình là kỹ sư" "đang tìm việc"','"em muốn tìm việc kỹ sư"','"kỹ sư cơ khí" "xin việc"'],
 general:['"em cần tìm việc" "phổ thông"','"mình cần tìm việc" "làm ngay"','"em xin việc" "không bằng cấp"','"ai có việc làm giới thiệu em"'],
 intern:['"em muốn đi thực tập sinh"','"em đang tìm đơn thực tập sinh"','"mình muốn đi thực tập sinh Nhật"','"xin tư vấn thực tập sinh"']
};
const INTENT=[/\b(em|mình|tôi|cháu)\s+(đang\s+|cần\s+|muốn\s+)?(tìm|xin)\s+(việc|chỗ làm|công việc)/,/\b(cần|muốn|đang)\s+tìm\s+(việc|chỗ làm|công việc)/,/\b(em|mình|tôi)\s+(muốn|định|cần)\s+đi\s+(nhật|xuất khẩu lao động|xklđ|thực tập sinh)/,/\b(ai có|có ai)\s+(việc|chỗ làm).*\b(giới thiệu|chỉ|cho)\b/,/\b(tìm đơn hàng|tìm đơn)\s+(đi nhật|xklđ|thực tập sinh)/];
const BAD=[/khuôn\s*(đúc|ép|dập|nhựa)/,/gia công (khuôn|nhựa|cơ khí)/,/\b(tuyển dụng|cần tuyển|đang tuyển|tuyển gấp|tuyển nhân viên|tuyển công nhân|tuyển kỹ sư|tuyển lao động|tuyển sinh|tuyển người|tuyển thợ|nhận hồ sơ|ứng tuyển ngay|nộp hồ sơ|job description|việc làm mới nhất|công ty chúng tôi|chúng tôi cần|chúng tôi tuyển)\b/,/\b(lương hấp dẫn|phúc lợi hấp dẫn|cơ hội việc làm|mô tả công việc|thông tin tuyển dụng|hotline tuyển dụng)\b/,/\b(dịch vụ tuyển dụng|trung tâm giới thiệu việc làm)\b/];
const HOST_BLOCK=['linkedin.com','topcv.vn','vieclam24h.vn','careerbuilder.vn','vietnamworks.com','indeed.com','jobsgo.vn','timviec365.vn'];
const fb=url=>{try{return /(^|\.)facebook\.com$/.test(new URL(url).hostname)}catch{return false}};
function scoreHit(hit,source){const title=clean(hit.title),snippet=clean(hit.snippet),url=hit.link||'';let u;try{u=new URL(url);if(!['https:','http:'].includes(u.protocol))return null}catch{return null}if(HOST_BLOCK.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return null;if(source==='facebook'&&!fb(url))return null;if(source==='web'&&fb(url))return null;const t=norm(title+' '+snippet);if(BAD.some(p=>p.test(t)))return null;const intents=INTENT.filter(p=>p.test(t)).length;if(!intents)return null;const self=/\b(em|mình|tôi|cháu)\b/.test(t);const points=Math.min(99,55+intents*12+(self?12:0)+(fb(url)?6:0));return {title,snippet,url,source:fb(url)?'Facebook công khai':'Web công khai',score:points};}
async function serper(key,q){const r=await fetch('https://google.serper.dev/search',{method:'POST',headers:{'X-API-KEY':key,'Content-Type':'application/json'},body:JSON.stringify({q,gl:'vn',hl:'vi',num:10})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.message||j.error||'Serper HTTP '+r.status);return j.organic||[];}

// Verify Firebase ID token signature, claims and approval on each scan request.
const DEFAULT_FIREBASE_PROJECT='joblead-vn';
const jwksUrl='https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const decode64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
async function verifiedUser(request, project){
 const bearer=request.headers.get('Authorization')||'';
 if(!bearer.startsWith('Bearer '))throw Error('Chưa đăng nhập');
 const token=bearer.slice(7);const parts=token.split('.');if(parts.length!==3)throw Error('Token không hợp lệ');
 const header=JSON.parse(new TextDecoder().decode(decode64(parts[0])));
 const payload=JSON.parse(new TextDecoder().decode(decode64(parts[1])));
 const now=Math.floor(Date.now()/1000);
 if(header.alg!=='RS256'||!header.kid||payload.aud!==project||payload.iss!=='https://securetoken.google.com/'+project||!payload.sub||payload.exp<=now||payload.iat>now||payload.auth_time>now)throw Error('Phiên đăng nhập không hợp lệ');
 const res=await fetch(jwksUrl);if(!res.ok)throw Error('Không kiểm tra được chữ ký');
 const jwks=await res.json();const jwk=jwks.keys.find(k=>k.kid===header.kid);if(!jwk)throw Error('Không xác minh được khóa');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode64(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));if(!ok)throw Error('Chữ ký không hợp lệ');
 if(payload.email?.toLowerCase()==='hieumai43@gmail.com' && payload.email_verified===true)return payload;
 const docUrl=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/joblead_users/${encodeURIComponent(payload.sub)}`;
 const docRes=await fetch(docUrl,{headers:{Authorization:'Bearer '+token}});
 if(!docRes.ok)throw Error('Không đọc được quyền truy cập');
 const doc=await docRes.json();if(doc.fields?.status?.stringValue!=='approved')throw Error('Tài khoản chưa được quản trị viên duyệt');
 return payload;
}

export default {async fetch(req,env){if(req.method==='OPTIONS')return new Response(null,{headers:HEAD});const u=new URL(req.url);if(u.pathname==='/'||u.pathname==='/health')return json({ok:true,service:'JobLead VN',version:VERSION,keyConfigured:!!env.SERPER_API_KEY,authProject:env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT,authRequired:true});if(u.pathname!=='/scan')return json({ok:false,error:'Unknown route',version:VERSION},404);if(!env.SERPER_API_KEY)return json({ok:false,error:'Chưa cấu hình secret SERPER_API_KEY',version:VERSION},500);try{await verifiedUser(req, env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT)}catch(e){return json({ok:false,error:String(e.message||e),version:VERSION},403)}
const category=QUERIES[u.searchParams.get('category')]?u.searchParams.get('category'):'industrial';const region=clean(u.searchParams.get('region')).replace(/["'()]/g,'').slice(0,45);const keyword=clean(u.searchParams.get('keyword')).replace(/["'()]/g,'').slice(0,60);const source=['all','facebook','web'].includes(u.searchParams.get('source'))?u.searchParams.get('source'):'facebook';const prefix=source==='facebook'?'site:facebook.com ':source==='web'?'-site:facebook.com ':'';const qs=QUERIES[category].map(q=>`${prefix}${q}${region?' '+region:''}${keyword?' '+keyword:''} -"tuyển dụng" -"cần tuyển" -"khuôn đúc" -"khuôn ép"`);const seen=new Set(),articles=[],warnings=[];let rejected=0,queriesUsed=0;
for(const q of qs){try{queriesUsed++;const hits=await serper(env.SERPER_API_KEY,q);for(const hit of hits){const x=scoreHit(hit,source);if(!x){rejected++;continue}if(seen.has(x.url))continue;seen.add(x.url);articles.push({...x,category,region});}}catch(e){warnings.push(String(e.message||e).slice(0,180));}}
articles.sort((a,b)=>b.score-a.score);if(warnings.length===qs.length)return json({ok:false,version:VERSION,error:warnings[0],warnings},502);return json({ok:true,version:VERSION,articles:articles.slice(0,40),queriesUsed,rejected,warnings,notice:'Chỉ kết quả công khai; không xác minh người đăng; không trích xuất số điện thoại.'});}};
