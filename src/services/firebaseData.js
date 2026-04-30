import { doc, getDoc, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

export async function loadImageMap(collectionName, ids) {
  const result = {};

  await Promise.all(ids.map(async (id) => {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) return;

    const urls = snap.data().urls || [];
    if (urls.length) result[id] = urls;
  }));

  return result;
}

export async function uploadImageFiles(collectionName, folderName, id, files, previousUrls = []) {
  const arr = Array.from(files || []);
  if (!arr.length) return previousUrls;

  const uploadedUrls = [];

  for (const file of arr) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageRef = ref(storage, `${folderName}/${id}/${Date.now()}_${safeName}`);
    await uploadBytes(storageRef, file);
    uploadedUrls.push(await getDownloadURL(storageRef));
  }

  const urls = [...previousUrls, ...uploadedUrls];
  await setDoc(doc(db, collectionName, id), { urls });
  return urls;
}

export async function clearImages(collectionName, id, urls = []) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        await deleteObject(ref(storage, url));
      } catch (error) {
        console.warn("이미 삭제되었거나 Storage 삭제 권한이 없습니다:", error);
      }
    })
  );

  await setDoc(doc(db, collectionName, id), { urls: [] });
}

export async function loadCustomItems() {
  const snap = await getDoc(doc(db, "siteData", "customItems"));
  if (!snap.exists()) return [];
  return snap.data().items || [];
}

export async function saveCustomItems(items) {
  await setDoc(doc(db, "siteData", "customItems"), { items });
}
