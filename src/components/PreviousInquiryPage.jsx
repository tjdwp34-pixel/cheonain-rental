export default function PreviousInquiryPage({
  setPage,
  prevPhone,
  setPrevPhone,
  prevPass,
  setPrevPass,
  checkPrev,
  prevError,
  prevResult
}) {
  return (
    <div className="page">
      <div className="wrap">
        <div className="panel">
          <button className="back" onClick={() => setPage("quote")}>← 견적 문의로 돌아가기</button>
          <h1 className="detail-title">이전 견적 문의 확인하기</h1>

          <div className="prev-form">
            <div className="field">
              <label>연락처</label>
              <input className="input" value={prevPhone} onChange={(event) => setPrevPhone(event.target.value)} />
            </div>
            <div className="field previous-password">
              <label>비밀번호</label>
              <input className="input" type="password" value={prevPass} onChange={(event) => setPrevPass(event.target.value)} />
            </div>
          </div>

          <div className="btns">
            <button className="primary" onClick={checkPrev}>확인</button>
          </div>

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
        </div>
      </div>
    </div>
  );
}
