import PhotoBox from "./PhotoBox";

function groupSubCategories(products) {
  return [...new Set(products.flatMap((product) => product.items.map((item) => item.subCategory)))];
}

export default function AdminPage({
  products,
  inquiries,
  currentInquiry,
  setSelectedInquiryId,
  setInquiries,
  back,
  adminSection,
  setAdminSection,
  catImages,
  images,
  uploadCat,
  upload,
  removeCatImg,
  removeImg,
  productForm,
  setProductForm,
  addCustomItem,
  removeCustomItem
}) {
  const subCategories = groupSubCategories(products);

  return (
    <div className="page">
      <div className="wrap">
        <button className="back" onClick={back}>← 메인으로 돌아가기</button>

        <div className="panel">
          <h1 className="detail-title">관리자 모드</h1>

          {adminSection === "menu" && (
            <>
              <p className="text">관리할 메뉴를 선택하세요.</p>
              <div className="grid">
                <div className="card" onClick={() => setAdminSection("products")}>
                  <div className="body">
                    <h3 className="title">사이트 물품 관리</h3>
                    <p className="text">물품 추가, 대표 사진, 품목 사진을 관리합니다.</p>
                  </div>
                </div>
                <div className="card" onClick={() => setAdminSection("quotes")}>
                  <div className="body">
                    <h3 className="title">견적 확인</h3>
                    <p className="text">접수된 견적 문의를 확인하고 삭제합니다.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {adminSection !== "menu" && (
            <div className="btns">
              <button onClick={() => setAdminSection("menu")}>← 관리자 메뉴로</button>
            </div>
          )}

          {adminSection === "quotes" && (
            !inquiries.length ? (
              <div className="box">아직 접수된 문의가 없습니다.</div>
            ) : (
              <div className="admin">
                <div>
                  {inquiries.map((inquiry, index) => (
                    <div
                      key={inquiry.id}
                      className={`admin-card ${currentInquiry?.id === inquiry.id ? "active" : ""}`}
                      onClick={() => setSelectedInquiryId(inquiry.id)}
                    >
                      <h3>{inquiry.name}</h3>
                      <p>{`문의 번호 : ${inquiries.length - index}
연락처 : ${inquiry.phone}
행사일 : ${inquiry.eventDate}`}</p>
                      <small>{inquiry.createdAt}</small>
                    </div>
                  ))}
                </div>

                <div>
                  {currentInquiry && (
                    <div className="admin-card">
                      <h3>{currentInquiry.name}</h3>
                      <p className="text">{`업체명 : ${currentInquiry.company}
연락처 : ${currentInquiry.phone}
이메일 : ${currentInquiry.email}
행사 장소 : ${currentInquiry.location}
행사일 : ${currentInquiry.eventDate}
접수 시간 : ${currentInquiry.createdAt}`}</p>

                      <div className="box">
                        {currentInquiry.items.map((item) => `- ${item.categoryName} / ${item.name} : ${item.quantity}개`).join("\n")}
                      </div>

                      <button
                        className="danger"
                        onClick={() => {
                          setInquiries((prev) => prev.filter((item) => item.id !== currentInquiry.id));
                          setSelectedInquiryId(null);
                        }}
                      >
                        견적 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {adminSection === "products" && (
            <div className="admin-products">
              <h2>사이트 물품 관리</h2>
              <p className="text">물품과 사진은 Firebase 서버에 저장되어 모든 도메인과 기기에서 함께 표시됩니다.</p>

              <div className="box compact-form">
                <h3>물품 추가</h3>

                <div className="compact-row">
                  <div className="field">
                    <label>카테고리</label>
                    <select
                      className="input"
                      value={productForm.categoryId}
                      onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>소분류</label>
                    <input
                      className="input"
                      placeholder="소분류 선택/입력"
                      value={productForm.subCategory}
                      list="subCategoryList"
                      onChange={(event) => setProductForm({ ...productForm, subCategory: event.target.value })}
                    />
                  </div>
                </div>

                <datalist id="subCategoryList">
                  {subCategories.map((subCategory) => (
                    <option key={subCategory} value={subCategory} />
                  ))}
                </datalist>

                <div className="hint-list">
                  {subCategories.slice(0, 12).map((subCategory) => (
                    <button
                      className="hint-chip"
                      key={subCategory}
                      onClick={() => setProductForm({ ...productForm, subCategory })}
                    >
                      {subCategory}
                    </button>
                  ))}
                </div>

                <div className="compact-row product-name-row">
                  <div className="field">
                    <label>물품 이름</label>
                    <input
                      className="input"
                      placeholder="물품 이름"
                      value={productForm.name}
                      onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                    />
                  </div>
                </div>

                <div className="field product-detail-field">
                  <label>상세 설명</label>
                  <textarea
                    className="input"
                    placeholder="상세 설명"
                    rows={4}
                    value={productForm.detail}
                    onChange={(event) => setProductForm({ ...productForm, detail: event.target.value })}
                  />
                </div>

                <button className="primary product-add-button" onClick={addCustomItem}>추가</button>
              </div>

              {products.map((product) => (
                <div className="cat" key={product.id}>
                  <div className="cathead">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.desc}</p>
                    </div>
                  </div>

                  <div className="qgrid fixed-five-grid">
                    <div className="qitem">
                      <PhotoBox item={product} images={catImages} onUpload={uploadCat} onRemove={removeCatImg} />
                      <p><b>{product.name} 대표 사진</b></p>
                    </div>

                    {product.items.map((item) => (
                      <div className="qitem" key={item.id}>
                        <PhotoBox item={item} images={images} onUpload={upload} onRemove={removeImg} />
                        <p>
                          <b>{item.name}</b>
                          {item.isCustom && <span className="custom-tag">추가</span>}
                        </p>
                        {item.isCustom && (
                          <button className="danger" onClick={() => removeCustomItem(item.id)}>물품 삭제</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
