export default function EmailField({ form, setForm }) {
  return (
    <div className="field email">
      <label>이메일</label>
      <div className="emailrow">
        <input
          className="input"
          value={form.emailLocal}
          onChange={(event) => setForm({ ...form, emailLocal: event.target.value })}
          placeholder="이메일"
        />
        <span>@</span>
        {form.emailDomain === "custom" ? (
          <input
            className="input domain"
            value={form.emailCustom}
            onChange={(event) => setForm({ ...form, emailCustom: event.target.value })}
            placeholder="직접 입력"
          />
        ) : (
          <select
            value={form.emailDomain}
            onChange={(event) => setForm({ ...form, emailDomain: event.target.value })}
          >
            <option>naver.com</option>
            <option>gmail.com</option>
            <option>hanmail.net</option>
            <option>nate.com</option>
            <option>hotmail.com</option>
            <option value="custom">직접 입력</option>
          </select>
        )}
      </div>
    </div>
  );
}
