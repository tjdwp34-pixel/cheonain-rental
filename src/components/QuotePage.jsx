import EmailField from "./EmailField";
import PhotoBox from "./PhotoBox";

function groupBySubCategory(items) {
  return Object.entries(
    items.reduce((acc, item) => {
      (acc[item.subCategory] ??= []).push(item);
      return acc;
    }, {})
  );
}

export default function QuotePage({
  products,
  form,
  setForm,
  qty,
  changeQty,
  setQtyValue,
  open,
  setOpen,
  images,
  sendQuote,
  back,
  setPage,
  setPrevResult,
  setPrevError
}) {
  return (
    <div className="page">
      <div className="wrap">
        <button className="back" onClick={back}>← 메인으로 돌아가기</button>

        <div className="panel">
          <div className="head">
            <div>
              <h1 className="detail-title">견적 문의</h1>
              <p className="text">카테고리를 누르면 아래로 품목이 열립니다.</p>
            </div>
            <button className="primary" onClick={sendQuote}>보내기</button>
          </div>

          <div className="btns">
            <button onClick={() => {
              setPage("prev");
              setPrevResult(null);
              setPrevError("");
            }}>
              이전 견적 문의 확인하기
            </button>
          </div>

          <div className="formgrid">
            <div className="field">
              <label>성함</label>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="field">
              <label>업체명</label>
              <input className="input" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            </div>
            <div className="field">
              <label>연락처</label>
              <input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            <EmailField form={form} setForm={setForm} />
            <div className="field">
              <label>비밀번호</label>
              <input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>
            <div className="field">
              <label>행사 장소</label>
              <input className="input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </div>
            <div className="field">
              <label>행사일</label>
              <input className="input" type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} />
            </div>
          </div>

          <div className="field notes-field">
            <label>추가 요청사항</label>
            <textarea className="input" rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>

          {products.map((product) => (
            <div className="cat" key={product.id}>
              <div className="cathead" onClick={() => setOpen((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}>
                <div>
                  <h2>{product.name}</h2>
                  <p>{product.desc}</p>
                </div>
                <b>{open[product.id] ? "−" : "+"}</b>
              </div>

              {open[product.id] && groupBySubCategory(product.items).map(([group, items]) => (
                <div key={group}>
                  <h3 className="sub-title">{group}</h3>
                  <div className="qgrid fixed-five-grid">
                    {items.map((item) => (
                      <div className="qitem" key={item.id}>
                        <PhotoBox item={item} images={images} />
                        <p><b>{item.name}</b></p>
                        <div className="qty">
                          <button onClick={() => changeQty(item.id, -1)}>−</button>
                          <input value={qty[item.id] || ""} onChange={(event) => setQtyValue(item.id, event.target.value.replace(/[^0-9]/g, ""))} />
                          <button onClick={() => changeQty(item.id, 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="btns">
            <button className="primary" onClick={sendQuote}>보내기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
