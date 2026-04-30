import { useEffect, useMemo, useState } from "react";
import AdminPage from "./components/AdminPage";
import HomePage from "./components/HomePage";
import Modal from "./components/Modal";
import PreviousInquiryPage from "./components/PreviousInquiryPage";
import ProductPages from "./components/ProductPages";
import QuotePage from "./components/QuotePage";
import { baseProducts, normalizeProducts } from "./data/products";
import {
  clearImages,
  loadCustomItems,
  loadImageMap,
  saveCustomItems,
  uploadImageFiles
} from "./services/firebaseData";

const ADMIN_CODE = "CHEONAIN2026";

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

const emptyProductForm = {
  categoryId: "supplies",
  subCategory: "",
  name: "",
  detail: ""
};

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function makeInitialQty(items) {
  return Object.fromEntries(items.map((item) => [item.id, ""]));
}

export default function App() {
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const [sub, setSub] = useState(null);
  const [search, setSearch] = useState("");

  const [customItems, setCustomItems] = useState([]);
  const products = useMemo(() => normalizeProducts(customItems), [customItems]);
  const allItems = useMemo(() => products.flatMap((product) => product.items), [products]);

  const [form, setForm] = useState(emptyForm);
  const [qty, setQty] = useState(() => makeInitialQty(allItems));
  const [open, setOpen] = useState(() => Object.fromEntries(products.map((product, index) => [product.id, index === 0])));

  const [inquiries, setInquiries] = useState(() => loadStored("cheonainInquiries", []));
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSection, setAdminSection] = useState("menu");

  const [message, setMessage] = useState(null);

  const [prevPhone, setPrevPhone] = useState("");
  const [prevPass, setPrevPass] = useState("");
  const [prevResult, setPrevResult] = useState(null);
  const [prevError, setPrevError] = useState("");

  const [images, setImages] = useState(() => loadStored("cheonainImages", {}));
  const [catImages, setCatImages] = useState(() => loadStored("cheonainCatImages", {}));

  const [productForm, setProductForm] = useState(emptyProductForm);

  useEffect(() => {
    setQty((previous) => ({
      ...makeInitialQty(allItems),
      ...previous
    }));
  }, [allItems]);

  useEffect(() => {
    localStorage.setItem("cheonainImages", JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    localStorage.setItem("cheonainCatImages", JSON.stringify(catImages));
  }, [catImages]);

  useEffect(() => {
    localStorage.setItem("cheonainInquiries", JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    async function loadFirebaseData() {
      const savedItems = await loadCustomItems();
      setCustomItems(savedItems);

      const nextProducts = normalizeProducts(savedItems);
      const itemIds = nextProducts.flatMap((product) => product.items.map((item) => item.id));
      const categoryIds = baseProducts.map((product) => product.id);

      const [itemImages, categoryImages] = await Promise.all([
        loadImageMap("images", itemIds),
        loadImageMap("categoryImages", categoryIds)
      ]);

      setImages(itemImages);
      setCatImages(categoryImages);
    }

    loadFirebaseData().catch((error) => {
      console.warn("Firebase 데이터 불러오기 실패:", error);
    });
  }, []);

  const selectedItems = useMemo(
    () => allItems.filter((item) => Number(qty[item.id]) > 0),
    [qty, allItems]
  );

  const currentInquiry = useMemo(
    () => inquiries.find((inquiry) => inquiry.id === selectedInquiryId) || inquiries[0] || null,
    [inquiries, selectedInquiryId]
  );

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;

    const keyword = search.toLowerCase();
    return products
      .map((product) => ({
        ...product,
        items: product.items.filter((item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.subCategory.toLowerCase().includes(keyword)
        )
      }))
      .filter((product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.items.length
      );
  }, [search, products]);

  const email = () => {
    if (!form.emailLocal) return "";
    return `${form.emailLocal}@${form.emailDomain === "custom" ? form.emailCustom : form.emailDomain}`;
  };

  const back = () => {
    setPage("home");
    setSelected(null);
    setSub(null);
  };

  const changeQty = (id, amount) => {
    setQty((previous) => ({
      ...previous,
      [id]: String(Math.max(0, (Number(previous[id]) || 0) + amount))
    }));
  };

  const setQtyValue = (id, value) => {
    setQty((previous) => ({
      ...previous,
      [id]: String(Math.max(0, Number(value) || 0))
    }));
  };

  const login = () => {
    if (adminCode.trim() !== ADMIN_CODE) {
      setAdminError("관리자 코드가 올바르지 않습니다.");
      return;
    }

    setAdminOpen(false);
    setAdminError("");
    setAdminSection("menu");
    setPage("admin");
  };

  const sendQuote = () => {
    const required = [
      ["성함", form.name],
      ["업체명", form.company],
      ["연락처", form.phone],
      ["이메일", email()],
      ["비밀번호", form.password],
      ["행사 장소", form.location],
      ["행사일", form.eventDate]
    ];

    for (const [label, value] of required) {
      if (!String(value || "").trim()) {
        setMessage({ type: "warn", text: `${label}을(를) 입력해 주세요.` });
        return;
      }
    }

    if (!selectedItems.length) {
      setMessage({ type: "warn", text: "렌탈 품목을 1개 이상 선택해 주세요." });
      return;
    }

    const newInquiry = {
      id: Date.now(),
      createdAt: new Date().toLocaleString("ko-KR"),
      name: form.name,
      company: form.company,
      phone: form.phone,
      email: email(),
      password: form.password,
      location: form.location,
      eventDate: form.eventDate,
      items: selectedItems.map((item) => ({
        categoryName: item.categoryName,
        name: item.name,
        quantity: qty[item.id]
      }))
    };

    setInquiries((previous) => [newInquiry, ...previous]);
    setSelectedInquiryId(newInquiry.id);
    setForm(emptyForm);
    setQty(makeInitialQty(allItems));
    setMessage({ type: "success", text: "성공적으로 견적 문의가 접수되었습니다." });
  };

  const checkPrev = () => {
    const phone = prevPhone.replace(/[^0-9]/g, "");
    const match = inquiries.find((inquiry) =>
      inquiry.password === prevPass &&
      String(inquiry.phone).replace(/[^0-9]/g, "") === phone
    );

    if (match) {
      setPrevResult(match);
      setPrevError("");
    } else {
      setPrevResult(null);
      setPrevError("일치하는 견적 문의를 찾을 수 없습니다.");
    }
  };

  const upload = async (id, files) => {
    try {
      const urls = await uploadImageFiles("images", "images", id, files, images[id] || []);
      setImages((previous) => ({ ...previous, [id]: urls }));
      alert("사진이 저장되었습니다.");
    } catch (error) {
      console.error("품목 사진 업로드 실패:", error);
      alert(`사진 업로드에 실패했습니다.\n\n오류: ${error?.code || error?.message || "알 수 없는 오류"}\n\nFirebase Storage 규칙과 Storage 생성 여부를 확인해 주세요.`);
    }
  };

  const uploadCat = async (id, files) => {
    try {
      const urls = await uploadImageFiles("categoryImages", "categoryImages", id, files, catImages[id] || []);
      setCatImages((previous) => ({ ...previous, [id]: urls }));
      alert("대표 사진이 저장되었습니다.");
    } catch (error) {
      console.error("카테고리 사진 업로드 실패:", error);
      alert(`대표 사진 업로드에 실패했습니다.\n\n오류: ${error?.code || error?.message || "알 수 없는 오류"}\n\nFirebase Storage 규칙과 Storage 생성 여부를 확인해 주세요.`);
    }
  };

  const removeImg = async (id) => {
    try {
      await clearImages("images", id, images[id] || []);
      setImages((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      setMessage({ type: "success", text: "사진이 삭제되었습니다." });
    } catch (error) {
      console.error("품목 사진 삭제 실패:", error);
      alert("사진 삭제에 실패했습니다. Firebase Storage / Firestore 규칙을 확인해 주세요.");
    }
  };

  const removeCatImg = async (id) => {
    try {
      await clearImages("categoryImages", id, catImages[id] || []);
      setCatImages((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      setMessage({ type: "success", text: "대표 사진이 삭제되었습니다." });
    } catch (error) {
      console.error("카테고리 사진 삭제 실패:", error);
      alert("대표 사진 삭제에 실패했습니다. Firebase Storage / Firestore 규칙을 확인해 주세요.");
    }
  };

  const addCustomItem = async () => {
    const category = products.find((product) => product.id === productForm.categoryId);
    const name = productForm.name.trim();
    const subCategory = productForm.subCategory.trim();

    if (!category || !name || !subCategory) {
      alert("카테고리, 소분류, 물품 이름을 입력해 주세요.");
      return;
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      categoryId: category.id,
      categoryName: category.name,
      subCategory,
      name,
      detail: productForm.detail.trim() || name,
      isCustom: true
    };

    const next = [...customItems, newItem];
    setCustomItems(next);
    await saveCustomItems(next);
    setProductForm(emptyProductForm);
    setMessage({ type: "success", text: "물품이 추가되었습니다." });
  };

  const removeCustomItem = async (id) => {
    const next = customItems.filter((item) => item.id !== id);
    setCustomItems(next);
    await saveCustomItems(next);
    await removeImg(id);
    setMessage({ type: "success", text: "물품이 삭제되었습니다." });
  };

  if (page === "quote") {
    return (
      <>
        <QuotePage
          products={products}
          form={form}
          setForm={setForm}
          qty={qty}
          changeQty={changeQty}
          setQtyValue={setQtyValue}
          open={open}
          setOpen={setOpen}
          images={images}
          sendQuote={sendQuote}
          back={back}
          setPage={setPage}
          setPrevResult={setPrevResult}
          setPrevError={setPrevError}
        />
        <Modal message={message} onClose={() => setMessage(null)} />
      </>
    );
  }

  if (page === "prev") {
    return (
      <PreviousInquiryPage
        setPage={setPage}
        prevPhone={prevPhone}
        setPrevPhone={setPrevPhone}
        prevPass={prevPass}
        setPrevPass={setPrevPass}
        checkPrev={checkPrev}
        prevError={prevError}
        prevResult={prevResult}
      />
    );
  }

  if (page === "admin") {
    return (
      <>
        <AdminPage
          products={products}
          inquiries={inquiries}
          currentInquiry={currentInquiry}
          setSelectedInquiryId={setSelectedInquiryId}
          setInquiries={setInquiries}
          back={back}
          adminSection={adminSection}
          setAdminSection={setAdminSection}
          catImages={catImages}
          images={images}
          uploadCat={uploadCat}
          upload={upload}
          removeCatImg={removeCatImg}
          removeImg={removeImg}
          productForm={productForm}
          setProductForm={setProductForm}
          addCustomItem={addCustomItem}
          removeCustomItem={removeCustomItem}
        />
        <Modal message={message} onClose={() => setMessage(null)} />
      </>
    );
  }

  if (selected) {
    return (
      <ProductPages
        selected={selected}
        sub={sub}
        setSub={setSub}
        setPage={setPage}
        back={back}
        images={images}
      />
    );
  }

  return (
    <>
      <HomePage
        products={products}
        filteredProducts={filteredProducts}
        search={search}
        setSearch={setSearch}
        setPage={setPage}
        setSelected={setSelected}
        catImages={catImages}
        setAdminOpen={setAdminOpen}
      />

      {adminOpen && (
        <div className="overlay">
          <div className="modal">
            <h2>관리자 모드</h2>
            <p>관리자 코드를 입력하세요.</p>
            <input
              className="input"
              value={adminCode}
              onChange={(event) => setAdminCode(event.target.value)}
              placeholder="관리자 코드"
            />
            {adminError && <div className="box">{adminError}</div>}
            <div className="btns">
              <button className="primary" onClick={login}>로그인</button>
              <button onClick={() => setAdminOpen(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
