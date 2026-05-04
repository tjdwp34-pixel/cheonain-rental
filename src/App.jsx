
import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const ADMIN_CODE = "CHEONAIN2026";

const firebaseConfig = {
  apiKey: "AIzaSyChRdZtXApVKGIm0oKwwGSQZpX0B4vZpCg",
  authDomain: "cheonain-rental.firebaseapp.com",
  projectId: "cheonain-rental",
  storageBucket: "cheonain-rental.firebasestorage.app",
  messagingSenderId: "769329125127",
  appId: "1:769329125127:web:7361670244919de3d597a2"
};

let db = null;
let storage = null;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp, "gs://cheonain-rental.firebasestorage.app");
} catch (error) {
  console.warn("Firebase 초기화 실패:", error);
}

const BASE_PRICES = {
  "stage-basic": 40000,
  "stage-folding": 40000,
  "tent-33-white": 40000,
  "tent-33-blue": 40000,
  "tent-36-white": 40000,
  "tent-36-blue": 40000,
  "tent-wall-33": 3000,
  "tent-wall-55": 3000,
  "duratable-1200": 10000,
  "duratable-1500": 10000,
  "duratable-1800": 10000,
  "folding-chair-blue": 500,
  "folding-chair-red": 500,
  "plastic-chair-gray": 1000,
  "plastic-chair-white": 1000,
  "fence-a-board": 20000,
  "fence-mobile": 20000,
  "traffic-cone": 3000,
  "cone-connector": 2000,
  "fire-extinguisher": 8000,
  "signal-light": 5000,
  "safety-vest": 3000,
  "safety-helmet": 3000,
  "power-cable": 8000,
  "lead-wire": 8000,
  "multi-tap": 3000,
  "portable-aircon": 150000,
  "large-fan": 40000,
  "trash-bin-75l": 5000,
  "trash-bin-30l": 5000,
  "trash-bin-10l": 5000,
  "recycle-bin-steel": 5000,
  "icebox-130l": 20000,
  "acrylic-box": 10000,
  "string-light": 100000,
  "banner-stand": 10000,
  "sandbag-15kg": 2000
};

const BASE_PRODUCTS = [
  {
    id: "stage",
    name: "무대 설비",
    desc: "무대 및 트러스",
    items: [
      ["stage-basic", "무대", "간이무대", "간이무대"],
      ["stage-folding", "무대", "접이식 무대", "접이식 무대"],
      ["stage-truss", "트러스", "알루미늄 트러스", "사이즈 : 4m x 3m"]
    ]
  },
  {
    id: "tent",
    name: "텐트 렌탈",
    desc: "캐노피/몽골텐트",
    items: [
      ["tent-33-white", "텐트", "캐노피 텐트 3m x 3m (화이트)", "3m x 3m 화이트 캐노피"],
      ["tent-33-blue", "텐트", "캐노피 텐트 3m x 3m (블루)", "3m x 3m 블루 캐노피"],
      ["tent-36-white", "텐트", "캐노피 텐트 3m x 6m (화이트)", "3m x 6m 화이트 캐노피"],
      ["tent-36-blue", "텐트", "캐노피 텐트 3m x 6m (블루)", "3m x 6m 블루 캐노피"],
      ["mongol-33", "텐트", "몽골텐트 3m x 3m", "3m x 3m 몽골텐트"],
      ["mongol-55", "텐트", "몽골텐트 5m x 5m", "5m x 5m 몽골텐트"],
      ["tent-wall-33", "부속", "몽골/캐노피 텐트 옆면 (3x3, 3x6)", "텐트 옆면"],
      ["tent-wall-55", "부속", "몽골 텐트 옆면 (5x5)", "몽골 텐트 옆면"]
    ]
  },
  {
    id: "table",
    name: "테이블/의자",
    desc: "기본 집기",
    items: [
      ["duratable-1200", "테이블", "듀라 테이블 (1200)", "듀라테이블 1200"],
      ["duratable-1500", "테이블", "듀라 테이블 (1500)", "듀라테이블 1500"],
      ["duratable-1800", "테이블", "듀라 테이블 (1800)", "듀라테이블 1800"],
      ["folding-chair-blue", "의자", "막의자 (블루)", "막의자 블루"],
      ["folding-chair-red", "의자", "막의자 (레드)", "막의자 레드"],
      ["plastic-chair-gray", "의자", "플라스틱 의자 (그레이)", "플라스틱 의자 그레이"],
      ["plastic-chair-white", "의자", "플라스틱 의자 (화이트)", "플라스틱 의자 화이트"]
    ]
  },
  {
    id: "supplies",
    name: "행사 비품",
    desc: "운영 비품",
    items: [
      ["string-light", "조명", "알전구 (15m)", "알전구 15m 기준"],
      ["stage-led-light", "조명", "무대 LED 전구", "무대 LED 전구"],
      ["banner-stand", "안내/홍보", "배너 거치대", "배너 거치대"],
      ["acrylic-box", "안내/홍보", "아크릴 응모함", "아크릴 응모함"],
      ["fire-extinguisher", "안전", "소화기", "소화기"],
      ["traffic-cone", "안전", "라바콘", "라바콘"],
      ["cone-connector", "안전", "라바콘 연결 고리", "라바콘 연결 고리"],
      ["signal-light", "안전", "경광봉", "경광봉"],
      ["safety-vest", "안전", "안전 조끼", "안전 조끼"],
      ["safety-helmet", "안전", "안전모", "안전모"],
      ["sandbag-15kg", "안전", "모래주머니 15kg", "모래주머니 15kg"],
      ["power-cable", "전기", "전기 릴선", "전기 릴선"],
      ["lead-wire", "전기", "리드선", "리드선"],
      ["multi-tap", "전기", "멀티탭", "멀티탭"],
      ["distribution-box", "전기", "분전함", "분전함"],
      ["trash-bin-75l", "청결", "대형 휴지통 75L", "대형 휴지통 75L"],
      ["trash-bin-30l", "청결", "플라스틱 쓰레기통 30L", "플라스틱 쓰레기통 30L"],
      ["trash-bin-10l", "청결", "플라스틱 쓰레기통 10L", "플라스틱 쓰레기통 10L"],
      ["recycle-bin-steel", "청결", "철제 재활용 분리수거함", "철제 재활용 분리수거함"],
      ["icebox-130l", "보관", "스트로폼 아이스박스 130L", "아이스박스 130L"],
      ["artificial-grass", "바닥", "인조 잔디", "인조 잔디"],
      ["artificial-grass-round", "바닥", "원형 인조 잔디", "원형 인조 잔디"],
      ["large-fan", "냉방", "대형 선풍기", "대형 선풍기"],
      ["portable-aircon", "냉방", "이동식 에어컨", "이동식 에어컨"],
      ["fan", "냉방", "선풍기", "선풍기"]
    ]
  },
  {
    id: "fence",
    name: "휀스",
    desc: "통제 및 안내",
    items: [
      ["fence-mobile", "통제", "이동식 휀스", "이동식 휀스"],
      ["fence-a-board", "안내", "철제 A보드판", "철제 A보드판"],
      ["a-board-folding", "안내", "A형 접이식 간판 (A보드)", "A형 접이식 간판"]
    ]
  },
  {
    id: "stall",
    name: "가판대",
    desc: "플리마켓 및 판매 부스",
    items: [["stall-folding", "가판대", "접이식 가판대 (플리마켓 부스)", "접이식 가판대"]]
  },
  {
    id: "media",
    name: "음향 / 촬영 장비",
    desc: "스피커 및 촬영 장비",
    items: [
      ["speaker", "음향", "스피커", "스피커"],
      ["camera", "촬영", "촬영 장비", "촬영 장비"]
    ]
  }
];

const toItems = (customItems = []) =>
  BASE_PRODUCTS.map((category) => ({
    ...category,
    items: [
      ...category.items.map(([id, subCategory, name, detail]) => ({
        id,
        subCategory,
        name,
        detail,
        categoryId: category.id,
        categoryName: category.name
      })),
      ...customItems.filter((item) => item.categoryId === category.id)
    ]
  }));

const loadStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveStored = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const money = (value) => `${Number(value || 0).toLocaleString("ko-KR")}원`;

const getEstimate = (items, priceMap) => {
  const rows = (items || []).map((item) => {
    const unitPrice = Number(priceMap[item.itemId] ?? item.unitPrice ?? 0);
    const quantity = Number(item.quantity) || 0;
    const supply = unitPrice * quantity;
    const vat = Math.round(supply * 0.1);
    return { ...item, unitPrice, quantity, supply, vat };
  });
  const supplyTotal = rows.reduce((sum, item) => sum + item.supply, 0);
  const vat = rows.reduce((sum, item) => sum + item.vat, 0);
  const grandTotal = supplyTotal + vat;
  return { rows, supplyTotal, vat, grandTotal };
};

const emptyForm = {
  name: "",
  company: "",
  phone: "",
  emailLocal: "",
  emailDomain: "naver.com",
  emailCustom: "",
  password: "",
  location: "",
  eventDate: "",
  notes: ""
};

const styles = `
*{box-sizing:border-box}body{margin:0;background:#f3f6f9;color:#172033;font-family:Arial,sans-serif}.page{min-height:100vh;padding:32px 20px}.wrap{max-width:1240px;margin:auto}.hero{background:linear-gradient(135deg,#1f2937,#334155);border-radius:28px;padding:44px 38px;color:white;box-shadow:0 18px 50px rgba(15,23,42,.18)}.brand{font-size:44px;margin:0;font-weight:900}.subtitle{color:#cbd5e1;line-height:1.8}.btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}button{cursor:pointer;border-radius:12px;border:1px solid #cbd5e1;background:white;padding:12px 16px;font-weight:800}.primary{background:#2563eb;color:white;border:0}.danger{border-color:#ef4444;color:#b91c1c}.back{margin-bottom:20px}.admin-fab{position:fixed;left:18px;bottom:18px;z-index:20;box-shadow:0 10px 25px rgba(0,0,0,.15)}.admin-badge{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;font-size:12px}.admin-alert{background:#fff7ed;border:1px solid #fdba74;color:#9a3412;border-radius:16px;padding:14px 16px;margin:14px 0;font-weight:900}.head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-top:26px}.search{position:relative;max-width:320px;width:100%}.search input{padding-left:34px}.icon{position:absolute;left:12px;top:50%;transform:translateY(-50%)}.input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:13px 14px;font-size:14px;outline:none;background:white}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-top:24px}.card,.panel,.item,.qitem{background:white;border:1px solid #dbe3ec;border-radius:20px;box-shadow:0 8px 20px rgba(15,23,42,.06);overflow:hidden}.card,.item{cursor:pointer}.card:hover,.item:hover{transform:translateY(-4px);transition:.18s}.photo{height:120px;background:#e5e7eb;position:relative;overflow:hidden}.photo img{width:100%;height:100%;object-fit:contain;background:#fff}.empty{height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-weight:800;font-size:12px}.photo label{position:absolute;right:8px;bottom:8px;background:rgba(15,23,42,.82);color:white;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900}.remove-photo{position:absolute;left:8px;top:8px;background:rgba(239,68,68,.92);color:white;border:0;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900}.body{padding:18px}.title{margin:0;font-size:22px;font-weight:900}.panel{padding:28px}.detail-title{font-size:34px;margin:0 0 14px;font-weight:900}.text{white-space:pre-line;line-height:1.8;color:#475569}.group{margin-top:22px}.item-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.qgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;align-items:stretch;grid-auto-rows:300px;padding:16px}.qitem{padding:12px;min-width:0;display:flex;flex-direction:column;justify-content:space-between;height:100%}.qitem .photo{height:80px;border-radius:10px}.qitem>p{min-height:44px;display:flex;align-items:center;margin:8px 0}.qitem .qty,.qitem .price-edit{margin-top:auto}.formgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.field{display:flex;flex-direction:column;gap:8px}.field label{font-size:13px;font-weight:900}.email{grid-column:span 2}.emailrow{display:flex;gap:8px;align-items:center}.emailrow input{flex:1}.emailrow select,.emailrow .domain{width:160px}.cat{border:1px solid #dbe3ec;border-radius:20px;background:white;margin-top:20px;overflow:hidden}.cathead{padding:18px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;cursor:pointer}.qty{display:grid;grid-template-columns:36px minmax(54px,1fr) 36px;gap:6px;align-items:center}.qty input{min-width:0;text-align:center;padding:9px 4px;border:1px solid #cbd5e1;border-radius:10px}.qty button{padding:0;height:38px;display:flex;align-items:center;justify-content:center}.box{margin-top:18px;padding:18px;border-radius:16px;background:#f8fafc;border:1px solid #dbe3ec;white-space:pre-line;line-height:1.8;color:#475569}.cart-box{background:#eff6ff!important;border-color:#93c5fd!important}.cart-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.cart-list{margin-top:12px;display:flex;flex-direction:column;gap:8px}.cart-row{display:flex;justify-content:space-between;align-items:center;background:#fff;padding:8px 12px;border-radius:10px;font-size:13px}.cart-remove{font-size:12px;color:#ef4444;border:1px solid #fecaca;background:#fff}.overlay{position:fixed;inset:0;background:rgba(15,23,42,.38);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}.modal{background:white;border-radius:20px;padding:24px;max-width:430px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.2)}.admin{display:grid;grid-template-columns:320px 1fr;gap:18px}.admin-card{padding:16px;border:1px solid #dbe3ec;border-radius:16px;background:white;cursor:pointer}.active{background:#eff6ff;border-color:#93c5fd}.footer{margin-top:60px;text-align:center;font-size:12px;color:#94a3b8}.compact-form{max-width:720px}.compact-row{display:grid;grid-template-columns:repeat(2,minmax(180px,260px));gap:12px}.hint-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.hint-chip{font-size:12px;background:#e2e8f0;color:#334155;border-radius:999px;padding:5px 9px}.custom-tag{display:inline-block;margin-left:6px;font-size:11px;background:#dcfce7;color:#166534;border-radius:999px;padding:3px 7px}.price-now{font-size:13px;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:8px 10px}.quote-table{width:100%;border-collapse:collapse;font-size:14px;background:#fff}.quote-table th,.quote-table td{padding:10px;border:1px solid #cbd5e1}.quote-table th{background:#e2e8f0}.right{text-align:right}.center{text-align:center}@media(max-width:900px){.grid,.item-grid{grid-template-columns:repeat(3,1fr)}.admin{grid-template-columns:1fr}.email{grid-column:span 1}}@media(max-width:640px){.grid,.item-grid{grid-template-columns:repeat(2,1fr)}.qgrid{grid-template-columns:repeat(5,1fr);gap:10px;padding:10px;overflow-x:auto;grid-auto-rows:280px}.brand{font-size:30px}.hero,.panel{padding:22px}.head{flex-direction:column;align-items:stretch}.qitem{padding:9px;min-width:130px;height:280px}.compact-row{grid-template-columns:1fr}.emailrow{flex-wrap:wrap}.emailrow select,.emailrow .domain{width:100%}}
`;

function Photo({ item, images, onUpload, onRemove, large = false }) {
  const urls = images[item.id] || [];
  const src = urls[0];
  return (
    <div className="photo" style={large ? { height: 320, borderRadius: 18, marginBottom: 20 } : null}>
      {src ? <img src={src} alt={item.name} /> : <div className="empty">{onUpload ? "사진 첨부" : "이미지 준비중"}</div>}
      {onUpload && onRemove && urls.length > 0 && (
        <button className="remove-photo" type="button" onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}>삭제</button>
      )}
      {onUpload && (
        <label onClick={(e) => e.stopPropagation()}>
          사진 추가
          <input hidden type="file" accept="image/*" multiple onChange={(e) => onUpload(item.id, e.target.files)} />
        </label>
      )}
    </div>
  );
}

function EmailField({ form, setForm }) {
  return (
    <div className="field email">
      <label>이메일</label>
      <div className="emailrow">
        <input className="input" value={form.emailLocal} onChange={(e) => setForm({ ...form, emailLocal: e.target.value })} placeholder="이메일" />
        <span>@</span>
        {form.emailDomain === "custom" ? (
          <input className="input domain" value={form.emailCustom} onChange={(e) => setForm({ ...form, emailCustom: e.target.value })} placeholder="직접 입력" />
        ) : (
          <select value={form.emailDomain} onChange={(e) => setForm({ ...form, emailDomain: e.target.value })}>
            <option>naver.com</option><option>gmail.com</option><option>hanmail.net</option><option>nate.com</option><option>hotmail.com</option><option value="custom">직접 입력</option>
          </select>
        )}
      </div>
    </div>
  );
}

function Modal({ msg, close }) {
  if (!msg) return null;
  return (
    <div className="overlay">
      <div className="modal">
        <h2>{msg.type === "success" ? "완료" : "확인"}</h2>
        <p>{msg.text}</p>
        <div className="btns"><button className="primary" onClick={close}>확인</button></div>
      </div>
    </div>
  );
}

export default function App() {
  const [customItems, setCustomItems] = useState(() => loadStored("customItems", []));
  const products = useMemo(() => toItems(customItems), [customItems]);
  const allItems = useMemo(() => products.flatMap((p) => p.items), [products]);

  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const [sub, setSub] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [qty, setQty] = useState({});
  const [open, setOpen] = useState(() => Object.fromEntries(BASE_PRODUCTS.map((p, i) => [p.id, i === 0])));
  const [inquiries, setInquiries] = useState(() => loadStored("inquiries", []));
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSection, setAdminSection] = useState("menu");
  const [msg, setMsg] = useState(null);
  const [images, setImages] = useState(() => loadStored("images", {}));
  const [catImages, setCatImages] = useState(() => loadStored("catImages", {}));
  const [priceMap, setPriceMap] = useState(() => loadStored("priceMap", BASE_PRICES));
  const [newProduct, setNewProduct] = useState({ categoryId: "supplies", subCategory: "", name: "", detail: "", price: "" });
  const [prevPhone, setPrevPhone] = useState("");
  const [prevPass, setPrevPass] = useState("");
  const [prevResult, setPrevResult] = useState(null);
  const [prevError, setPrevError] = useState("");

  useEffect(() => saveStored("inquiries", inquiries), [inquiries]);
  useEffect(() => saveStored("customItems", customItems), [customItems]);
  useEffect(() => saveStored("images", images), [images]);
  useEffect(() => saveStored("catImages", catImages), [catImages]);
  useEffect(() => saveStored("priceMap", priceMap), [priceMap]);

  useEffect(() => {
    if (!db) return;
    const run = async () => {
      const itemMap = {};
      const categoryMap = {};
      await Promise.all(allItems.map(async (item) => {
        try {
          const snap = await getDoc(doc(db, "images", item.id));
          if (snap.exists() && snap.data().urls?.length) itemMap[item.id] = snap.data().urls;
        } catch {}
      }));
      await Promise.all(products.map(async (product) => {
        try {
          const snap = await getDoc(doc(db, "categoryImages", product.id));
          if (snap.exists() && snap.data().urls?.length) categoryMap[product.id] = snap.data().urls;
        } catch {}
      }));
      setImages((prev) => ({ ...prev, ...itemMap }));
      setCatImages((prev) => ({ ...prev, ...categoryMap }));
    };
    run();
  }, [allItems.length, products.length]);

  const selectedItems = useMemo(() => allItems.filter((item) => Number(qty[item.id]) > 0), [allItems, qty]);
  const cartCount = selectedItems.reduce((sum, item) => sum + Number(qty[item.id] || 0), 0);
  const currentInquiry = useMemo(() => inquiries.find((item) => item.id === selectedInquiryId) || inquiries[0] || null, [inquiries, selectedInquiryId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const keyword = search.toLowerCase();
    return products
      .map((p) => ({ ...p, items: p.items.filter((i) => i.name.toLowerCase().includes(keyword) || i.subCategory.toLowerCase().includes(keyword)) }))
      .filter((p) => p.name.toLowerCase().includes(keyword) || p.items.length);
  }, [products, search]);

  const groups = (items) => Object.entries(items.reduce((acc, item) => ((acc[item.subCategory] ??= []).push(item), acc), {}));
  const email = () => form.emailLocal ? `${form.emailLocal}@${form.emailDomain === "custom" ? form.emailCustom : form.emailDomain}` : "";
  const backHome = () => { setPage("home"); setSelected(null); setSub(null); };

  const uploadImage = async (collection, folder, id, files, map, setMap) => {
    if (!storage || !db) {
      alert("Firebase Storage 연결이 없어 현재 환경에서는 업로드가 제한됩니다.");
      return;
    }
    const fileList = Array.from(files || []);
    if (!fileList.length) return;
    try {
      const urls = [];
      for (const file of fileList) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileRef = ref(storage, `${folder}/${id}/${Date.now()}_${safeName}`);
        await uploadBytes(fileRef, file);
        urls.push(await getDownloadURL(fileRef));
      }
      const next = { ...map, [id]: [...(map[id] || []), ...urls] };
      setMap(next);
      await setDoc(doc(db, collection, id), { urls: next[id] });
      alert("사진이 저장되었습니다.");
    } catch (error) {
      alert(`사진 업로드 실패: ${error?.code || error?.message || "알 수 없는 오류"}`);
    }
  };

  const removeImage = async (collection, id, map, setMap) => {
    const urls = map[id] || [];
    if (storage) {
      await Promise.all(urls.map(async (url) => {
        try { await deleteObject(ref(storage, url)); } catch {}
      }));
    }
    const next = { ...map };
    delete next[id];
    setMap(next);
    if (db) await setDoc(doc(db, collection, id), { urls: [] });
  };

  const sendQuote = () => {
    const required = [["성함", form.name], ["업체명", form.company], ["연락처", form.phone], ["이메일", email()], ["비밀번호", form.password], ["행사 장소", form.location], ["행사일", form.eventDate]];
    for (const [label, value] of required) {
      if (!String(value || "").trim()) return setMsg({ type: "warn", text: `${label}을(를) 입력해 주세요.` });
    }
    if (!selectedItems.length) return setMsg({ type: "warn", text: "렌탈 품목을 1개 이상 선택해 주세요." });

    const inquiry = {
      id: Date.now(),
      createdAt: new Date().toLocaleString("ko-KR"),
      ...form,
      email: email(),
      items: selectedItems.map((item) => ({
        itemId: item.id,
        categoryName: item.categoryName,
        name: item.name,
        quantity: Number(qty[item.id]) || 0,
        unitPrice: Number(priceMap[item.id] || 0)
      }))
    };

    setInquiries((prev) => [inquiry, ...prev]);
    setSelectedInquiryId(inquiry.id);
    setForm(emptyForm);
    setQty({});
    setMsg({ type: "success", text: "성공적으로 견적 문의가 접수되었습니다." });
  };

  const checkPrevious = () => {
    const phone = prevPhone.replace(/[^0-9]/g, "");
    const found = inquiries.find((item) => item.password === prevPass && String(item.phone).replace(/[^0-9]/g, "") === phone);
    if (!found) {
      setPrevResult(null);
      setPrevError("일치하는 견적 문의를 찾을 수 없습니다.");
      return;
    }
    setPrevResult(found);
    setPrevError("");
  };

  const downloadExcel = (inquiry) => {
    const estimate = getEstimate(inquiry.items, priceMap);
    const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rows = estimate.rows.map((row) => `<tr><td>${esc(row.name)}</td><td>${row.quantity}</td><td>${row.unitPrice}</td><td>${row.supply}</td><td>${row.vat}</td></tr>`).join("");
    const html = `
      <html><head><meta charset="UTF-8"></head><body>
      <h2>천아인 렌탈 견적서</h2>
      <table border="1">
        <tr><th>성함</th><td>${esc(inquiry.name)}</td></tr>
        <tr><th>업체명</th><td>${esc(inquiry.company)}</td></tr>
        <tr><th>연락처</th><td>${esc(inquiry.phone)}</td></tr>
        <tr><th>이메일</th><td>${esc(inquiry.email)}</td></tr>
        <tr><th>행사 장소</th><td>${esc(inquiry.location)}</td></tr>
        <tr><th>행사일</th><td>${esc(inquiry.eventDate)}</td></tr>
        <tr><th>접수 시간</th><td>${esc(inquiry.createdAt)}</td></tr>
      </table>
      <br/>
      <table border="1">
        <thead><tr><th>제품명</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세 10%</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><th colspan="3">총 공급가액</th><td>${estimate.supplyTotal}</td><td></td></tr>
          <tr><th colspan="3">총 부가세</th><td></td><td>${estimate.vat}</td></tr>
          <tr><th colspan="4">최종 금액</th><td>${estimate.grandTotal}</td></tr>
        </tfoot>
      </table>
      </body></html>
    `;
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

  const addCustomItem = () => {
    const category = products.find((p) => p.id === newProduct.categoryId);
    if (!category || !newProduct.subCategory.trim() || !newProduct.name.trim()) return alert("카테고리, 소분류, 물품 이름을 입력해 주세요.");
    const id = `custom-${Date.now()}`;
    const item = {
      id,
      categoryId: category.id,
      categoryName: category.name,
      subCategory: newProduct.subCategory.trim(),
      name: newProduct.name.trim(),
      detail: newProduct.detail.trim() || newProduct.name.trim()
    };
    setCustomItems((prev) => [...prev, item]);
    setPriceMap((prev) => ({ ...prev, [id]: Number(newProduct.price) || 0 }));
    setNewProduct({ categoryId: "supplies", subCategory: "", name: "", detail: "", price: "" });
    setMsg({ type: "success", text: "물품이 추가되었습니다." });
  };

  if (page === "quote") {
    return (
      <>
        <style>{styles}</style>
        <div className="page">
          <div className="wrap">
            <button className="back" onClick={backHome}>← 메인으로 돌아가기</button>
            <div className="panel">
              {selectedItems.length > 0 && (
                <div className="box cart-box">
                  <div className="cart-head">
                    <b>선택한 품목 ({cartCount}개)</b>
                    <button className="danger" onClick={() => setQty({})}>전체 초기화</button>
                  </div>
                  <div className="cart-list">
                    {selectedItems.map((item) => (
                      <div className="cart-row" key={item.id}>
                        <span>{item.name} {qty[item.id]}개</span>
                        <button className="cart-remove" onClick={() => setQty((prev) => ({ ...prev, [item.id]: "" }))}>삭제</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="head">
                <div>
                  <h1 className="detail-title">견적 문의</h1>
                  <p className="text">카테고리를 누르면 아래로 품목이 열립니다.</p>
                </div>
                <button className="primary" onClick={sendQuote}>보내기</button>
              </div>

              <div className="btns">
                <button onClick={() => { setPage("prev"); setPrevResult(null); setPrevError(""); }}>이전 견적 문의 확인하기</button>
              </div>

              <div className="formgrid">
                <div className="field"><label>성함</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="field"><label>업체명</label><input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                <div className="field"><label>연락처</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <EmailField form={form} setForm={setForm} />
                <div className="field"><label>비밀번호</label><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div className="field"><label>행사 장소</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div className="field"><label>행사일</label><input className="input" type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
              </div>

              <div className="field" style={{ marginTop: 16 }}>
                <label>추가 요청사항</label>
                <textarea className="input" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              {products.map((product) => (
                <div className="cat" key={product.id}>
                  <div className="cathead" onClick={() => setOpen((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}>
                    <div><h2>{product.name}</h2><p>{product.desc}</p></div><b>{open[product.id] ? "−" : "+"}</b>
                  </div>
                  {open[product.id] && groups(product.items).map(([group, items]) => (
                    <div key={group}>
                      <h3 style={{ padding: "10px 18px", margin: 0 }}>{group}</h3>
                      <div className="qgrid">
                        {items.map((item) => (
                          <div className="qitem" key={item.id}>
                            <Photo item={item} images={images} />
                            <p><b>{item.name}</b></p>
                            <div className="qty">
                              <button onClick={() => setQty((prev) => ({ ...prev, [item.id]: String(Math.max(0, (Number(prev[item.id]) || 0) - 1)) }))}>−</button>
                              <input value={qty[item.id] || ""} onChange={(e) => setQty((prev) => ({ ...prev, [item.id]: e.target.value.replace(/[^0-9]/g, "") }))} />
                              <button onClick={() => setQty((prev) => ({ ...prev, [item.id]: String((Number(prev[item.id]) || 0) + 1) }))}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="btns"><button className="primary" onClick={sendQuote}>보내기</button></div>
            </div>
          </div>
        </div>
        <Modal msg={msg} close={() => setMsg(null)} />
      </>
    );
  }

  if (page === "prev") {
    return (
      <>
        <style>{styles}</style>
        <div className="page"><div className="wrap"><div className="panel">
          <button className="back" onClick={() => setPage("quote")}>← 견적 문의로 돌아가기</button>
          <h1 className="detail-title">이전 견적 문의 확인하기</h1>
          <div className="compact-form">
            <div className="field"><label>연락처</label><input className="input" value={prevPhone} onChange={(e) => setPrevPhone(e.target.value)} /></div>
            <div className="field" style={{ marginTop: 14 }}><label>비밀번호</label><input className="input" type="password" value={prevPass} onChange={(e) => setPrevPass(e.target.value)} /></div>
          </div>
          <div className="btns"><button className="primary" onClick={checkPrevious}>확인</button></div>
          {prevError && <div className="box">{prevError}</div>}
          {prevResult && (
            <div className="box">
              {`성함 : ${prevResult.name}
업체명 : ${prevResult.company}
연락처 : ${prevResult.phone}
이메일 : ${prevResult.email}
행사 장소 : ${prevResult.location}
행사일 : ${prevResult.eventDate}

[렌탈 요청 품목]
${prevResult.items.map((item) => `- ${item.categoryName} / ${item.name} : ${item.quantity}개`).join("\n")}`}
            </div>
          )}
        </div></div></div>
      </>
    );
  }

  if (page === "admin") {
    return (
      <>
        <style>{styles}</style>
        <div className="page"><div className="wrap">
          <button className="back" onClick={backHome}>← 메인으로 돌아가기</button>
          <div className="panel">
            <h1 className="detail-title">관리자 모드</h1>

            {adminSection === "menu" && (
              <>
                {inquiries.length > 0 && <div className="admin-alert">새 견적 문의가 {inquiries.length}건 들어왔습니다.</div>}
                <p className="text">관리할 메뉴를 선택하세요.</p>
                <div className="grid">
                  <div className="card" onClick={() => setAdminSection("products")}><div className="body"><h3 className="title">사이트 물품 관리</h3><p className="text">물품, 사진, 가격을 관리합니다.</p></div></div>
                  <div className="card" onClick={() => setAdminSection("quotes")}><div className="body"><h3 className="title">견적 확인 {inquiries.length > 0 && <span className="custom-tag">새 문의 {inquiries.length}</span>}</h3><p className="text">접수된 견적을 확인하고 엑셀로 저장합니다.</p></div></div>
                </div>
              </>
            )}

            {adminSection !== "menu" && <div className="btns"><button onClick={() => setAdminSection("menu")}>← 관리자 메뉴로</button></div>}

            {adminSection === "quotes" && (
              !inquiries.length ? <div className="box">아직 접수된 문의가 없습니다.</div> : (
                <div className="admin">
                  <div>
                    {inquiries.map((inq, index) => (
                      <div className={`admin-card ${currentInquiry?.id === inq.id ? "active" : ""}`} key={inq.id} onClick={() => setSelectedInquiryId(inq.id)}>
                        <h3>{inq.name}</h3>
                        <p>{`문의 번호 : ${inquiries.length - index}\n연락처 : ${inq.phone}\n행사일 : ${inq.eventDate}`}</p>
                        <small>{inq.createdAt}</small>
                      </div>
                    ))}
                  </div>
                  <div>
                    {currentInquiry && (
                      <div className="admin-card">
                        <h3>{currentInquiry.name}</h3>
                        <p className="text">{`업체명 : ${currentInquiry.company}\n연락처 : ${currentInquiry.phone}\n이메일 : ${currentInquiry.email}\n행사 장소 : ${currentInquiry.location}\n행사일 : ${currentInquiry.eventDate}\n접수 시간 : ${currentInquiry.createdAt}`}</p>
                        <div className="box">{currentInquiry.items.map((item) => `- ${item.categoryName} / ${item.name} : ${item.quantity}개`).join("\n")}</div>

                        <div className="box">
                          {(() => {
                            const estimate = getEstimate(currentInquiry.items, priceMap);
                            return (
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                  <h3 style={{ marginTop: 0 }}>관리자 전용 견적 산출</h3>
                                  <button className="primary" onClick={() => downloadExcel(currentInquiry)}>엑셀 파일 다운로드</button>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                  <table className="quote-table">
                                    <thead><tr><th>제품명</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th></tr></thead>
                                    <tbody>
                                      {estimate.rows.map((row) => (
                                        <tr key={`${row.itemId}-${row.name}`}>
                                          <td>{row.name}</td>
                                          <td className="center">{row.quantity}</td>
                                          <td className="right">{money(row.unitPrice)}</td>
                                          <td className="right">{money(row.supply)}</td>
                                          <td className="right">{money(row.vat)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr><td colSpan="3" className="right"><b>총 공급가액</b></td><td className="right"><b>{money(estimate.supplyTotal)}</b></td><td className="right"><b>{money(estimate.vat)}</b></td></tr>
                                      <tr><td colSpan="4" className="right"><b>최종 금액</b></td><td className="right"><b>{money(estimate.grandTotal)}</b></td></tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <button className="danger" onClick={() => { setInquiries((prev) => prev.filter((item) => item.id !== currentInquiry.id)); setSelectedInquiryId(null); }}>견적 삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {adminSection === "products" && (
              <div style={{ marginTop: 20 }}>
                <h2>사이트 물품 관리</h2>
                <p className="text">사진과 가격은 관리자 화면에서만 수정할 수 있습니다.</p>

                <div className="box compact-form">
                  <h3>물품 추가</h3>
                  <div className="compact-row">
                    <div className="field"><label>카테고리</label><select className="input" value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div className="field"><label>소분류</label><input className="input" value={newProduct.subCategory} onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })} list="subList" placeholder="소분류 선택/입력" /></div>
                  </div>
                  <datalist id="subList">{[...new Set(products.flatMap((p) => p.items.map((item) => item.subCategory)))].map((sub) => <option key={sub} value={sub} />)}</datalist>
                  <div className="hint-list">{[...new Set(products.flatMap((p) => p.items.map((item) => item.subCategory)))].slice(0, 12).map((sub) => <button className="hint-chip" key={sub} onClick={() => setNewProduct({ ...newProduct, subCategory: sub })}>{sub}</button>)}</div>
                  <div className="compact-row" style={{ marginTop: 12 }}>
                    <div className="field"><label>물품 이름</label><input className="input" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                    <div className="field"><label>단가 / 부가세 제외</label><input className="input" inputMode="numeric" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value.replace(/[^0-9]/g, "") })} /></div>
                  </div>
                  <div className="field" style={{ marginTop: 12 }}><label>상세 설명</label><textarea className="input" rows={4} value={newProduct.detail} onChange={(e) => setNewProduct({ ...newProduct, detail: e.target.value })} /></div>
                  <button className="primary" style={{ marginTop: 12 }} onClick={addCustomItem}>추가</button>
                </div>

                {products.map((product) => (
                  <div className="cat" key={product.id}>
                    <div className="cathead"><div><h3>{product.name}</h3><p>{product.desc}</p></div></div>
                    <div className="qgrid">
                      <div className="qitem">
                        <Photo item={product} images={catImages} onUpload={(id, files) => uploadImage("categoryImages", "categoryImages", id, files, catImages, setCatImages)} onRemove={(id) => removeImage("categoryImages", id, catImages, setCatImages)} />
                        <p><b>{product.name} 대표 사진</b></p>
                      </div>
                      {product.items.map((item) => (
                        <div className="qitem" key={item.id}>
                          <Photo item={item} images={images} onUpload={(id, files) => uploadImage("images", "images", id, files, images, setImages)} onRemove={(id) => removeImage("images", id, images, setImages)} />
                          <p><b>{item.name}</b></p>
                          <div className="field price-edit">
                            <label>관리자 단가</label>
                            <strong className="price-now">현재 단가 : {money(priceMap[item.id] ?? 0)}</strong>
                            <input className="input" inputMode="numeric" value={priceMap[item.id] ?? 0} onChange={(e) => setPriceMap((prev) => ({ ...prev, [item.id]: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 }))} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div></div>
        <Modal msg={msg} close={() => setMsg(null)} />
      </>
    );
  }

  if (sub && selected) {
    return (
      <>
        <style>{styles}</style>
        <div className="page"><div className="wrap">
          <button className="back" onClick={backHome}>← 목록으로</button>
          <button className="back" onClick={() => setSub(null)}>← {selected.name}</button>
          <div className="panel">
            <h1 className="detail-title">{sub.name}</h1>
            <Photo item={sub} images={images} large />
            <p className="text">{sub.detail}</p>
            <h3>추가 사진</h3>
            <div className="grid">{(images[sub.id] || []).map((src, index) => <div className="photo" key={`${src}-${index}`}><img src={src} alt="" /></div>)}</div>
            <div className="btns"><button className="primary" onClick={() => setPage("quote")}>견적 문의하기</button></div>
          </div>
        </div></div>
      </>
    );
  }

  if (selected) {
    return (
      <>
        <style>{styles}</style>
        <div className="page"><div className="wrap">
          <button className="back" onClick={backHome}>← 목록으로</button>
          <div className="panel">
            <h1 className="detail-title">{selected.name}</h1>
            <p className="text">{selected.desc}</p>
            {groups(selected.items).map(([group, items]) => (
              <div className="group" key={group}>
                <h3>{group}</h3>
                <div className="item-grid">{items.map((item) => <div className="item" key={item.id} onClick={() => setSub(item)}><Photo item={item} images={images} /><div className="body"><b>{item.name}</b></div></div>)}</div>
              </div>
            ))}
            <div className="btns"><button className="primary" onClick={() => setPage("quote")}>견적 문의하기</button></div>
          </div>
        </div></div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <button className="admin-fab" onClick={() => setAdminOpen(true)}>관리자 모드{inquiries.length > 0 && <span className="admin-badge">{inquiries.length}</span>}</button>
        <div className="wrap">
          <div className="hero">
            <h1 className="brand">천아인 렌탈</h1>
            <p className="subtitle">행사에 필요한 모든 장비, 한 번에 빠르게 렌탈하세요.</p>
            <div className="btns"><button className="primary" onClick={() => setPage("quote")}>견적 문의</button></div>
          </div>
          <div className="head">
            <h2>렌탈 품목 카테고리</h2>
            <div className="search"><span className="icon">🔍</span><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="제품 검색" /></div>
          </div>
          <div className="grid">{filtered.map((product) => <div className="card" key={product.id} onClick={() => setSelected(product)}><Photo item={product} images={catImages} /><div className="body"><h3 className="title">{product.name}</h3></div></div>)}</div>
          <div className="footer">사업자등록번호 753-77-00504 | 대표자 김동혁</div>
        </div>

        {adminOpen && (
          <div className="overlay">
            <div className="modal">
              <h2>관리자 모드</h2>
              <p>관리자 코드를 입력하세요.</p>
              <input className="input" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="관리자 코드" />
              {adminError && <div className="box">{adminError}</div>}
              <div className="btns">
                <button className="primary" onClick={() => adminCode.trim() === ADMIN_CODE ? (setAdminOpen(false), setAdminSection("menu"), setPage("admin"), setAdminError("")) : setAdminError("관리자 코드가 올바르지 않습니다.")}>로그인</button>
                <button onClick={() => setAdminOpen(false)}>닫기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
