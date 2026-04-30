import PhotoBox from "./PhotoBox";

export default function HomePage({
  products,
  filteredProducts,
  search,
  setSearch,
  setPage,
  setSelected,
  catImages,
  setAdminOpen
}) {
  return (
    <div className="page">
      <button className="admin-fab" onClick={() => setAdminOpen(true)}>관리자 모드</button>

      <div className="wrap">
        <div className="hero">
          <h1 className="brand">천아인 렌탈</h1>
          <p className="subtitle">행사에 필요한 모든 장비, 한 번에 빠르게 렌탈하세요.</p>
          <div className="btns">
            <button className="primary" onClick={() => setPage("quote")}>견적 문의</button>
          </div>
        </div>

        <div className="head">
          <h2>렌탈 품목 카테고리</h2>
          <div className="search">
            <span className="icon">🔍</span>
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="제품 검색"
            />
          </div>
        </div>

        <div className="grid">
          {filteredProducts.map((product) => (
            <div className="card" key={product.id} onClick={() => setSelected(product)}>
              <PhotoBox item={product} images={catImages} />
              <div className="body">
                <h3 className="title">{product.name}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="footer">사업자등록번호 753-77-00504 | 대표자 김동혁</div>
      </div>
    </div>
  );
}
