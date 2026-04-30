export default function PhotoBox({ item, images, onUpload, onRemove, large = false }) {
  const photos = images[item.id] || [];
  const src = photos[0];

  return (
    <div className={`photo ${large ? "photo-large" : ""}`}>
      {src ? (
        <img src={src} alt={item.name} />
      ) : (
        <div className="empty">{onUpload ? "사진 첨부" : "이미지 준비중"}</div>
      )}

      {photos.length > 1 && <div className="count">+{photos.length - 1}</div>}

      {onUpload && onRemove && photos.length > 0 && (
        <button
          className="remove-photo"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(item.id);
          }}
        >
          삭제
        </button>
      )}

      {onUpload && (
        <label onClick={(event) => event.stopPropagation()}>
          사진 추가
          <input
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onUpload(item.id, event.target.files)}
          />
        </label>
      )}
    </div>
  );
}
