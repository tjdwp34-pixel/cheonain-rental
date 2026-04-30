export default function Modal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <h2>{message.type === "success" ? "완료" : "확인"}</h2>
        <p>{message.text}</p>
        <div className="btns">
          <button className="primary" onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  );
}
