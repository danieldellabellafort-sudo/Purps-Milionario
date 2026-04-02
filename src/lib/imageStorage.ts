import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const saveEntryImage = async (base64Data: string): Promise<string> => {
  const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await setDoc(doc(db, "entry_images_v2", uniqueId), {
    data: base64Data
  });
  return uniqueId;
};

export const getEntryImage = async (imageId: string): Promise<string | null> => {
  try {
    const d = await getDoc(doc(db, "entry_images_v2", imageId));
    if (d.exists()) {
      return d.data().data;
    }
  } catch (e) {
    console.error("Falha ao recuperar a imagem:", e);
  }
  return null;
};
