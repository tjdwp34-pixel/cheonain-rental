import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const ADMIN_CODE = "CHEONAIN2026";

// 관리자 전용 렌탈 단가표입니다. 고객 화면에는 노출되지 않습니다.
// 가격은 부가세 제외 공급가 기준으로 입력합니다.
const RENTAL_PRICES = {
  // 캐노피
  "tent-33-white": 40000,
  "tent-33-blue": 40000,
  "tent-36-white": 40000,
  "tent-36-blue": 40000,

  // 듀라테이블 3종
  "duratable-1200": 10000,
  "duratable-1500": 10000,
  "duratable-1800": 10000,

  // 막의자
  "folding-chair-blue": 500,
  "folding-chair-red": 500,

  // 철제 A보드
  "fence-a-board": 20000,

  // 플라스틱 의자
  "plastic-chair-gray": 1000,
  "plastic-chair-white": 1000,

  // 냉방
  "portable-aircon": 150000,
  "large-fan": 40000,

  // 쓰레기통 전부
  "trash-bin-75l": 5000,
  "trash-bin-30l": 5000,
  "trash-bin-10l": 5000,
  "recycle-bin-steel": 5000,

  // 무대
  "stage-basic": 40000,
  "stage-folding": 40000,

  // 아이스박스
  "icebox-130l": 20000,

  // 휀스 / 안전 비품
  "fence-mobile": 20000,
  "traffic-cone": 3000,
  "fire-extinguisher": 8000,
  "signal-light": 5000,
  "safety-vest": 3000,
  "safety-helmet": 3000,

  // 추가 비품
  "cone-connector": 2000,
  "tent-wall-33": 3000,
  "tent-wall-55": 3000,
  "power-cable": 8000,
  "lead-wire": 8000,
  "multi-tap": 3000,

  // 홍보 / 조명 추가
  "acrylic-box": 10000,
  "string-light": 100000,
  "banner-stand": 10000,

  // 모래주머니
  "sandbag-15kg": 2000
};

const money = (value) => `${Number(value || 0).toLocaleString("ko-KR")}원`;

const getEstimate = (items = [], priceMap = RENTAL_PRICES) => {
  const rows = items.map((item) => {
    const unitPrice = Number(priceMap[item.itemId] ?? item.unitPrice ?? priceMap[item.name] ?? 0);
    const quantity = Number(item.quantity) || 0;
    const supply = unitPrice * quantity;
    return { ...item, unitPrice, quantity, supply };
  });
  const supplyTotal = rows.reduce((sum, item) => sum + item.supply, 0);
  const vat = Math.round(supplyTotal * 0.1);
  const grandTotal = supplyTotal + vat;
  return { rows, supplyTotal, vat, grandTotal };
};


const firebaseConfig = {
  apiKey: "AIzaSyChRdZtXApVKGIm0oKwwGSQZpX0B4vZpCg",
  authDomain: "cheonain-rental.firebaseapp.com",
  projectId: "cheonain-rental",
  storageBucket: "cheonain-rental.firebasestorage.app",
  messagingSenderId: "769329125127",
  appId: "1:769329125127:web:7361670244919de3d597a2"
};

let storage = null;
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  storage = getStorage(app, "gs://cheonain-rental.firebasestorage.app");
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase 초기화 실패 (미리보기에서는 정상):", e);
}

const products = [
  { id: "stage", name: "무대 설비", desc: "무대 및 트러스", items: [
    ["stage-basic", "무대", "간이무대", "간이무대"],
    ["stage-folding", "무대", "접이식 무대", "접이식 무대"],
    ["stage-truss", "트러스", "알류미늄 트러스", "[ 제품 사양 ]\n\n사이즈 : 4 m x 3 m"],
  ]},
  { id: "tent", name: "텐트 렌탈", desc: "캐노피/몽골텐트", items: [
    ["tent-33-white", "텐트", "캐노피 텐트 3m x 3m (화이트)", "총 높이 : 1,500~1,900 mm\n좌우 폭 : 3,000 mm\n앞뒤 폭 : 3,000 mm"],
    ["tent-33-blue", "텐트", "캐노피 텐트 3m x 3m (블루)", "총 높이 : 1,500~1,900 mm\n좌우 폭 : 3,000 mm\n앞뒤 폭 : 3,000 mm"],
    ["tent-36-white", "텐트", "캐노피 텐트 3m x 6m (화이트)", "총 높이 : 1,500~1,900 mm\n좌우 폭 : 6,000 mm\n앞뒤 폭 : 3,000 mm"],
    ["tent-36-blue", "텐트", "캐노피 텐트 3m x 6m (블루)", "총 높이 : 1,500~1,900 mm\n좌우 폭 : 6,000 mm\n앞뒤 폭 : 3,000 mm"],
    ["mongol-33", "텐트", "몽골텐트 3m x 3m", "[ 제품 사양 ]\n\n사이즈 : 3 m x 3 m"],
    ["mongol-55", "텐트", "몽골텐트 5m x 5m", "[ 제품 사양 ]\n\n사이즈 : 5 m x 5 m"],
    ["tent-wall-33", "부속", "몽골/캐노피 텐트 옆면 (3x3, 3x6)", "색상 : 화이트 / 블랙 / 화이트+블루\n총 높이 : 2,500 mm\n좌우 폭 : 2,500 mm"],
    ["tent-wall-55", "부속", "몽골 텐트 옆면 (5x5)", "색상 : 화이트 / 블랙 / 화이트+블루\n총 높이 : 2,500 mm\n좌우 폭 : 5,000 mm"],
  ]},
  { id: "table", name: "테이블/의자", desc: "기본 집기", items: [
    ["duratable-1200", "테이블", "듀라 테이블 (1200)", "[ 제품 사양 ]\n\n색상 : 화이트\n총 높이 : 740 mm\n좌우 폭 : 1,220 mm\n앞뒤 폭 : 610 mm"],
    ["duratable-1500", "테이블", "듀라 테이블 (1500)", "[ 제품 사양 ]\n\n색상 : 화이트\n총 높이 : 740 mm\n좌우 폭 : 1,530 mm\n앞뒤 폭 : 610 mm"],
    ["duratable-1800", "테이블", "듀라 테이블 (1800)", "[ 제품 사양 ]\n\n색상 : 화이트\n총 높이 : 740 mm\n좌우 폭 : 1,830 mm\n앞뒤 폭 : 610 mm"],
    ["folding-chair-blue", "의자", "막의자 (블루)", "[ 제품 사양 ]\n\n색상 : 블루\n총 높이 : 430 mm\n좌우 폭 : 370 mm\n앞뒤 폭 : 370 mm"],
    ["folding-chair-red", "의자", "막의자 (레드)", "[ 제품 사양 ]\n\n색상 : 레드\n총 높이 : 430 mm\n좌우 폭 : 370 mm\n앞뒤 폭 : 370 mm"],
    ["plastic-chair-gray", "의자", "플라스틱 의자 (그레이)", "[ 제품 사양 ]\n\n색상 : 그레이\n총 높이 : 815 mm\n좌우 폭 : 430 mm\n앞뒤 폭 : 580 mm"],
    ["plastic-chair-white", "의자", "플라스틱 의자 (화이트)", "[ 제품 사양 ]\n\n색상 : 화이트\n총 높이 : 815 mm\n좌우 폭 : 430 mm\n앞뒤 폭 : 580 mm"],
  ]},
  { id: "stall", name: "가판대", desc: "플리마켓 및 판매 부스", items: [
    ["stall-folding", "가판대", "접이식 가판대 (플리마켓 부스)", "접이식 구조\n간편 설치 및 이동"],
  ]},
  { id: "supplies", name: "행사 비품", desc: "운영 비품", items: [
    ["string-light", "조명", "알전구 (스트링 전구)", "스트링 전구"],
    ["stage-led-light", "조명", "무대 LED 전구", "무대 LED 전구"],
    ["banner-stand", "안내/홍보", "배너 거치대", "배너 거치대"],
    ["acrylic-box", "안내/홍보", "아크릴 응모함", "아크릴 응모함"],
    ["fire-extinguisher", "안전", "소화기", "색상 : 레드\n용량 : 3.3Kg"],
    ["traffic-cone", "안전", "라바콘", "라바콘"],
    ["signal-light", "안전", "경광봉", "경광봉"],
    ["safety-vest", "안전", "안전 조끼", "안전 조끼"],
    ["safety-helmet", "안전", "안전모", "안전모"],
    ["cone-connector", "안전", "라바콘 연결 고리", "라바콘 연결 고리"],
    ["power-cable", "전기", "전기 릴선", "전기 릴선"],
    ["multi-tap", "전기", "멀티탭", "멀티탭"],
    ["lead-wire", "전기", "리드선", "리드선"],
    ["distribution-box", "전기", "분전함", "분전함"],
    ["trash-bin-75l", "청결", "대형 휴지통 75L", "75L 대형 휴지통"],
    ["trash-bin-30l", "청결", "플라스틱 쓰레기통 30L", "용량 : 30 L"],
    ["trash-bin-10l", "청결", "플라스틱 쓰레기통 10L", "용량 : 10 L"],
    ["recycle-bin-steel", "청결", "철제 재활용 분리수거함", "철제 재활용 분리수거함"],
    ["icebox-130l", "보관", "스트로폼 아이스박스 130L", "총 높이 : 560 mm\n앞뒤 폭 : 570 mm\n좌우 폭 : 860 mm\n용량 : 130 L / 5.5Kg"],
    ["artificial-grass", "바닥", "인조 잔디", "사이즈 : 2 m x 10 m"],
    ["artificial-grass-round", "바닥", "원형 인조 잔디", "폭 : 2 m"],
    ["large-fan", "냉방", "대형 선풍기", "대형 선풍기"],
    ["portable-aircon", "냉방", "이동식 에어컨", "이동식 에어컨"],
    ["fan", "냉방", "선풍기", "선풍기"],
    ["sandbag-15kg", "안전", "모래주머니 15kg", "모래주머니 15kg"],
  ]},
  { id: "fence", name: "휀스", desc: "통제 및 안내", items: [
    ["fence-mobile", "통제", "이동식 휀스", "사이즈 : 2000 x 1200 mm"],
    ["fence-a-board", "안내", "철제 A보드판", "총 높이 : 1,800 mm\n좌우 폭 : 900 mm"],
    ["a-board-folding", "안내", "A형 접이식 간판 (A보드)", "A형 접이식 간판"],
  ]},
  { id: "media", name: "음향 / 촬영 장비", desc: "스피커 및 촬영 장비", items: [
    ["speaker", "음향", "스피커", "스피커"],
    ["camera", "촬영", "촬영 장비", "촬영 장비"],
  ]},
].map((c) => ({ ...c, items: c.items.map(([id, subCategory, name, detail]) => ({ id, subCategory, name, detail, categoryId: c.id, categoryName: c.name })) }));

const allItems = products.flatMap((p) => p.items);
const emptyForm = { name: "", company: "", phone: "", emailLocal: "", emailDomain: "naver.com", emailCustom: "", password: "", location: "", eventDate: "", notes: "" };

const loadStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const css = `
*{box-sizing:border-box}body{margin:0;background:#f3f6f9;color:#172033;font-family:Arial,sans-serif}.page{min-height:100vh;padding:32px 20px}.wrap{max-width:1240px;margin:auto}.hero{background:linear-gradient(135deg,#1f2937,#334155);border-radius:28px;padding:44px 38px;color:white;box-shadow:0 18px 50px rgba(15,23,42,.18)}.brand{font-size:44px;margin:0;font-weight:900}.subtitle{color:#cbd5e1;line-height:1.8}.btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}button,.btn{cursor:pointer;border-radius:12px;border:1px solid #cbd5e1;background:white;padding:12px 16px;font-weight:800}.primary{background:#2563eb;color:white;border:0}.danger{border-color:#ef4444;color:#b91c1c}.back{margin-bottom:20px}.admin-fab{position:fixed;left:18px;bottom:18px;z-index:20;box-shadow:0 10px 25px rgba(0,0,0,.15)}.head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-top:26px}.search{position:relative;max-width:320px;width:100%}.search input{padding-left:34px}.icon{position:absolute;left:12px;top:50%;transform:translateY(-50%)}.input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:13px 14px;font-size:14px;outline:none;background:white}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-top:24px}.card,.panel,.item,.qitem{background:white;border:1px solid #dbe3ec;border-radius:20px;box-shadow:0 8px 20px rgba(15,23,42,.06);overflow:hidden}.card{cursor:pointer}.card:hover,.item:hover{transform:translateY(-4px);transition:.18s}.photo{height:120px;background:#e5e7eb;position:relative;overflow:hidden}.photo img{width:100%;height:100%;object-fit:contain;background:#fff}.empty{height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-weight:800;font-size:12px}.photo label{position:absolute;right:8px;bottom:8px;background:rgba(15,23,42,.82);color:white;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900}.count{position:absolute;left:8px;bottom:8px;background:#2563eb;color:white;border-radius:999px;padding:5px 8px;font-size:11px}.remove-photo{position:absolute;left:8px;top:8px;background:rgba(239,68,68,.92);color:white;border:0;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900}.body{padding:18px}.title{margin:0;font-size:22px;font-weight:900}.panel{padding:28px}.detail-title{font-size:34px;margin:0 0 14px;font-weight:900}.text{white-space:pre-line;line-height:1.8;color:#475569}.group{margin-top:22px}.item-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.qgrid{display:grid;gap:14px;padding:16px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}.item{cursor:pointer}.item .photo{height:110px}.formgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.field{display:flex;flex-direction:column;gap:8px}.field label{font-size:13px;font-weight:900}.email{grid-column:span 2}.emailrow{display:flex;gap:8px;align-items:center}.emailrow input{flex:1}.emailrow select,.emailrow .domain{width:160px}.cat{border:1px solid #dbe3ec;border-radius:20px;background:white;margin-top:20px;overflow:hidden}.cathead{padding:18px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;cursor:pointer}.qitem{padding:12px;min-width:0;display:flex;flex-direction:column;justify-content:space-between;height:100%}.qitem>p{min-height:44px;display:flex;align-items:center;margin:8px 0}.qitem .field{margin-top:auto}.qitem .price-edit{margin-top:auto}.qitem .price-edit .input{height:38px}.qitem .qty{margin-top:auto}.qitem .photo{height:80px;border-radius:10px}.qty{display:grid;grid-template-columns:36px minmax(54px,1fr) 36px;gap:6px;align-items:center}.qty input{min-width:0;text-align:center;padding:9px 4px;border:1px solid #cbd5e1;border-radius:10px}.qty button{padding:0;height:38px;display:flex;align-items:center;justify-content:center}.box{margin-top:18px;padding:18px;border-radius:16px;background:#f8fafc;border:1px solid #dbe3ec;white-space:pre-line;line-height:1.8;color:#475569}.overlay{position:fixed;inset:0;background:rgba(15,23,42,.38);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}.modal{background:white;border-radius:20px;padding:24px;max-width:430px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.2)}.admin{display:grid;grid-template-columns:320px 1fr;gap:18px}.admin-card{padding:16px;border:1px solid #dbe3ec;border-radius:16px;background:white;cursor:pointer}.active{background:#eff6ff;border-color:#93c5fd}.footer{margin-top:60px;text-align:center;font-size:12px;color:#94a3b8}.cart-box{background:#eff6ff!important;border-color:#93c5fd!important}.cart-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.cart-list{margin-top:12px;display:flex;flex-direction:column;gap:8px}.cart-row{display:flex;justify-content:space-between;align-items:center;background:#fff;padding:8px 12px;border-radius:10px;font-size:13px}.cart-remove{font-size:12px;color:#ef4444;border:1px solid #fecaca;background:#fff}.admin-badge{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;font-size:12px}.compact-form{max-width:720px}.compact-form .input,.compact-form select,.compact-form textarea{max-width:520px}.compact-row{display:grid;grid-template-columns:repeat(2,minmax(180px,260px));gap:12px}.compact-row .input,.compact-row select{width:100%}.hint-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.hint-chip{font-size:12px;background:#e2e8f0;color:#334155;border-radius:999px;padding:5px 9px}.custom-tag{display:inline-block;margin-left:6px;font-size:11px;background:#dcfce7;color:#166534;border-radius:999px;padding:3px 7px}.price-now{font-size:13px;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:8px 10px}.price-edit .input{padding:10px 12px}.compact-form{max-width:720px}.compact-form .input,.compact-form select,.compact-form textarea{max-width:520px}.compact-row{display:grid;grid-template-columns:repeat(2,minmax(180px,260px));gap:12px}.compact-row .input,.compact-row select{width:100%}.hint-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.hint-chip{font-size:12px;background:#e2e8f0;color:#334155;border-radius:999px;padding:5px 9px}.prev-form{max-width:460px}.prev-form .input{max-width:360px}.price-now{font-size:13px;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:8px 10px}.price-edit .input{padding:10px 12px}.custom-tag{display:inline-block;margin-left:6px;font-size:11px;background:#dcfce7;color:#166534;border-radius:999px;padding:3px 7px}@media(max-width:900px){.grid,.item-grid,.qgrid{grid-template-columns:repeat(3,1fr)}.admin{grid-template-columns:1fr}.email{grid-column:span 1}}@media(max-width:640px){.grid,.item-grid{grid-template-columns:repeat(2,1fr)}.qgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:10px}.brand{font-size:30px}.hero,.panel{padding:22px}.head{flex-direction:column;align-items:stretch}.title{font-size:18px}.body{padding:14px}.photo{height:96px}.item .photo{height:92px}.qitem{padding:9px;min-width:130px;height:280px}.qitem .photo{height:64px}.qty{grid-template-columns:30px minmax(42px,1fr) 30px;gap:4px}.qty button{height:34px;font-size:13px}.qty input{font-size:13px;padding:7px 2px}}`;

function Photo({ item, images, onUpload, onRemove, large=false }) {
  const photos = images[item.id] || [];
  const src = photos[0];

  return <div className="photo" style={large ? { height: 320, borderRadius: 18, marginBottom: 20 } : null}>
    {src ? <img src={src} alt={item.name} style={large ? { objectFit: "contain", background: "#fff" } : null} /> : <div className="empty">{onUpload ? "사진 첨부" : "이미지 준비중"}</div>}
    {photos.length > 1 && <div className="count">+{photos.length - 1}</div>}
    {onUpload && onRemove && photos.length > 0 && <button className="remove-photo" type="button" onClick={(e)=>{e.stopPropagation();onRemove(item.id)}}>삭제</button>}
    {onUpload && <label onClick={(e)=>e.stopPropagation()}>사진 추가<input hidden type="file" accept="image/*" multiple onChange={(e)=>onUpload(item.id, e.target.files)} /></label>}
  </div>;
}

function EmailField({ form, setForm }) {
  return <div className="field email"><label>이메일</label><div className="emailrow"><input className="input" value={form.emailLocal} onChange={(e)=>setForm({...form,emailLocal:e.target.value})} placeholder="이메일"/><span>@</span>{form.emailDomain === "custom" ? <input className="input domain" value={form.emailCustom} onChange={(e)=>setForm({...form,emailCustom:e.target.value})} placeholder="직접 입력"/> : <select value={form.emailDomain} onChange={(e)=>setForm({...form,emailDomain:e.target.value})}><option>naver.com</option><option>gmail.com</option><option>hanmail.net</option><option>nate.com</option><option>hotmail.com</option><option value="custom">직접 입력</option></select>}</div></div>;
}

function Modal({msg,close}) {
  return <div className="overlay"><div className="modal"><h2>{msg.type==="success"?"접수 완료":"입력 확인"}</h2><p>{msg.text}</p><div className="btns"><button className="primary" onClick={close}>확인</button></div></div></div>;
}

export default function App(){
  const [page,setPage]=useState("home"),[selected,setSelected]=useState(null),[sub,setSub]=useState(null),[search,setSearch]=useState(""),[form,setForm]=useState(emptyForm),[qty,setQty]=useState(Object.fromEntries(allItems.map(i=>[i.id,""]))),[open,setOpen]=useState(Object.fromEntries(products.map((p,i)=>[p.id,i===0]))),[inquiries,setInquiries]=useState(()=>loadStored("cheonainInquiries",[])),[selId,setSelId]=useState(null),[adminOpen,setAdminOpen]=useState(false),[adminCode,setAdminCode]=useState(""),[adminErr,setAdminErr]=useState(""),[msg,setMsg]=useState(null),[prevPhone,setPrevPhone]=useState(""),[prevPass,setPrevPass]=useState(""),[prevResult,setPrevResult]=useState(null),[prevErr,setPrevErr]=useState(""),[images,setImages]=useState(()=>loadStored("cheonainImages",{})),[catImages,setCatImages]=useState(()=>loadStored("cheonainCatImages",{})),[adminSection,setAdminSection]=useState("menu"),[priceMap,setPriceMap]=useState(()=>loadStored("cheonainPriceMap",RENTAL_PRICES));

  useEffect(()=>localStorage.setItem("cheonainImages",JSON.stringify(images)),[images]);
  useEffect(()=>localStorage.setItem("cheonainCatImages",JSON.stringify(catImages)),[catImages]);
  useEffect(()=>localStorage.setItem("cheonainInquiries",JSON.stringify(inquiries)),[inquiries]);
  useEffect(()=>localStorage.setItem("cheonainPriceMap",JSON.stringify(priceMap)),[priceMap]);

  useEffect(() => {
    if (!db) return;
    const loadFirebaseImages = async () => {
      const itemImageMap = {};
      const categoryImageMap = {};

      await Promise.all(allItems.map(async (item) => {
        const snap = await getDoc(doc(db, "images", item.id));
        if (snap.exists()) {
          const urls = snap.data().urls || [];
          if (urls.length) itemImageMap[item.id] = urls;
        }
      }));

      await Promise.all(products.map(async (product) => {
        const snap = await getDoc(doc(db, "categoryImages", product.id));
        if (snap.exists()) {
          const urls = snap.data().urls || [];
          if (urls.length) categoryImageMap[product.id] = urls;
        }
      }));

      setImages(itemImageMap);
      setCatImages(categoryImageMap);
    };

    loadFirebaseImages().catch((error) => console.warn("Firebase 이미지 불러오기 실패:", error));
  }, []);

  const selectedItems=useMemo(()=>allItems.filter(i=>Number(qty[i.id])>0),[qty]);

  const cartSummary = useMemo(()=>{
    const totalCount = selectedItems.reduce((sum,i)=>sum + Number(qty[i.id]||0),0);
    return { totalCount };
  },[selectedItems, qty]);
  const currentInquiry=useMemo(()=>inquiries.find(i=>i.id===selId)||inquiries[0]||null,[inquiries,selId]);
  const filtered=useMemo(()=>{if(!search.trim())return products;const k=search.toLowerCase();return products.map(p=>({...p,items:p.items.filter(i=>i.name.toLowerCase().includes(k)||i.subCategory.toLowerCase().includes(k))})).filter(p=>p.name.toLowerCase().includes(k)||p.items.length)},[search]);
  const email=()=>form.emailLocal?`${form.emailLocal}@${form.emailDomain==="custom"?form.emailCustom:form.emailDomain}`:"";

  const upload = async (id, files) => {
    if (!storage || !db) { alert("Firebase 연결이 없어 미리보기에서는 업로드가 제한됩니다."); return; }
    try {
      const arr = Array.from(files || []);
      if (!arr.length) return;

      const uploadedUrls = [];
      for (const file of arr) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `images/${id}/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const newImages = { ...images, [id]: [...(images[id] || []), ...uploadedUrls] };
      setImages(newImages);
      localStorage.setItem("cheonainImages", JSON.stringify(newImages));
      await setDoc(doc(db, "images", id), { urls: newImages[id] });
      alert("사진이 저장되었습니다.");
    } catch (error) {
      console.error("품목 사진 업로드 실패:", error);
      alert(`사진 업로드에 실패했습니다.\n\n오류: ${error?.code || error?.message || "알 수 없는 오류"}\n\nFirebase Storage 규칙과 Storage 생성 여부를 확인해 주세요.`);
    }
  };

  const uploadCat = async (id, files) => {
    if (!storage || !db) { alert("Firebase 연결이 없어 미리보기에서는 업로드가 제한됩니다."); return; }
    try {
      const arr = Array.from(files || []);
      if (!arr.length) return;

      const uploadedUrls = [];
      for (const file of arr) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `categoryImages/${id}/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const newImages = { ...catImages, [id]: [...(catImages[id] || []), ...uploadedUrls] };
      setCatImages(newImages);
      localStorage.setItem("cheonainCatImages", JSON.stringify(newImages));
      await setDoc(doc(db, "categoryImages", id), { urls: newImages[id] });
      alert("대표 사진이 저장되었습니다.");
    } catch (error) {
      console.error("카테고리 사진 업로드 실패:", error);
      alert(`대표 사진 업로드에 실패했습니다.\n\n오류: ${error?.code || error?.message || "알 수 없는 오류"}\n\nFirebase Storage 규칙과 Storage 생성 여부를 확인해 주세요.`);
    }
  };

  const deleteFirebaseFiles = async (urls = []) => {
    await Promise.all(
      urls.map(async (url) => {
        try {
          await deleteObject(ref(storage, url));
        } catch (error) {
          console.warn("Storage 파일 삭제 실패 또는 이미 삭제됨:", error);
        }
      })
    );
  };

  const removeImg = async (id) => {
    if (!storage || !db) return;
    const urls = images[id] || [];
    try {
      await deleteFirebaseFiles(urls);
      const n = { ...images };
      delete n[id];
      setImages(n);
      localStorage.setItem("cheonainImages", JSON.stringify(n));
      await setDoc(doc(db, "images", id), { urls: [] });
    } catch (error) {
      console.error("품목 사진 삭제 실패:", error);
      alert("사진 삭제에 실패했습니다. Firebase Storage / Firestore 규칙을 확인해 주세요.");
    }
  };

  const removeCatImg = async (id) => {
    if (!storage || !db) return;
    const urls = catImages[id] || [];
    try {
      await deleteFirebaseFiles(urls);
      const n = { ...catImages };
      delete n[id];
      setCatImages(n);
      localStorage.setItem("cheonainCatImages", JSON.stringify(n));
      await setDoc(doc(db, "categoryImages", id), { urls: [] });
    } catch (error) {
      console.error("카테고리 사진 삭제 실패:", error);
      alert("사진 삭제에 실패했습니다. Firebase Storage / Firestore 규칙을 확인해 주세요.");
    }
  };

  const changeQty=(id,n)=>setQty(p=>({...p,[id]:String(Math.max(0,(Number(p[id])||0)+n))}));
  const setQtyVal=(id,v)=>setQty(p=>({...p,[id]:String(Math.max(0,Number(v)||0))}));
  const back=()=>{setPage("home");setSelected(null);setSub(null)};

  const send=()=>{for(const f of [["성함",form.name],["업체명",form.company],["연락처",form.phone],["이메일",email()],["비밀번호",form.password],["행사 장소",form.location],["행사일",form.eventDate]]) if(!String(f[1]||"").trim()) return setMsg({type:"warn",text:`${f[0]}을(를) 입력해 주세요.`}); if(!selectedItems.length) return setMsg({type:"warn",text:"렌탈 품목을 1개 이상 선택해 주세요."}); const ni={id:Date.now(),createdAt:new Date().toLocaleString("ko-KR"),name:form.name,company:form.company,phone:form.phone,email:email(),password:form.password,location:form.location,eventDate:form.eventDate,items:selectedItems.map(i=>({itemId:i.id,categoryName:i.categoryName,name:i.name,quantity:qty[i.id],unitPrice:Number(priceMap[i.id] ?? i.price ?? priceMap[i.name] ?? 0)}))}; setInquiries(p=>[ni,...p]);setSelId(ni.id);setForm(emptyForm);setQty(Object.fromEntries(allItems.map(i=>[i.id,""])));setMsg({type:"success",text:"성공적으로 견적 문의가 접수되었습니다."});};
  const groups=(items)=>Object.entries(items.reduce((a,i)=>{(a[i.subCategory]??=[]).push(i);return a;},{}));
  const login=()=> adminCode.trim()===ADMIN_CODE ? (setAdminOpen(false),setAdminErr(""),setAdminSection("menu"),setPage("admin")) : setAdminErr("관리자 코드가 올바르지 않습니다.");
  const checkPrev=()=>{const n=prevPhone.replace(/[^0-9]/g,"");const m=inquiries.find(i=>i.password===prevPass&&String(i.phone).replace(/[^0-9]/g,"")===n);m?(setPrevResult(m),setPrevErr("")):(setPrevResult(null),setPrevErr("일치하는 견적 문의를 찾을 수 없습니다."));};

  const downloadInquiryExcel = (inquiry) => {
    if (!inquiry) return;
    const estimate = getEstimate(inquiry.items, priceMap);
    const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const rows = estimate.rows.map((i)=>`<tr><td>${esc(i.name)}</td><td>${i.quantity}</td><td>${i.unitPrice}</td><td>${i.supply}</td><td>${Math.round(i.supply * 0.1)}</td></tr>`).join("\n");
    const html = `<html><head><meta charset="UTF-8"></head><body><h2>천아인 렌탈 견적서</h2>
    <table border="1"><tr><th>성함</th><td>${esc(inquiry.name)}</td></tr><tr><th>업체명</th><td>${esc(inquiry.company)}</td></tr><tr><th>연락처</th><td>${esc(inquiry.phone)}</td></tr><tr><th>이메일</th><td>${esc(inquiry.email)}</td></tr><tr><th>행사 장소</th><td>${esc(inquiry.location)}</td></tr><tr><th>행사일</th><td>${esc(inquiry.eventDate)}</td></tr><tr><th>접수 시간</th><td>${esc(inquiry.createdAt)}</td></tr></table><br/>
    <table border="1"><thead><tr><th>제품명</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세 10%</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="3">총 공급가액</th><td>${estimate.supplyTotal}</td><td></td></tr><tr><th colspan="3">총 부가세</th><td></td><td>${estimate.vat}</td></tr><tr><th colspan="4">최종 금액</th><td>${estimate.grandTotal}</td></tr></tfoot></table></body></html>`;
    const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `견적_${inquiry.name || "고객"}_${inquiry.eventDate || "날짜미정"}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if(page==="quote")return <><style>{css}</style><div className="page"><div className="wrap"><button className="back" onClick={back}>← 메인으로 돌아가기</button><div className="panel">{/* 장바구니 영역 */}
{selectedItems.length > 0 && (
  <div className="box cart-box">
    <div className="cart-head">
      <b>선택한 품목 ({cartSummary.totalCount}개)</b>
      <button className="danger" onClick={()=>setQty(Object.fromEntries(allItems.map(i=>[i.id,""])))}>전체 초기화</button>
    </div>
    <div className="cart-list">
      {selectedItems.map(i=>(
        <div key={i.id} className="cart-row">
          <span>{i.name} {qty[i.id]}개</span>
          <button className="cart-remove" onClick={()=>setQty(q=>({...q,[i.id]:""}))}>삭제</button>
        </div>
      ))}
    </div>
  </div>
)}
<div className="head"><div><h1 className="detail-title">견적 문의</h1><p className="text">카테고리를 누르면 아래로 품목이 열립니다.</p></div><button className="primary" onClick={send}>보내기</button></div><div className="btns"><button onClick={()=>{setPage("prev");setPrevResult(null);setPrevErr("")}}>이전 견적 문의 확인하기</button></div><div className="formgrid"><div className="field"><label>성함</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="field"><label>업체명</label><input className="input" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></div><div className="field"><label>연락처</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div><EmailField form={form} setForm={setForm}/><div className="field"><label>비밀번호</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div><div className="field"><label>행사 장소</label><input className="input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div><div className="field"><label>행사일</label><input className="input" type="date" value={form.eventDate} onChange={e=>setForm({...form,eventDate:e.target.value})}/></div></div><div className="field" style={{marginTop:16}}><label>추가 요청사항</label><textarea className="input" rows={4} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>{products.map(p=><div className="cat" key={p.id}><div className="cathead" onClick={()=>setOpen(o=>({...o,[p.id]:!o[p.id]}))}><div><h2>{p.name}</h2><p>{p.desc}</p></div><b>{open[p.id]?"−":"+"}</b></div>{open[p.id]&&groups(p.items).map(([g,items])=><div key={g}><h3 style={{padding:"10px 18px",margin:0}}>{g}</h3><div className="qgrid">{items.map(i=><div className="qitem" key={i.id}><Photo item={i} images={images}/><p style={{minHeight:40,display:'flex',alignItems:'center'}}><b>{i.name}</b></p><div className="qty"><button onClick={()=>changeQty(i.id,-1)}>−</button><input value={qty[i.id]} onChange={e=>setQtyVal(i.id,e.target.value.replace(/[^0-9]/g,""))}/><button onClick={()=>changeQty(i.id,1)}>+</button></div></div>)}</div></div>)}</div>)}<div className="btns"><button className="primary" onClick={send}>보내기</button></div></div></div>{msg&&<Modal msg={msg} close={()=>setMsg(null)}/>}</div></>;

  if(page==="prev")return <><style>{css}</style><div className="page"><div className="wrap"><div className="panel"><button className="back" onClick={()=>setPage("quote")}>← 견적 문의로 돌아가기</button><h1 className="detail-title">이전 견적 문의 확인하기</h1><div className="prev-form"><div className="field"><label>연락처</label><input className="input" value={prevPhone} onChange={e=>setPrevPhone(e.target.value)}/></div><div className="field" style={{marginTop:14}}><label>비밀번호</label><input className="input" type="password" value={prevPass} onChange={e=>setPrevPass(e.target.value)}/></div></div><div className="btns"><button className="primary" onClick={checkPrev}>확인</button></div>{prevErr&&<div className="box">{prevErr}</div>}{prevResult&&<div className="box">{`성함 : ${prevResult.name}\n업체명 : ${prevResult.company}\n연락처 : ${prevResult.phone}\n이메일 : ${prevResult.email}\n행사 장소 : ${prevResult.location}\n행사일 : ${prevResult.eventDate}\n\n[렌탈 요청 품목]\n${prevResult.items.map(i=>`- ${i.categoryName} / ${i.name} : ${i.quantity}개`).join("\n")}`}</div>}</div></div></div></>;

  if(page==="admin")return <><style>{css}</style><div className="page"><div className="wrap"><button className="back" onClick={back}>← 메인으로 돌아가기</button><div className="panel"><h1 className="detail-title">관리자 모드</h1>{adminSection==="menu"&&<><p className="text">관리할 메뉴를 선택하세요.</p><div className="grid"><div className="card" onClick={()=>setAdminSection("products")}><div className="body"><h3 className="title">사이트 물품 관리</h3><p className="text">카테고리 대표 사진과 품목 사진을 추가·관리합니다.</p></div></div><div className="card" onClick={()=>setAdminSection("quotes")}><div className="body"><h3 className="title">견적 확인 {inquiries.length > 0 && <span className="custom-tag">새 문의 {inquiries.length}</span>}</h3><p className="text">접수된 견적 문의를 확인하고 삭제합니다.</p></div></div></div></>}{adminSection!=="menu"&&<div className="btns"><button onClick={()=>setAdminSection("menu")}>← 관리자 메뉴로</button></div>}{adminSection==="quotes"&&(!inquiries.length?<div className="box">아직 접수된 문의가 없습니다.</div>:<div className="admin"><div>{inquiries.map((q,idx)=><div key={q.id} className={`admin-card ${currentInquiry?.id===q.id?"active":""}`} onClick={()=>setSelId(q.id)}><h3>{q.name}</h3><p>{`문의 번호 : ${inquiries.length-idx}\n연락처 : ${q.phone}\n행사일 : ${q.eventDate}`}</p><small>{q.createdAt}</small></div>)}</div><div>{currentInquiry&&<div className="admin-card"><h3>{currentInquiry.name}</h3><p className="text">{`업체명 : ${currentInquiry.company}\n연락처 : ${currentInquiry.phone}\n이메일 : ${currentInquiry.email}\n행사 장소 : ${currentInquiry.location}\n행사일 : ${currentInquiry.eventDate}\n접수 시간 : ${currentInquiry.createdAt}`}</p><div className="box">{currentInquiry.items.map(i=>`- ${i.categoryName} / ${i.name} : ${i.quantity}개`).join("\n")}</div>
<div className="box">
{(() => {
const estimate = getEstimate(currentInquiry.items, priceMap);
return `관리자 전용 견적 산출\n\n${estimate.rows.map(i=>`- ${i.name} : ${money(i.unitPrice)} x ${i.quantity}개 = ${money(i.supply)}`).join("\n")}\n\n공급가액 : ${money(estimate.supplyTotal)}\n부가세 10% : ${money(estimate.vat)}\n총 견적 : ${money(estimate.grandTotal)}`;
})()}
</div><button className="danger" onClick={()=>{setInquiries(p=>p.filter(x=>x.id!==currentInquiry.id));setSelId(null)}}>견적 삭제</button></div>}</div></div>)}{adminSection==="products"&&<div style={{marginTop:20}}><h2>사이트 물품 관리</h2><p className="text">이곳에서 추가한 사진은 Firebase 서버에 저장되어 PC와 모바일에서 함께 표시됩니다.</p>
<div className="box compact-form">
<h3>물품 추가</h3>
<div className="compact-row">
  <div className="field"><label>카테고리</label><select className="input" id="newCat">{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
  <div className="field"><label>소분류</label><input className="input" placeholder="소분류 선택/입력" id="newSub" list="subCategoryList" /></div>
</div>
<datalist id="subCategoryList">{[...new Set(products.flatMap(p=>p.items.map(i=>i.subCategory)))].map(s=><option key={s} value={s}/>)}</datalist>
<div className="hint-list">{[...new Set(products.flatMap(p=>p.items.map(i=>i.subCategory)))].slice(0,12).map(s=><span className="hint-chip" key={s}>{s}</span>)}</div>
<div className="compact-row" style={{marginTop:12}}>
  <div className="field"><label>물품 이름</label><input className="input" placeholder="물품 이름" id="newName" /></div>
  <div className="field"><label>단가 / 부가세 제외</label><input className="input" placeholder="예: 10000" id="newPrice" inputMode="numeric" /></div>
</div>
<div className="field" style={{marginTop:12}}><label>상세 설명</label><textarea className="input" placeholder="상세 설명" id="newDetail" rows={4} /></div>
<button className="primary" style={{marginTop:12}} onClick={()=>{
const cat=document.getElementById('newCat').value;
const sub=document.getElementById('newSub').value;
const name=document.getElementById('newName').value;
const detail=document.getElementById('newDetail').value;
const price=Number(String(document.getElementById('newPrice').value||'').replace(/[^0-9]/g,''))||0;
if(!cat||!sub||!name) return alert('카테고리, 소분류, 물품 이름을 입력해 주세요.');
const target=products.find(p=>p.id===cat);
if(!target) return alert('카테고리 없음');
const newId='custom-'+Date.now();
target.items.push({id:newId,subCategory:sub,name,detail,price,categoryId:cat,categoryName:target.name});
setPriceMap(p=>({...p,[newId]:price}));
setMsg({type:'success',text:`물품 추가됨 / 관리자 단가 ${money(price)}`});
}}>추가</button>
</div>{products.map(p=><div className="cat" key={p.id}><div className="cathead"><div><h3>{p.name}</h3><p>{p.desc}</p></div></div><div className="qgrid"><div className="qitem"><Photo item={p} images={catImages} onUpload={uploadCat} onRemove={removeCatImg}/><p><b>{p.name} 대표 사진</b></p></div>{p.items.map(i=><div className="qitem" key={i.id}><Photo item={i} images={images} onUpload={upload} onRemove={removeImg}/><p style={{minHeight:40,display:'flex',alignItems:'center'}}><b>{i.name}</b></p>
<div className="field price-edit" style={{marginTop:8}}>
  <label>관리자 단가</label>
  <strong className="price-now">현재 단가 : {money(priceMap[i.id] ?? i.price ?? 0)}</strong>
  <input className="input" inputMode="numeric" value={priceMap[i.id] ?? i.price ?? 0} onChange={e=>setPriceMap(p=>({...p,[i.id]:Number(String(e.target.value).replace(/[^0-9]/g,''))||0}))}/>
  <small style={{color:'#64748b'}}>부가세 제외 / 수정 즉시 반영</small>
</div></div>)}</div></div>)}</div>}</div></div></div>{msg&&<Modal msg={msg} close={()=>setMsg(null)}/>}</>;

  if(sub&&selected)return <><style>{css}</style><div className="page"><div className="wrap"><button className="back" onClick={back}>← 목록으로</button><button className="back" onClick={()=>setSub(null)}>← {selected.name}</button><div className="panel"><h1 className="detail-title">{sub.name}</h1><Photo item={sub} images={images} large/><p className="text">{sub.detail}</p><h3>추가 사진</h3><div className="grid">{(images[sub.id]||[]).map((src,i)=><div className="photo" key={src+i} style={{ background: "#fff" }}><img src={src} style={{ objectFit: "contain", background: "#fff" }}/></div>)}</div><div className="btns"><button className="primary" onClick={()=>setPage("quote")}>견적 문의하기</button></div></div></div></div></>;

  if(selected)return <><style>{css}</style><div className="page"><div className="wrap"><button className="back" onClick={back}>← 목록으로</button><div className="panel"><h1 className="detail-title">{selected.name}</h1><p className="text">{selected.desc}</p>{groups(selected.items).map(([g,items])=><div className="group" key={g}><h3>{g}</h3><div className="item-grid">{items.map(i=><div className="item" key={i.id} onClick={()=>setSub(i)}><Photo item={i} images={images}/><div className="body"><b>{i.name}</b></div></div>)}</div></div>)}<div className="btns"><button className="primary" onClick={()=>setPage("quote")}>견적 문의하기</button></div></div></div></div></>;

  return <><style>{css}</style><div className="page"><button className="admin-fab" onClick={()=>setAdminOpen(true)}>관리자 모드{inquiries.length > 0 && <span className="admin-badge">{inquiries.length}</span>}</button><div className="wrap"><div className="hero"><h1 className="brand">천아인 렌탈</h1><p className="subtitle">행사에 필요한 모든 장비, 한 번에 빠르게 렌탈하세요.</p><div className="btns"><button className="primary" onClick={()=>setPage("quote")}>견적 문의</button></div></div><div className="head"><h2>렌탈 품목 카테고리</h2><div className="search"><span className="icon">🔍</span><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="제품 검색"/></div></div><div className="grid">{filtered.map(p=><div className="card" key={p.id} onClick={()=>setSelected(p)}><Photo item={p} images={catImages}/><div className="body"><h3 className="title">{p.name}</h3></div></div>)}</div><div className="footer">사업자등록번호 753-77-00504 | 대표자 김동혁</div></div>{adminOpen&&<div className="overlay"><div className="modal"><h2>관리자 모드</h2><p>관리자 코드를 입력하세요.</p><input className="input" value={adminCode} onChange={e=>setAdminCode(e.target.value)} placeholder="관리자 코드"/>{adminErr&&<div className="box">{adminErr}</div>}<div className="btns"><button className="primary" onClick={login}>로그인</button><button onClick={()=>setAdminOpen(false)}>닫기</button></div></div></div>}</div></>;
}
