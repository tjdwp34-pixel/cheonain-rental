import PhotoBox from "./PhotoBox";

function groupBySubCategory(items) {
  return Object.entries(
    items.reduce((acc, item) => {
      (acc[item.subCategory] ??= []).push(item);
      return acc;
    }, {})
  );
}

export default function ProductPages({
  selected,
  sub,
  setSub,
  setPage,
  back,
  images
}) {
  if (sub && selected) {
    return (
      <div className="page">
        <div className="wrap">
          <button className="back" onClick={back}>← 목록으로</button>
          <button className="back" onClick={() => setSub(null)}>← {selected.name}</button>

          <div className="panel">
            <h1 className="detail-title">{sub.name}</h1>
            <PhotoBox item={sub} images={images} large />
            <p className="text">{sub.detail}</p>

            <h3>추가 사진</h3>
            <div className="grid">
              {(images[sub.id] || []).map((src, index) => (
                <div className="photo" key={`${src}-${index}`}>
                  <img src={src} alt={`${sub.name} ${index + 1}`} />
                </div>
              ))}
            </div>

            <div className="btns">
              <button className="primary" onClick={() => setPage("quote")}>견적 문의하기</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selected) return null;

  return (
    <div className="page">
      <div className="wrap">
        <button className="back" onClick={back}>← 목록으로</button>

        <div className="panel">
          <h1 className="detail-title">{selected.name}</h1>
          <p className="text">{selected.desc}</p>

          {groupBySubCategory(selected.items).map(([group, items]) => (
            <div className="group" key={group}>
              <h3>{group}</h3>
              <div className="item-grid">
                {items.map((item) => (
                  <div className="item" key={item.id} onClick={() => setSub(item)}>
                    <PhotoBox item={item} images={images} />
                    <div className="body">
                      <b>{item.name}</b>
                      {item.isCustom && <span className="custom-tag">추가</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="btns">
            <button className="primary" onClick={() => setPage("quote")}>견적 문의하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
